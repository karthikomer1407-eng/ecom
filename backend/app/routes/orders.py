import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime  # noqa: F401
from pathlib import Path
from typing import Any

import razorpay
from dotenv import load_dotenv
from flask import Blueprint, current_app, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import (
    Cart,
    Order,
    OrderItem,
    Product,
    RazorpayWebhookEvent,
)
from app.routes.auth import token_required

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
if ENV_FILE.is_file():
    load_dotenv(ENV_FILE, override=True)

DEFAULT_RAZORPAY_KEY_ID = "rzp_live_Tw49qARd7wTsXH"
DEFAULT_RAZORPAY_KEY_SECRET = "uuzvtMqXx13NiV99KJhYOAuA"
DEFAULT_RAZORPAY_WEBHOOK_SECRET = "Dcruiz1407"


def _is_configured_credential(value):
    if not value or not str(value).strip():
        return False
    normalized = str(value).strip().lower()
    return not any(
        marker in normalized
        for marker in ("your_", "replace_me", "placeholder", "example")
    )


env_key_id = os.getenv("RAZORPAY_KEY_ID")
env_key_secret = os.getenv("RAZORPAY_KEY_SECRET")
env_webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")

RAZORPAY_KEY_ID = env_key_id if _is_configured_credential(env_key_id) else DEFAULT_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET = env_key_secret if _is_configured_credential(env_key_secret) else DEFAULT_RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET = env_webhook_secret if _is_configured_credential(env_webhook_secret) else DEFAULT_RAZORPAY_WEBHOOK_SECRET

razorpay_client: Any = None
if _is_configured_credential(RAZORPAY_KEY_ID) and _is_configured_credential(
    RAZORPAY_KEY_SECRET
):
    razorpay_client = razorpay.Client(
        auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
    )
print("Razorpay client initialized:", bool(razorpay_client))

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

def finalize_paid_order(order, payment_id):
    # Prevent duplicate stock deduction
    if order.payment_status == "Paid":
        if order.razorpay_payment_id != payment_id:
            return jsonify({
                "error": "This order has already been paid"
            }), 409

        return jsonify({
            "message": "Payment already verified",
            "order_id": order.id,
            "payment_status": order.payment_status
        }), 200

    # Fetch products belonging to this order
    product_ids = [item.product_id for item in order.items]

    products = {
        product.id: product
        for product in Product.query.filter(
            Product.id.in_(product_ids)
        ).with_for_update().all()
    }

    # Check stock before deducting
    stock_issues = [
        item.product_name
        for item in order.items
        if item.product_id not in products
        or products[item.product_id].stock < item.quantity
    ]

    # Update payment and order status
    order.razorpay_payment_id = payment_id
    order.payment_status = "Paid"
    order.status = "Processing"

    # Deduct stock only if all products are available
    if not stock_issues:
        for item in order.items:
            products[item.product_id].stock -= item.quantity

    # Clear the cart
    cart = Cart.query.filter_by(
        session_id=order.cart_session_id
    ).first()

    if cart:
        cart.items.clear()

    try:
        db.session.commit()

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Could not finalize the paid order"
        )

        return jsonify({
            "error": "Payment verified, but the order update failed"
        }), 500

    response = {
        "message": "Payment verified",
        "order_id": order.id,
        "payment_status": order.payment_status
    }

    if stock_issues:
        response["stock_issue"] = True
        response["stock_issue_products"] = stock_issues

    return jsonify(response), 200

@orders_bp.route("/create-payment-order", methods=["POST"])
def create_payment_order():
    global razorpay_client
    if not razorpay_client:
        if _is_configured_credential(RAZORPAY_KEY_ID) and _is_configured_credential(RAZORPAY_KEY_SECRET):
            razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

    if not razorpay_client:
        return jsonify({
            "error": (
                "Razorpay credentials are missing or still placeholders. "
                "Set real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET values "
                "in backend/.env, then restart Flask."
            )
        }), 500

    session_id = request.headers.get("X-Cart-Session")
    if not session_id:
        return jsonify({"error": "Cart session ID is required"}), 400

    cart = Cart.query.filter_by(session_id=session_id).first()
    if not cart or not cart.items:
        return jsonify({"error": "Your cart is empty"}), 400

    data = request.get_json(silent=True) or {}
    shipping = data.get("shipping")
    if not isinstance(shipping, dict):
        return jsonify({"error": "Shipping information is required"}), 400

    required_fields = [
        "fullName", "email", "phone",
        "address", "city", "postalCode",
    ]
    if any(
        not isinstance(shipping.get(field), str)
        or not shipping[field].strip()
        for field in required_fields
    ):
        return jsonify({"error": "Please complete all shipping fields"}), 400

    total_amount = 0
    for cart_item in cart.items:
        product = cart_item.product
        if not product or product.stock < cart_item.quantity:
            product_name = product.name if product else "a cart item"
            return jsonify({
                "error": f"Sorry, we don't have enough stock for {product_name}."
            }), 400

        price = product.sale_price if product.sale_price is not None else product.price
        total_amount += price * cart_item.quantity

    if total_amount <= 0:
        return jsonify({"error": "The cart total must be greater than zero"}), 400

    new_order = Order(
        full_name=shipping["fullName"].strip(),
        email=shipping["email"].strip(),
        phone=shipping["phone"].strip(),
        address=shipping["address"].strip(),
        city=shipping["city"].strip(),
        postal_code=shipping["postalCode"].strip(),
        total_amount=total_amount,
        status="Pending",
        payment_status="Pending",
        cart_session_id=session_id,
    )

    db.session.add(new_order)
    try:
        db.session.flush()

        for cart_item in cart.items:
            product = cart_item.product
            price = product.sale_price if product.sale_price is not None else product.price
            db.session.add(OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=cart_item.quantity,
                price_at_purchase=price,
            ))

    except Exception:
        db.session.rollback()
        current_app.logger.exception("Could not prepare the pending order")
        return jsonify({"error": "Unable to prepare payment order"}), 500

    try:
        payment_order = razorpay_client.order.create(data={
            "amount": round(total_amount * 100),
            "currency": "INR",
            "receipt": f"order_{uuid.uuid4().hex[:24]}",
            "notes": {"local_order_id": str(new_order.id)},
        })
    except Exception as e:  # noqa: BLE001
        import traceback

        db.session.rollback()
        print("RAZORPAY ERROR TYPE:", type(e).__name__)
        print("RAZORPAY ERROR DETAILS:", repr(e))
        traceback.print_exc()
        return jsonify({
            "error": "Razorpay could not create the payment order",
            "error_type": type(e).__name__,
            "details": str(e),
        }), 502

    new_order.razorpay_order_id = payment_order["id"]
    try:
        db.session.commit()
    except Exception as error:
        db.session.rollback()
        current_app.logger.exception(
            "Could not save the pending order after Razorpay created its order"
        )
        return jsonify({
            "error": "Unable to save the pending order",
            "error_type": type(error).__name__,
        }), 500

    return jsonify({
        "order_id": payment_order["id"],
        "local_order_id": new_order.id,
        "key_id": RAZORPAY_KEY_ID,
        "razorpay_order_id": payment_order["id"],
        "razorpay_key_id": RAZORPAY_KEY_ID,
        "amount": payment_order["amount"],
        "currency": payment_order["currency"],
    }), 201


@orders_bp.route("/verify-payment", methods=["POST"])
def verify_payment():
    if not razorpay_client:
        return jsonify({"error": "Payment gateway is not configured"}), 500

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Payment details are required"}), 400

    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")
    if not all(
        isinstance(value, str) and value.strip()
        for value in (razorpay_order_id, razorpay_payment_id, razorpay_signature)
    ):
        return jsonify({"error": "Payment details are incomplete"}), 400

    order = Order.query.filter_by(
        razorpay_order_id=razorpay_order_id
    ).with_for_update().first()
    if not order:
        return jsonify({"error": "Payment order not found"}), 404

    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": order.razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
        })
    except Exception:  # noqa: BLE001
        db.session.rollback()
        return jsonify({"error": "Payment signature verification failed"}), 400

    try:
        payment = razorpay_client.payment.fetch(razorpay_payment_id)
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Could not fetch Razorpay payment status")
        return jsonify({"error": "Could not verify payment status"}), 502

    expected_amount = round(order.total_amount * 100)
    if (
        payment.get("order_id") != order.razorpay_order_id
        or payment.get("amount") != expected_amount
        or payment.get("currency") != "INR"
    ):
        db.session.rollback()
        return jsonify({"error": "Payment does not match this order"}), 400

    if payment.get("status") != "captured":
        db.session.rollback()
        return jsonify({
            "error": "Payment has not been captured yet",
            "payment_status": payment.get("status"),
        }), 409

    return finalize_paid_order(
        order,
        razorpay_payment_id,
    )


# ==========================================
# PUBLIC ROUTE (Placing an order)
# ==========================================
@orders_bp.route("/", methods=["POST"])
def place_order():
    session_id = request.headers.get("X-Cart-Session")
    if not session_id:
        return jsonify({"error": "Cart session ID is required"}), 400

    cart = Cart.query.filter_by(session_id=session_id).first()
    if not cart or not cart.items:
        return jsonify({"error": "Your cart is empty"}), 400

    data = request.get_json()
    shipping = data.get("shipping")
    if not shipping:
        return jsonify({"error": "Shipping information is required"}), 400

    new_order = Order(
        full_name=shipping.get("fullName"),
        email=shipping.get("email"),
        phone=shipping.get("phone"),
        address=shipping.get("address"),
        city=shipping.get("city"),
        postal_code=shipping.get("postalCode"),
        total_amount=0.0
    )
    
    db.session.add(new_order)
    db.session.flush()

    total_amount = 0

    for cart_item in cart.items:
        product = cart_item.product
        if product.stock < cart_item.quantity:
            db.session.rollback()
            return jsonify({"error": f"Sorry, we don't have enough stock for {product.name}."}), 400

        price = product.sale_price if product.sale_price is not None else product.price
        total_amount += (price * cart_item.quantity)

        order_item = OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            product_name=product.name,
            quantity=cart_item.quantity,
            price_at_purchase=price
        )
        db.session.add(order_item)
        product.stock -= cart_item.quantity
        db.session.delete(cart_item)

    new_order.total_amount = total_amount
    db.session.commit()

    return jsonify({"message": "Order placed successfully", "order_id": new_order.id}), 201


# ==========================================
# SECURE ADMIN ROUTES (Viewing/Updating)
# ==========================================

# GET ALL ORDERS
@orders_bp.route("/", methods=["GET"])
@token_required
def get_all_orders():
    # Fetch orders, newest first
    orders = Order.query.order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        items = []
        for item in order.items:
            items.append({
                "id": item.id,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "price": item.price_at_purchase
            })
            
        result.append({
            "id": order.id,
            "full_name": order.full_name,
            "email": order.email,
            "phone": order.phone,
            "address": f"{order.address}, {order.city} - {order.postal_code}",
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at.strftime("%b %d, %Y - %I:%M %p"),
            "items": items
        })
        
    return jsonify(result), 200

# UPDATE ORDER STATUS
@orders_bp.route("/<int:id>/status", methods=["PUT"])
@token_required
def update_order_status(id):
    order = Order.query.get(id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    data = request.get_json()
    new_status = data.get("status")
    
    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    order.status = new_status
    db.session.commit()

    return jsonify({"message": "Order status updated", "status": order.status}), 200


# RAZORPAY WEBHOOK ENDPOINT
@orders_bp.route("/razorpay-webhook", methods=["POST"])
def razorpay_webhook():
    webhook_secret = RAZORPAY_WEBHOOK_SECRET
    if not webhook_secret:
        return jsonify({"error": "Webhook secret not configured"}), 500

    # Get original request body
    raw_body = request.get_data(cache=True)

    # Verify Razorpay signature
    signature = request.headers.get("X-Razorpay-Signature")
    if not signature:
        return jsonify({"error": "Missing signature"}), 400

    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        return jsonify({"error": "Invalid signature"}), 400

    # Get unique event ID
    event_id = request.headers.get("X-Razorpay-Event-Id")
    if not event_id:
        return jsonify({"error": "Missing event ID"}), 400

    # Parse verified payload
    try:
        payload = json.loads(raw_body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return jsonify({"error": "Invalid JSON"}), 400

    event_type = payload.get("event")
    if not event_type:
        return jsonify({"error": "Missing event type"}), 400

    # Store the event
    webhook_event = RazorpayWebhookEvent(
        event_id=event_id,
        event_type=event_type,
        processing_status="Received",
    )
    try:
        db.session.add(webhook_event)
        db.session.commit()
    except IntegrityError:
        # This event ID has already been received
        db.session.rollback()
        return jsonify({"message": "Duplicate event ignored"}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed to save Razorpay webhook event")
        return jsonify({"error": "Could not save webhook event"}), 500

    return jsonify({
        "message": "Webhook received successfully",
        "event": event_type,
    }), 200


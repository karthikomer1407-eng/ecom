from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Cart, CartItem, Product

cart_bp = Blueprint(
    "cart",
    __name__,
    url_prefix="/api/cart"
)


def get_or_create_cart(session_id):
    cart = Cart.query.filter_by(session_id=session_id).first()

    if not cart:
        cart = Cart(session_id=session_id)
        db.session.add(cart)
        db.session.commit()

    return cart


def cart_response(cart):
    items = []

    subtotal = 0

    for item in cart.items:
        product = item.product

        price = (
            product.sale_price
            if product.sale_price is not None
            else product.price
        )

        item_total = price * item.quantity
        subtotal += item_total

        items.append({
            "id": item.id,
            "product_id": product.id,
            "name": product.name,
            "image": product.image,
            "price": product.price,
            "sale_price": product.sale_price,
            "quantity": item.quantity,
            "stock": product.stock,
            "item_total": item_total
        })

    return {
        "cart_id": cart.id,
        "items": items,
        "subtotal": subtotal,
        "total": subtotal
    }


# GET CART
@cart_bp.route("/", methods=["GET"])
def get_cart():

    session_id = request.headers.get("X-Cart-Session")

    if not session_id:
        return jsonify({
            "error": "Cart session ID is required"
        }), 400

    cart = get_or_create_cart(session_id)

    return jsonify(cart_response(cart)), 200


# ADD TO CART
@cart_bp.route("/", methods=["POST"])
def add_to_cart():

    session_id = request.headers.get("X-Cart-Session")

    if not session_id:
        return jsonify({
            "error": "Cart session ID is required"
        }), 400

    data = request.get_json()

    if not data or not data.get("product_id"):
        return jsonify({
            "error": "product_id is required"
        }), 400

    product_id = data["product_id"]
    quantity = data.get("quantity", 1)

    if quantity < 1:
        return jsonify({
            "error": "Quantity must be at least 1"
        }), 400

    product = Product.query.get(product_id)

    if not product:
        return jsonify({
            "error": "Product not found"
        }), 404

    if product.stock <= 0:
        return jsonify({
            "error": "Product is out of stock"
        }), 400

    if quantity > product.stock:
        return jsonify({
            "error": "Not enough stock available"
        }), 400

    cart = get_or_create_cart(session_id)

    cart_item = CartItem.query.filter_by(
        cart_id=cart.id,
        product_id=product_id
    ).first()

    if cart_item:

        new_quantity = cart_item.quantity + quantity

        if new_quantity > product.stock:
            return jsonify({
                "error": "Not enough stock available"
            }), 400

        cart_item.quantity = new_quantity

    else:

        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity
        )

        db.session.add(cart_item)

    db.session.commit()

    return jsonify({
        "message": "Product added to cart",
        "cart": cart_response(cart)
    }), 200


# UPDATE CART ITEM
@cart_bp.route("/items/<int:item_id>", methods=["PUT"])
def update_cart_item(item_id):

    session_id = request.headers.get("X-Cart-Session")

    if not session_id:
        return jsonify({
            "error": "Cart session ID is required"
        }), 400

    data = request.get_json()

    quantity = data.get("quantity")

    if quantity is None or quantity < 1:
        return jsonify({
            "error": "Valid quantity is required"
        }), 400

    cart = Cart.query.filter_by(
        session_id=session_id
    ).first()

    if not cart:
        return jsonify({
            "error": "Cart not found"
        }), 404

    item = CartItem.query.filter_by(
        id=item_id,
        cart_id=cart.id
    ).first()

    if not item:
        return jsonify({
            "error": "Cart item not found"
        }), 404

    if quantity > item.product.stock:
        return jsonify({
            "error": "Not enough stock available"
        }), 400

    item.quantity = quantity

    db.session.commit()

    return jsonify({
        "message": "Cart updated",
        "cart": cart_response(cart)
    }), 200


# REMOVE CART ITEM
@cart_bp.route("/items/<int:item_id>", methods=["DELETE"])
def remove_cart_item(item_id):

    session_id = request.headers.get("X-Cart-Session")

    if not session_id:
        return jsonify({
            "error": "Cart session ID is required"
        }), 400

    cart = Cart.query.filter_by(
        session_id=session_id
    ).first()

    if not cart:
        return jsonify({
            "error": "Cart not found"
        }), 404

    item = CartItem.query.filter_by(
        id=item_id,
        cart_id=cart.id
    ).first()

    if not item:
        return jsonify({
            "error": "Cart item not found"
        }), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({
        "message": "Item removed from cart",
        "cart": cart_response(cart)
    }), 200
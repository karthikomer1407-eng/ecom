import html
import os
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr

from flask import current_app


def _environment_flag(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def send_order_confirmation(order):
    """Send the customer a receipt after their payment has been captured."""
    host = os.getenv("SMTP_HOST")
    sender = os.getenv("SMTP_FROM_EMAIL") or os.getenv("SMTP_USERNAME")

    if not host or not sender:
        current_app.logger.warning(
            "Order confirmation email is not configured; order %s was not emailed",
            order.id,
        )
        return False

    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    use_ssl = _environment_flag("SMTP_USE_SSL")
    use_tls = _environment_flag("SMTP_USE_TLS", default=not use_ssl)
    timeout = float(os.getenv("SMTP_TIMEOUT_SECONDS", "15"))

    if bool(username) != bool(password):
        raise ValueError("SMTP_USERNAME and SMTP_PASSWORD must both be configured")
    if use_ssl and use_tls:
        raise ValueError("Enable only one of SMTP_USE_SSL and SMTP_USE_TLS")

    amount = f"INR {order.total_amount:,.2f}"
    item_lines = [
        f"- {item.product_name} x {item.quantity} - "
        f"INR {item.price_at_purchase * item.quantity:,.2f}"
        for item in order.items
    ]
    item_rows = "".join(
        "<tr>"
        f"<td style=\"padding:8px;border-bottom:1px solid #eee\">{html.escape(item.product_name)}</td>"
        f"<td style=\"padding:8px;border-bottom:1px solid #eee;text-align:center\">{item.quantity}</td>"
        f"<td style=\"padding:8px;border-bottom:1px solid #eee;text-align:right\">"
        f"INR {item.price_at_purchase * item.quantity:,.2f}</td>"
        "</tr>"
        for item in order.items
    )
    address = ", ".join(
        part for part in (order.address, order.city, order.postal_code) if part
    )

    message = EmailMessage()
    message["Subject"] = f"Your Hayati Elixirs order #{order.id} is confirmed"
    message["From"] = formataddr(
        (os.getenv("SMTP_FROM_NAME", "Hayati Elixirs"), sender)
    )
    message["To"] = order.email
    message.set_content(
        f"Hi {order.full_name},\n\n"
        f"Thank you for your purchase. Your payment has been confirmed.\n\n"
        f"Order: #{order.id}\n"
        f"Payment ID: {order.razorpay_payment_id or 'Confirmed'}\n"
        f"Total paid: {amount}\n\n"
        "Items:\n"
        + "\n".join(item_lines)
        + f"\n\nShipping to: {address}\n\n"
        "You can see your order list and progress on the Track Order page using your checkout email and phone number.\n"
        "We will send another update when your order ships.\n\n"
        "Hayati Elixirs"
    )

    escaped_name = html.escape(order.full_name)
    escaped_address = html.escape(address)
    payment_id = html.escape(order.razorpay_payment_id or "Confirmed")
    message.add_alternative(
        "<html><body style=\"font-family:Arial,sans-serif;color:#27231d\">"
        f"<p>Hi {escaped_name},</p>"
        "<p>Thank you for your purchase. Your payment has been confirmed.</p>"
        f"<p><strong>Order:</strong> #{order.id}<br>"
        f"<strong>Payment ID:</strong> {payment_id}<br>"
        f"<strong>Total paid:</strong> {amount}</p>"
        "<table style=\"border-collapse:collapse;width:100%;max-width:600px\">"
        "<thead><tr><th style=\"text-align:left;padding:8px\">Item</th>"
        "<th style=\"padding:8px\">Qty</th>"
        "<th style=\"text-align:right;padding:8px\">Amount</th></tr></thead>"
        f"<tbody>{item_rows}</tbody></table>"
        f"<p><strong>Shipping to:</strong> {escaped_address}</p>"
        "<p>You can see your order list and progress on the Track Order page with your checkout email and phone number.</p>"
        "<p>We will send another update when your order ships.</p>"
        "<p>Hayati Elixirs</p></body></html>",
        subtype="html",
    )

    context = ssl.create_default_context()
    if use_ssl:
        with smtplib.SMTP_SSL(host, port, timeout=timeout, context=context) as smtp:
            if username:
                smtp.login(username, password)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(host, port, timeout=timeout) as smtp:
            if use_tls:
                smtp.starttls(context=context)
            if username:
                smtp.login(username, password)
            smtp.send_message(message)

    return True

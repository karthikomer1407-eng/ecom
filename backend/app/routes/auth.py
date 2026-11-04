from functools import wraps

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, verify_jwt_in_request
from flask_jwt_extended.exceptions import JWTExtendedException
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from app.models import AdminUser

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    admin = AdminUser.query.filter_by(username=username).first()
    if not admin or not admin.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    token = create_access_token(identity=str(admin.id))
    return jsonify({
        "message": "Login successful",
        "username": admin.username,
        "token": token,
    }), 200


def token_required(view):
    @wraps(view)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer ") or not auth_header[7:].strip():
            return jsonify({"error": "Admin access required. Token missing."}), 401

        try:
            verify_jwt_in_request()
        except ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except (InvalidTokenError, JWTExtendedException):
            return jsonify({"error": "Invalid token. Access denied."}), 401

        return view(*args, **kwargs)

    return decorated


import os
import uuid

from flask import Blueprint, current_app, jsonify, request
from werkzeug.utils import secure_filename

upload_bp = Blueprint(
    "uploads",
    __name__,
    url_prefix="/api/uploads"
)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


@upload_bp.route("/product-image", methods=["POST"])
def upload_product_image():
    if "image" not in request.files:
        return jsonify({"error": "Please select an image"}), 400

    image = request.files["image"]

    if not image.filename:
        return jsonify({"error": "No image selected"}), 400

    filename = secure_filename(image.filename)
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": "Use a JPG, JPEG, PNG, or WEBP image"
        }), 400

    unique_filename = f"{uuid.uuid4().hex}.{extension}"

    filepath = os.path.join(
        current_app.config["UPLOAD_FOLDER"],
        unique_filename
    )

    image.save(filepath)

    return jsonify({
        "message": "Image uploaded successfully",
        "image": f"/uploads/products/{unique_filename}"
    }), 201
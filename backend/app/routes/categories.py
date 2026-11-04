from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.extensions import db
from app.models import Category

category_bp = Blueprint(
    "categories",
    __name__,
    url_prefix="/api/categories"
)


# HELPER: FORMAT CATEGORY RESPONSE
def category_to_dict(category):
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description
    }


# GET ALL CATEGORIES
@category_bp.route("/", methods=["GET"])
def get_categories():
    try:
        categories = Category.query.order_by(Category.id.asc()).all()

        return jsonify([
            category_to_dict(category)
            for category in categories
        ]), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"error": "Failed to fetch categories"}), 500


# GET ONE CATEGORY
@category_bp.route("/<int:category_id>", methods=["GET"])
def get_category(category_id):
    category = db.session.get(Category, category_id)

    if category is None:
        return jsonify({"error": "Category not found"}), 404

    return jsonify(category_to_dict(category)), 200


# CREATE CATEGORY
@category_bp.route("/", methods=["POST"])
def create_category():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A valid JSON object is required"}), 400

    name = data.get("name")

    if not isinstance(name, str) or not name.strip():
        return jsonify({"error": "Category name is required"}), 400

    name = name.strip()
    description = data.get("description")

    if description is not None and not isinstance(description, str):
        return jsonify({"error": "Description must be text"}), 400

    existing = Category.query.filter_by(name=name).first()

    if existing:
        return jsonify({"error": "A category with this name already exists"}), 409

    category = Category(
        name=name,
        description=description.strip() if description else None
    )

    try:
        db.session.add(category)
        db.session.commit()

        return jsonify({
            "message": "Category created successfully",
            "category": category_to_dict(category)
        }), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A category with this name already exists"}), 409

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"error": "Failed to create category"}), 500


# UPDATE CATEGORY
@category_bp.route("/<int:category_id>", methods=["PUT"])
def update_category(category_id):
    category = db.session.get(Category, category_id)

    if category is None:
        return jsonify({"error": "Category not found"}), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A valid JSON object is required"}), 400

    if "name" in data:
        name = data["name"]

        if not isinstance(name, str) or not name.strip():
            return jsonify({"error": "Category name cannot be empty"}), 400

        name = name.strip()

        existing = Category.query.filter(
            Category.name == name,
            Category.id != category_id
        ).first()

        if existing:
            return jsonify({
                "error": "A category with this name already exists"
            }), 409

        category.name = name

    if "description" in data:
        description = data["description"]

        if description is not None and not isinstance(description, str):
            return jsonify({"error": "Description must be text"}), 400

        category.description = (
            description.strip() if description else None
        )

    try:
        db.session.commit()

        return jsonify({
            "message": "Category updated successfully",
            "category": category_to_dict(category)
        }), 200

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Could not update category due to a database constraint"}), 409

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"error": "Failed to update category"}), 500


# DELETE CATEGORYS
@category_bp.route("/<int:category_id>", methods=["DELETE"])
def delete_category(category_id):
    category = db.session.get(Category, category_id)

    if category is None:
        return jsonify({"error": "Category not found"}), 404

    try:
        db.session.delete(category)
        db.session.commit()

        return jsonify({
            "message": "Category deleted successfully"
        }), 200

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "error": "This category may contain products. Move or remove those products before deleting it."
        }), 409

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"error": "Failed to delete category"}), 500

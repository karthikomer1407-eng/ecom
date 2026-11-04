from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Category, Product
from app.routes.auth import token_required

product_bp = Blueprint("products", __name__, url_prefix="/api/products")


# GET ALL PRODUCTS (Public - No token required)
@product_bp.route("/", methods=["GET"])
def get_products():
    sort = request.args.get("sort", "newest")

    query = Product.query

    if sort == "newest":
        query = query.order_by(Product.id.desc())
    elif sort == "oldest":
        query = query.order_by(Product.id.asc())
    elif sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "stock_asc":
        query = query.order_by(Product.stock.asc())
    else:
        query = query.order_by(Product.id.desc())

    products = query.all()

    result = []

    for product in products:
        result.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "sale_price": product.sale_price,
            "stock": product.stock,
            "image": product.image,
            "category": {
                "id": product.category.id,
                "name": product.category.name
            }
        })

    return jsonify(result), 200


# GET SINGLE PRODUCT (Public - No token required)
@product_bp.route("/<int:id>", methods=["GET"])
def get_product(id):

    product = Product.query.get(id)

    if not product:
        return jsonify({
            "error": "Product not found"
        }), 404

    return jsonify({
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "sale_price": product.sale_price,
        "stock": product.stock,
        "image": product.image,
        "category": {
            "id": product.category.id,
            "name": product.category.name
        }
    }), 200


# CREATE PRODUCT (Secured!)
@product_bp.route("/", methods=["POST"])
@token_required     # <--- ADDED HERE
def create_product():

    data = request.get_json()

    required_fields = [
        "name",
        "price",
        "stock",
        "category_id"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "error": f"{field} is required"
            }), 400

    category = Category.query.get(data["category_id"])

    if not category:
        return jsonify({
            "error": "Category not found"
        }), 404

    product = Product(
        name=data["name"],
        description=data.get("description"),
        price=data["price"],
        sale_price=data.get("sale_price"),
        stock=data["stock"],
        image=data.get("image"),
        category_id=data["category_id"]
    )

    db.session.add(product)
    db.session.commit()

    return jsonify({
        "message": "Product created successfully",
        "product": {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "stock": product.stock
        }
    }), 201


# UPDATE PRODUCT (Secured!)
@product_bp.route("/<int:id>", methods=["PUT"])
@token_required     # <--- ADDED HERE
def update_product(id):
    product = Product.query.get(id)

    if not product:
        return jsonify({
            "error": "Product not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No data provided"
        }), 400

    product.name = data.get(
        "name",
        product.name
    )

    product.description = data.get(
        "description",
        product.description
    )

    product.price = data.get(
        "price",
        product.price
    )

    product.sale_price = data.get(
        "sale_price",
        product.sale_price
    )

    product.stock = data.get(
        "stock",
        product.stock
    )

    product.image = data.get(
        "image",
        product.image
    )

    if "category_id" in data:

        category = Category.query.get(
            data["category_id"]
        )

        if not category:
            return jsonify({
                "error": "Category not found"
            }), 404

        product.category_id = data["category_id"]

    db.session.commit()

    return jsonify({
        "message": "Product updated successfully",
        "product": {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "sale_price": product.sale_price,
            "stock": product.stock,
            "image": product.image,
            "category_id": product.category_id
        }
    }), 200


# DELETE PRODUCTS (Secured!)
@product_bp.route("/<int:id>", methods=["DELETE"])
@token_required     # <--- ADDED HERE
def delete_product(id):
    product = Product.query.get(id)

    if not product:
        return jsonify({
            "error": "Product not found"
        }), 404

    db.session.delete(product)
    db.session.commit()

    return jsonify({
        "message": "Product deleted successfully"
    }), 200
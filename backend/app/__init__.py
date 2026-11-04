import os

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .extensions import db


def create_app():
    app = Flask(__name__)
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        r"^https?://localhost(:\d+)?$",
        r"^https?://127\.0\.0\.1(:\d+)?$",
    ]

    CORS(
        app,
        resources={
            r"/api/*": {"origins": cors_origins},
            r"/uploads/*": {"origins": cors_origins},
        },
        allow_headers=["Content-Type", "X-Cart-Session", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        supports_credentials=True,
    )

    # Database configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "mysql+pymysql://root@localhost/ecommerce"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.environ.get(
        "JWT_SECRET_KEY",
        "ecom-local-development-jwt-secret-change-for-deployment",
    )

    # Product image upload configuration
    upload_folder = os.path.abspath(
        os.path.join(
            app.root_path,
            "..",
            "uploads",
            "products"
        )
    )

    os.makedirs(upload_folder, exist_ok=True)

    app.config["UPLOAD_FOLDER"] = upload_folder
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

    # Initialize extensions
    db.init_app(app)
    JWTManager(app)

    # Import models (registers models with SQLAlchemy metadata)
    from .models import AdminUser, Cart, CartItem, Category, Product  # noqa: F401

    # Import routes
    from .routes.auth import auth_bp
    from .routes.cart import cart_bp
    from .routes.categories import category_bp
    from .routes.orders import orders_bp
    from .routes.products import product_bp
    from .routes.uploads import upload_bp

    # Register routes
    app.register_blueprint(auth_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(upload_bp)
    

    # Create database tables
    with app.app_context():
        db.create_all()

    # Home route
    @app.route("/")
    def home():
        return {
            "message": "E-commerce API is running!"
        }

    # Serve uploaded product images
    @app.route("/uploads/products/<path:filename>")
    def uploaded_product_image(filename):
        return send_from_directory(
            app.config["UPLOAD_FOLDER"],
            filename
        )
        

    return app

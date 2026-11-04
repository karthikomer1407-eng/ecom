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
        r"^https?://.*\.onrender\.com$",
        r"^https?://.*\.vercel\.app$",
        r"^https?://.*\.netlify\.app$",
    ]

    frontend_url = os.environ.get("FRONTEND_URL")
    if frontend_url and frontend_url not in cors_origins:
        cors_origins.append(frontend_url)

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

    # Database configuration: Cloud DB (DATABASE_URL) > SQLite fallback on Render > Local MySQL
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        # Support Render/Heroku postgres:// URL prefix with SQLAlchemy
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    elif os.environ.get("RENDER"):
        # On Render without external DATABASE_URL, fallback to SQLite instance database so it boots up cleanly
        os.makedirs(app.instance_path, exist_ok=True)
        sqlite_path = os.path.join(app.instance_path, "ecommerce.db")
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{sqlite_path}"
    else:
        # Local development default
        app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
            "LOCAL_DATABASE_URI",
            "mysql+pymysql://root@localhost/ecommerce",
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

    # Create database tables and seed if brand new
    with app.app_context():
        db.create_all()
        try:
            from .models import Category, Product
            if Category.query.count() == 0 and Product.query.count() == 0:
                cat = Category(
                    name="Perfumes",
                    description="Premium fragrances and royal oud",
                )
                db.session.add(cat)
                db.session.commit()

                sample_products = [
                    {
                        "name": "Summer Oud",
                        "description": "A powerful and long-lasting oud fragrance with a warm, elegant character.",
                        "price": 1999,
                        "sale_price": 1799,
                        "stock": 25,
                        "image": "/uploads/products/summer-oud.jpg",
                    },
                    {
                        "name": "Amber Royale",
                        "description": "A luxurious amber fragrance with warm oriental notes, creating a rich and elegant scent.",
                        "price": 2299,
                        "sale_price": 1999,
                        "stock": 20,
                        "image": "/uploads/products/amber-royale.jpg",
                    },
                    {
                        "name": "Midnight Noir",
                        "description": "A dark and sophisticated fragrance combining rich woods, warm spices and a smooth finish.",
                        "price": 2499,
                        "sale_price": 2199,
                        "stock": 18,
                        "image": "/uploads/products/midnight-noir.jpg",
                    },
                    {
                        "name": "Velvet Musk",
                        "description": "A smooth and sensual musk fragrance with a soft powdery character.",
                        "price": 1899,
                        "sale_price": 1699,
                        "stock": 30,
                        "image": "/uploads/products/velvet-musk.jpg",
                    },
                    {
                        "name": "Royal Essence",
                        "description": "An elegant premium fragrance crafted with rich woods and refined spices.",
                        "price": 2799,
                        "sale_price": 2499,
                        "stock": 15,
                        "image": "/uploads/products/royal-essence.jpg",
                    },
                    {
                        "name": "Ocean Elixir",
                        "description": "A fresh and energetic fragrance combining clean aquatic notes with masculine character.",
                        "price": 1799,
                        "sale_price": 1599,
                        "stock": 22,
                        "image": "/uploads/products/ocean-elixir.jpg",
                    },
                ]
                for p_data in sample_products:
                    db.session.add(Product(
                        name=p_data["name"],
                        description=p_data["description"],
                        price=p_data["price"],
                        sale_price=p_data["sale_price"],
                        stock=p_data["stock"],
                        image=p_data["image"],
                        category_id=cat.id,
                    ))
                db.session.commit()
        except Exception as e:  # noqa: BLE001
            app.logger.warning(f"Auto-seed check skipped: {e}")

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

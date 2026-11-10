import os

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .extensions import db


def create_app():
    app = Flask(__name__)
    # Enable CORS for all frontend clients, development servers, and custom domains
    CORS(
        app,
        resources={
            r"/api/*": {"origins": r"^https?://.*$"},
            r"/uploads/*": {"origins": r"^https?://.*$"},
        },
        allow_headers=["Content-Type", "X-Cart-Session", "Authorization", "Accept", "Origin", "X-Requested-With"],
        expose_headers=["Content-Type", "X-Cart-Session", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        supports_credentials=True,
    )

    # Use a shared database in production. A Render service's local filesystem is
    # temporary unless its SQLite file is placed on a persistent disk.
    # Prefer Railway's public MySQL URL when configured; MYSQL_URL is private
    # to Railway's network and cannot be reached by this Render-hosted backend.
    database_url = (
        os.environ.get("MYSQL_PUBLIC_URL")
        or os.environ.get("DATABASE_URL")
    )
    persistent_data_dir = os.environ.get("PERSISTENT_DATA_DIR")
    if database_url:
        # Support Render/Heroku postgres:// URL prefix with SQLAlchemy
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        elif database_url.startswith("mysql://"):
            database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    elif os.environ.get("RENDER"):
        if not persistent_data_dir:
            raise RuntimeError(
                "Set DATABASE_URL to a managed database, or set PERSISTENT_DATA_DIR "
                "to the mount path of a persistent disk. Refusing to use temporary "
                "Render storage for product data."
            )
        os.makedirs(persistent_data_dir, exist_ok=True)
        sqlite_path = os.path.join(persistent_data_dir, "ecommerce.db")
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
    if persistent_data_dir:
        upload_folder = os.path.join(persistent_data_dir, "uploads", "products")
    else:
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

    # Complete catalog of 17 luxury perfumes with authentic images and pricing
    luxury_catalog = [
        {
            "name": "Summer Oud",
            "description": "A powerful and high projection long-lasting oud fragrance with a warm, elegant character. Designed for people who want a strong presence throughout the day.",
            "price": 2499.0,
            "sale_price": 1800.0,
            "stock": 2,
            "image": "/uploads/products/6596393647a94665ac4e6c893bfc13b6.webp",
        },
        {
            "name": "Al Majed Oud Noir",
            "description": "A dark and sophisticated fragrance combining rich woods, warm spices and a smooth luxurious finish.",
            "price": 3099.0,
            "sale_price": 2200.0,
            "stock": 1,
            "image": "/uploads/products/4551f0b7d3f74b288953a121945d581a.png",
        },
        {
            "name": "Ahmed Oud Lavender",
            "description": "Ahmed Al Maghribi Oud Lavender is a unisex fragnance that blends fresh, floral, and aromatic notes rather than a heavy or dominant oud scent. It is presented in a signature diamond-shaped bottle and is known for its balanced, spring-like freshness.",
            "price": 4000.0,
            "sale_price": 1999.0,
            "stock": 18,
            "image": "/uploads/products/15cb2eeaaffe4fff9661c162b8603312.webp",
        },
        {
            "name": "Ahmed Al Maghribi Bin sheikh",
            "description": "~This vintage scent is an exotic blend of distinct aromas. Earthy roses, spicy citrus, Fragrance Notes: Top: French Lavender, Saffron, Rose, Citrus, Oakmoss.",
            "price": 6400.0,
            "sale_price": 2200.0,
            "stock": 10,
            "image": "/uploads/products/a03957988fbe48d8933c5effbab09fb4.webp",
        },
        {
            "name": "Mancera Red Tobacco",
            "description": "Red Tobacco by Mancera is a Woody Spicy fragrance for women and men. This is a new fragrance. Red Tobacco was launched in 2017. A luxurious blend of warm and feisty accords brings the heat to those long, chilly fall and winter nights. A rich tapestry of features white musk, Madagascar vanilla, Haitian vetiver, sandalwood, guaiac wood, amber and tobacco. Pierre Montale is the nose behind this scent.",
            "price": 9400.0,
            "sale_price": 2100.0,
            "stock": 3,
            "image": "/uploads/products/811aed5a4f35415e9452705148224d8e.webp",
        },
        {
            "name": "Layton Exclusif - Parfum De Marly",
            "description": "This striking new take on Layton shakes up its original composition, creating a twist with a hint of cardamom together with sandalwood and guaiac wood essence. A fragrance which asserts its strength and impetuousness.",
            "price": 39900.0,
            "sale_price": 2000.0,
            "stock": 2,
            "image": "/uploads/products/23b66393e79e4d69921ca33946239870.webp",
        },
        {
            "name": "Kilian's Angel Share",
            "description": "Angels' Share by By Kilian is a Oriental Vanilla fragrance for women and men. Angels' Share was launched in 2020. The nose behind this fragrance is Benoist Lapouza. Top note is Cognac; middle notes are Cinnamon, Tonka Bean, Oak and Hedione; base notes are Vanilla, Praline, Sandalwood and Candied Almond.",
            "price": 30000.0,
            "sale_price": 2000.0,
            "stock": 3,
            "image": "/uploads/products/a179996504094188be6eb407da61c7ab.webp",
        },
        {
            "name": "Stephane Humbert Lucas 777 God of Fire",
            "description": "God of Fire by Stéphane Humbert Lucas 777 is a Amber Woody fragrance for women and men. This is a new fragrance. God of Fire was launched in 2022. The nose behind this fragrance is Stéphane Humbert Lucas.Symbol of power and wiseness, God of Fire Eau de Parfum is an exquisite fragrance where fresh and exotic notes hide an outstanding warm character. His incredible strength, leads him to rule the volcanos, his Oud heart burns intensely like a shamanic experience, leaving you regenerated and full of confidence.",
            "price": 21000.0,
            "sale_price": 2000.0,
            "stock": 5,
            "image": "/uploads/products/4111542b57c64d43a979351e65326a04.webp",
        },
        {
            "name": "Gissah Imperial Valley",
            "description": "Imperial Valley by Gissah is a Oriental Woody fragrance for women and men. Imperial Valley was launched in 2021. Top notes are Sicilian Bergamot, Pink Pepper and Davana; middle notes are Agarwood (Oud), White Amber and Rosemary; base notes are Leather, Musk and Haitian Vetiver.",
            "price": 13000.0,
            "sale_price": 2000.0,
            "stock": 4,
            "image": "/uploads/products/6da11071daf643d7af9af339059a512a.webp",
        },
        {
            "name": "Lataffa khamrah",
            "description": "Lattafa Khamrah is a captivating gourmand that opens with a spicy boldness of Cinnamon, Nutmeg and Bergamot. With a heart of Dates, Praline and Florals which is decadent, velvety and sensual at the same time. The fragrance finally settles into a luxuriously warm base of Amberwood, Vanilla, Myrrh and Roasted Tonka, leaving a deep, lingering trail that speaks of timeless elegance.",
            "price": 4850.0,
            "sale_price": 1800.0,
            "stock": 5,
            "image": "/uploads/products/ac5ea32adc3c49189c44690af72ff5c5.webp",
        },
        {
            "name": "Chanel Allure Homme Sport",
            "description": "Allure Homme Sport by Chanel is a Woody Spicy fragrance for men. Allure Homme Sport was launched in 2004. The nose behind this fragrance is Jacques Polge. Top notes are Orange, Sea Notes, Aldehydes and Blood Mandarin; middle notes are Pepper, Neroli and Cedar; base notes are Vanilla, Tonka Bean, White Musk, Amber, Vetiver and Elemi resin.",
            "price": 18500.0,
            "sale_price": 1700.0,
            "stock": 5,
            "image": "/uploads/products/23493b6650dd40d3888c41be93985b39.webp",
        },
        {
            "name": "Ahmed Al Maghribi Marj",
            "description": "Marj by Ahmed Al Maghribi is a fragrance for women and men. Marj was launched in 2023. Top notes are Oud, Honey, elemi, Pink Pepper, Nutmeg, Bergamot and Mandarin; middle notes are Cashmere Wood, Saffron, Orange Blossom, Jasmine, Cinnamon, Patchouli and Vetiver; base notes are Agarwood, Leather, Saffron, Amber, Raspberry, Sandalwood, Ambergris, Musk, Oakmoss, Violet and Pear.",
            "price": 5600.0,
            "sale_price": 2400.0,
            "stock": 10,
            "image": "/uploads/products/deb5b18c4ce840e88abb02329b60b84c.webp",
        },
        {
            "name": "Reef 33",
            "description": "Reef 33 by Reef Perfumes is a Oriental Woody fragrance for women and men. Reef 33 was launched in 2020. The nose behind this fragrance is Kevin Mathys. Top note is Indian Saffron; middle note is Rosemary; base note is Agarwood (Oud).",
            "price": 13650.0,
            "sale_price": 2200.0,
            "stock": 100,
            "image": "/uploads/products/9f94beef709a4336beca387208d92559.webp",
        },
        {
            "name": "Tobacco Vanille",
            "description": "Tom Ford Tobacco Vanille is an iconic warm, spicy, and sweet gourmand Eau de Parfum originally launched in 2007, inspired by classic London gentlemen's clubs.",
            "price": 30999.0,
            "sale_price": 1800.0,
            "stock": 10,
            "image": "/uploads/products/6559697899dd48e0b2bed7a524af7a4a.webp",
        },
        {
            "name": "Initio Parfums Privés Oud for Greatness",
            "description": "Oud for Greatness breathes out a force of nature, the wake of Greatness. The natural essence of Oud Wood has been perfected to this pitch, handled with majesty (and brutality) in this bold formula, scarcely highlighted by Patchouli and Musk. Superbly textured, strikingly natural, Oud has been handled by the creator in a register that is astonishingly fresh (Lavender) and spicy (Nutmeg, Saffron). An enchanting, thrilling perfume that makes all our dreams of greatness possible.",
            "price": 41800.0,
            "sale_price": 2000.0,
            "stock": 60,
            "image": "/uploads/products/063692e479554bc0852ea853e7798db4.webp",
        },
        {
            "name": "Maison Crivelli Oud Maracuja",
            "description": "Oud Maracujá by Maison Crivelli is a Leather fragrance for women and men. This is a new fragrance. Oud Maracujá was launched in 2023. The nose behind this fragrance is Jordi Fernández.Here's what other people are saying about Oud Maracuja... Potent woody gourmand scent centered around a heavy passion fruit accord. The fragrance opens with the central Maracujá (a type of Brazilian passion fruit) note with slight hints of saffron, rose, and other fruity notes.",
            "price": 26500.0,
            "sale_price": 2000.0,
            "stock": 7,
            "image": "/uploads/products/eba68dfca7e248d8b4b803a9385a4730.webp",
        },
        {
            "name": "Amouage Interlude Man",
            "description": "Amouage Interlude Man is an amber woody niche fragrance for men launched in 2012 by the perfume house Amouage and created by nose Pierre Negrin. Known widely as the \"Blue Beast,\" it is celebrated for its heavy smokiness, resinous depth, and massive performance.",
            "price": 32400.0,
            "sale_price": 2000.0,
            "stock": 19,
            "image": "/uploads/products/893918494b1349a6a6bd0bf49164290d.webp",
        },
    ]

    # Create database tables and seed the starter catalog only for a new store.
    # Never delete products or overwrite admin edits during an app restart.
    with app.app_context():
        db.create_all()
        try:
            from .models import Category, Product

            if not Category.query.first():
                cat = Category(
                    name="Perfumes",
                    description="Premium fragrances and royal oud",
                )
                db.session.add(cat)
                db.session.flush()
                for p_data in luxury_catalog:
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

            # Ensure Admin User exists in database (DD / Dcruiz1407)
            from .models import AdminUser

            admin_user = os.environ.get("ADMIN_USERNAME", "DD")
            admin_pwd = os.environ.get("ADMIN_PASSWORD", "Dcruiz1407")

            admin = AdminUser.query.filter(AdminUser.username.ilike(admin_user)).first()
            if not admin:
                admin = AdminUser(username=admin_user)
                admin.set_password(admin_pwd)
                db.session.add(admin)
                db.session.commit()
            else:
                admin.set_password(admin_pwd)
                db.session.commit()

            db.session.commit()
        except Exception as e:  # noqa: BLE001
            app.logger.warning(f"Auto-seed check skipped: {e}")

    # Determine dist directory (backend/dist or ../frontend/dist)
    dist_dir = os.path.abspath(os.path.join(app.root_path, "..", "dist"))
    if not os.path.isdir(dist_dir):
        alt_dist = os.path.abspath(os.path.join(app.root_path, "..", "..", "frontend", "dist"))
        if os.path.isdir(alt_dist):
            dist_dir = alt_dist

    # Serve uploaded product images with high-performance immutable caching
    @app.route("/uploads/products/<path:filename>")
    def uploaded_product_image(filename):
        response = send_from_directory(
            app.config["UPLOAD_FOLDER"],
            filename,
            max_age=31536000,
        )
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response

    # Serve compiled frontend (SPA) if dist folder is available
    if os.path.isdir(dist_dir):
        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            if path.startswith("api/") or path == "api":
                return {"error": "Not found"}, 404
            file_path = os.path.join(dist_dir, path)
            if path and os.path.isfile(file_path):
                return send_from_directory(dist_dir, path)
            return send_from_directory(dist_dir, "index.html")
    else:
        @app.route("/")
        def home():
            return {
                "message": "E-commerce API is running!",
                "status": "healthy",
                "endpoints": {
                    "products": "/api/products/",
                    "categories": "/api/categories/",
                    "cart": "/api/cart/",
                    "orders": "/api/orders/"
                }
            }

    return app

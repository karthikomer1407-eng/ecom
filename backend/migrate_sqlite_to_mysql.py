import sqlite3

from app import create_app
from app.extensions import db
from app.models import Category, Product

SQLITE_DATABASE = "instance/ecommerce.db"


def migrate():
    print("Connecting to SQLite...")

    sqlite_connection = sqlite3.connect(SQLITE_DATABASE)
    sqlite_connection.row_factory = sqlite3.Row

    cursor = sqlite_connection.cursor()

    print("Reading categories...")

    categories = cursor.execute(
        "SELECT * FROM categories"
    ).fetchall()

    print(f"Found {len(categories)} categories.")

    print("Reading products...")

    products = cursor.execute(
        "SELECT * FROM products"
    ).fetchall()

    print(f"Found {len(products)} products.")

    app = create_app()

    with app.app_context():

        print("\nMigrating categories...")

        category_map = {}

        for old_category in categories:

            existing_category = Category.query.filter_by(
                name=old_category["name"]
            ).first()

            if existing_category:
                category_map[old_category["id"]] = existing_category.id
                continue

            new_category = Category(
                name=old_category["name"],
                description=old_category["description"]
            )

            db.session.add(new_category)
            db.session.flush()

            category_map[old_category["id"]] = new_category.id

        db.session.commit()

        print("Categories migrated successfully.")

        print("\nMigrating products...")

        for old_product in products:

            existing_product = Product.query.filter_by(
                name=old_product["name"]
            ).first()

            if existing_product:
                print(
                    f"Skipping existing product: "
                    f"{old_product['name']}"
                )
                continue

            new_product = Product(
                name=old_product["name"],
                description=old_product["description"],
                price=old_product["price"],
                sale_price=old_product["sale_price"],
                stock=old_product["stock"],
                image=old_product["image"],
                category_id=category_map.get(
                    old_product["category_id"]
                )
            )

            db.session.add(new_product)

            print(
                f"Adding product: "
                f"{old_product['name']}"
            )

        db.session.commit()

        print("\nProducts migrated successfully.")

    sqlite_connection.close()

    print("\n================================")
    print("Migration completed successfully!")
    print("================================")


if __name__ == "__main__":
    migrate()
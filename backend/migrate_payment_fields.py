from sqlalchemy import inspect, text

from app import create_app
from app.extensions import db
from app.models import Order

app = create_app()

with app.app_context():
    table = Order.__tablename__

    existing_columns = {
        column["name"]
        for column in inspect(db.engine).get_columns(table)
    }

    migrations = {
        "razorpay_order_id": "VARCHAR(100)",
        "razorpay_payment_id": "VARCHAR(100)",
        "cart_session_id": "VARCHAR(100)",
        "payment_status": "VARCHAR(30) NOT NULL DEFAULT 'Pending'",
    }
    quote = db.engine.dialect.identifier_preparer.quote

    with db.engine.begin() as connection:
        for column, definition in migrations.items():
            if column not in existing_columns:
                connection.execute(
                    text(
                        f"ALTER TABLE {quote(table)} "
                        f"ADD COLUMN {quote(column)} {definition}"
                    )
                )
                print(f"Added column: {column}")
            else:
                print(f"Already exists: {column}")

    indexed_columns = (
        "razorpay_order_id",
        "razorpay_payment_id",
        "cart_session_id",
    )
    existing_indexes = {
        index["name"]
        for index in inspect(db.engine).get_indexes(table)
    }
    with db.engine.begin() as connection:
        for column in indexed_columns:
            index_name = f"ix_{table}_{column}"
            if index_name not in existing_indexes:
                connection.execute(
                    text(
                        f"CREATE INDEX {quote(index_name)} "
                        f"ON {quote(table)} ({quote(column)})"
                    )
                )
                print(f"Added index: {index_name}")
            else:
                print(f"Index already exists: {index_name}")

    print("Payment-field migration completed.")

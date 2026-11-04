from app import create_app
from app.extensions import db
from app.models import Category, Product

app = create_app()


products = [
    {
        "name": "Summer Oud",
        "description": "A powerful and long-lasting oud fragrance with a warm, elegant character. Designed for people who want a strong presence throughout the day.",
        "price": 1999,
        "sale_price": 1799,
        "stock": 25,
        "image": "http://127.0.0.1:5000/uploads/products/summer-oud.jpg",
    },
    {
        "name": "Midnight Noir",
        "description": "A dark and sophisticated fragrance combining rich woods, warm spices and a smooth luxurious finish.",
        "price": 2499,
        "sale_price": 2199,
        "stock": 18,
        "image": "http://127.0.0.1:5000/uploads/products/midnight-noir.jpg",
    },
    {
        "name": "Amber Royale",
        "description": "A luxurious amber fragrance with warm oriental notes, creating a rich and elegant scent perfect for evening occasions.",
        "price": 2299,
        "sale_price": 1999,
        "stock": 20,
        "image": "http://127.0.0.1:5000/uploads/products/amber-royale.jpg",
    },
    {
        "name": "Velvet Musk",
        "description": "A smooth and sensual musk fragrance with a soft powdery character and excellent everyday wearability.",
        "price": 1899,
        "sale_price": 1699,
        "stock": 30,
        "image": "http://127.0.0.1:5000/uploads/products/velvet-musk.jpg",
    },
    {
        "name": "Royal Essence",
        "description": "An elegant premium fragrance crafted with rich woods, refined spices and a luxurious aromatic heart.",
        "price": 2799,
        "sale_price": 2499,
        "stock": 15,
        "image": "http://127.0.0.1:5000/uploads/products/royal-essence.jpg",
    },
    {
        "name": "Ocean Elixir",
        "description": "A fresh and energetic fragrance inspired by the ocean, combining clean aquatic notes with a modern masculine character.",
        "price": 1799,
        "sale_price": 1599,
        "stock": 22,
        "image": "http://127.0.0.1:5000/uploads/products/ocean-elixir.jpg",
    },
]


with app.app_context():

    category = Category.query.filter_by(
        name="Perfumes"
    ).first()

    if not category:
        category = Category(
            name="Perfumes",
            description="Premium fragrances and perfumes"
        )

        db.session.add(category)
        db.session.commit()

    for data in products:

        product = Product.query.filter_by(
            name=data["name"]
        ).first()

        if product:

            product.description = data["description"]
            product.price = data["price"]
            product.sale_price = data["sale_price"]
            product.stock = data["stock"]
            product.image = data["image"]
            product.category_id = category.id

            print(f"Updated: {product.name}")

        else:

            product = Product(
                name=data["name"],
                description=data["description"],
                price=data["price"],
                sale_price=data["sale_price"],
                stock=data["stock"],
                image=data["image"],
                category_id=category.id
            )

            db.session.add(product)

            print(f"Created: {product.name}")

    db.session.commit()

    print("\nProduct seeding completed!")
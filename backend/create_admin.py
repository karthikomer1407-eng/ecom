from app import create_app
from app.extensions import db
from app.models import AdminUser

app = create_app()

with app.app_context():
    # Create tables if they don't exist yet
    db.create_all()
    
    username = input("Enter admin username: ")
    password = input("Enter admin password: ")

    # Check if user already exists
    existing_user = AdminUser.query.filter_by(username=username).first()
    if existing_user:
        print("User already exists!")
    else:
        new_admin = AdminUser(username=username)
        new_admin.set_password(password)
        db.session.add(new_admin)
        db.session.commit()
        print(f"Admin '{username}' created successfully! You can now log in.")
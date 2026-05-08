"""Run once to seed initial data: locations, categories, service types, packages, sample dishes."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import SessionLocal
from app.db.base import Base
from app.db.session import engine
from app.models.location import Location, City
from app.models.menu import Category, ServiceType, Package, Dish, ServiceTypeName
from app.models.user import User, UserRole
from app.core.security import hash_password
from app.core.config import settings

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Locations
locations = [
    (City.bangalore, "Indiranagar", "560038"), (City.bangalore, "Koramangala", "560034"),
    (City.bangalore, "Whitefield", "560066"), (City.bangalore, "HSR Layout", "560102"),
    (City.bangalore, "JP Nagar", "560078"), (City.bangalore, "Marathahalli", "560037"),
    (City.tirupati, "Tirumala Road", "517501"), (City.tirupati, "Balaji Nagar", "517502"),
    (City.tirupati, "RC Road", "517501"), (City.tirupati, "Karakambadi", "517520"),
]
for city, area, pin in locations:
    if not db.query(Location).filter_by(city=city, area=area).first():
        db.add(Location(city=city, area=area, pincode=pin))

# Categories
cats = ["Starters", "Main Course", "Breads", "Rice & Biryani", "Desserts", "Beverages"]
cat_map = {}
for name in cats:
    c = db.query(Category).filter_by(name=name).first()
    if not c:
        c = Category(name=name, display_order=cats.index(name))
        db.add(c)
        db.flush()
    cat_map[name] = c

# Service Types
st_data = [
    (ServiceTypeName.meal_box, "Compact compartmentalized meal boxes — ideal for corporate lunches.", 10, None),
    (ServiceTypeName.delivery_box, "Sealed bulk delivery boxes for parties and gatherings.", 10, 120),
    (ServiceTypeName.catering, "Full-service catering with chafing dishes and staff.", 50, None),
]
st_map = {}
for name, desc, mn, mx in st_data:
    st = db.query(ServiceType).filter_by(name=name).first()
    if not st:
        st = ServiceType(name=name, description=desc, min_guests=mn, max_guests=mx)
        db.add(st)
        db.flush()
    st_map[name] = st

# Packages
pkgs = [
    (ServiceTypeName.meal_box, "3-Compartment Box", "Starter + Main + Dessert", 80, 3),
    (ServiceTypeName.meal_box, "5-Compartment Box", "Starter + 2 Mains + Bread + Dessert", 120, 5),
    (ServiceTypeName.meal_box, "8-Compartment Box", "Full feast in a box", 180, 8),
    (ServiceTypeName.delivery_box, "Basic Box", "2 mains + rice + bread", 90, None),
    (ServiceTypeName.delivery_box, "Premium Box", "3 mains + rice + bread + dessert", 130, None),
    (ServiceTypeName.catering, "Standard Catering", "5 dishes with setup", 200, None),
    (ServiceTypeName.catering, "Premium Catering", "8 dishes + live counter + staff", 350, None),
]
for st_name, pkg_name, desc, price, comp in pkgs:
    st = st_map[st_name]
    if not db.query(Package).filter_by(service_type_id=st.id, name=pkg_name).first():
        db.add(Package(service_type_id=st.id, name=pkg_name, description=desc, base_price_per_head=price, compartments=comp))

# Sample Dishes
dishes = [
    ("Paneer Tikka", "Marinated cottage cheese grilled to perfection", 45, "Starters", True, True),
    ("Veg Spring Rolls", "Crispy rolls with seasoned vegetable filling", 35, "Starters", True, False),
    ("Chicken 65", "Spicy Andhra-style fried chicken", 55, "Starters", False, True),
    ("Dal Makhani", "Slow-cooked black lentils in buttery tomato gravy", 40, "Main Course", True, True),
    ("Paneer Butter Masala", "Rich and creamy tomato-based paneer curry", 50, "Main Course", True, True),
    ("Chicken Tikka Masala", "Tender chicken in aromatic tikka masala sauce", 65, "Main Course", False, True),
    ("Palak Paneer", "Cottage cheese in spiced spinach gravy", 45, "Main Course", True, False),
    ("Mutton Rogan Josh", "Slow-cooked mutton in Kashmiri spices", 80, "Main Course", False, False),
    ("Butter Naan", "Soft leavened flatbread cooked in tandoor", 15, "Breads", True, True),
    ("Garlic Roti", "Whole wheat flatbread with garlic butter", 12, "Breads", True, False),
    ("Laccha Paratha", "Flaky layered whole wheat bread", 18, "Breads", True, False),
    ("Veg Biryani", "Fragrant basmati rice with mixed vegetables and whole spices", 60, "Rice & Biryani", True, True),
    ("Chicken Biryani", "Aromatic basmati rice layered with spiced chicken", 85, "Rice & Biryani", False, True),
    ("Gulab Jamun", "Soft milk-solid dumplings in rose sugar syrup", 25, "Desserts", True, True),
    ("Kheer", "Creamy rice pudding with cardamom and dry fruits", 30, "Desserts", True, False),
    ("Rasgulla", "Spongy cottage cheese balls in light sugar syrup", 25, "Desserts", True, False),
    ("Mango Lassi", "Chilled yogurt drink with fresh mango pulp", 30, "Beverages", True, False),
    ("Masala Chaas", "Spiced buttermilk with cumin and mint", 20, "Beverages", True, True),
]
for name, desc, price, cat_name, veg, popular in dishes:
    if not db.query(Dish).filter_by(name=name).first():
        db.add(Dish(name=name, description=desc, price_per_head=price, category_id=cat_map[cat_name].id, is_veg=veg, is_popular=popular))

# Admin user — credentials read from .env (ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_PHONE)
if not db.query(User).filter_by(email=settings.ADMIN_EMAIL).first():
    db.add(User(
        name="Admin",
        email=settings.ADMIN_EMAIL,
        phone=settings.ADMIN_PHONE,
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
        role=UserRole.admin,
    ))

db.commit()
db.close()
print(f"Seed complete. Admin login: {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")

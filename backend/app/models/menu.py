from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base


class ServiceTypeName(str, enum.Enum):
    meal_box = "Meal Box"
    delivery_box = "Delivery Box"
    catering = "Catering"


class EventTypeName(str, enum.Enum):
    birthday = "Birthday"
    wedding = "Wedding"
    corporate = "Corporate"
    sangeet = "Sangeet"
    farmhouse = "Farmhouse Party"
    tea_party = "Tea Party"
    family_reunion = "Family Reunion"
    other = "Other"


class ServiceType(Base):
    __tablename__ = "service_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(SAEnum(ServiceTypeName), unique=True, nullable=False)
    description = Column(Text)
    min_guests = Column(Integer, default=10)
    max_guests = Column(Integer, nullable=True)
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)

    packages = relationship("Package", back_populates="service_type")


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    service_type_id = Column(Integer, ForeignKey("service_types.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    base_price_per_head = Column(Float, nullable=False)
    compartments = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)

    service_type = relationship("ServiceType", back_populates="packages")
    order_items = relationship("OrderItem", back_populates="package")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    dishes = relationship("Dish", back_populates="category")


class Dish(Base):
    __tablename__ = "dishes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    price_per_head = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    is_veg = Column(Boolean, default=True)
    is_jain = Column(Boolean, default=False)
    is_vegan = Column(Boolean, default=False)
    is_gluten_free = Column(Boolean, default=False)
    image_url = Column(String(500))
    is_available = Column(Boolean, default=True)
    is_popular = Column(Boolean, default=False)

    category = relationship("Category", back_populates="dishes")
    order_dishes = relationship("OrderDish", back_populates="dish")
    reviews = relationship("Review", back_populates="dish")

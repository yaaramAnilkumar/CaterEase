from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SAEnum, Text, Date, Time, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base
from app.models.menu import EventTypeName


class OrderStatus(str, enum.Enum):
    pending = "Pending"
    confirmed = "Confirmed"
    preparing = "Preparing"
    out_for_delivery = "Out for Delivery"
    delivered = "Delivered"
    cancelled = "Cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_type_id = Column(Integer, ForeignKey("service_types.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=True)
    event_type = Column(SAEnum(EventTypeName), nullable=False)
    guest_count = Column(Integer, nullable=False)
    event_date = Column(Date, nullable=False)
    event_time = Column(Time, nullable=False)
    delivery_address_id = Column(Integer, ForeignKey("addresses.id"), nullable=False)
    special_instructions = Column(Text)
    status = Column(SAEnum(OrderStatus), default=OrderStatus.pending, nullable=False)
    subtotal = Column(Float, nullable=False, default=0)
    discount = Column(Float, default=0)
    promo_code_id = Column(Integer, ForeignKey("promo_codes.id"), nullable=True)
    promo_discount = Column(Float, default=0)
    points_redeemed = Column(Integer, default=0)
    points_discount = Column(Float, default=0)
    points_earned = Column(Integer, default=0)
    total_amount = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="orders")
    service_type = relationship("ServiceType")
    package = relationship("Package")
    delivery_address = relationship("Address")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    dishes = relationship("OrderDish", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    package = relationship("Package", back_populates="order_items")


class OrderDish(Base):
    __tablename__ = "order_dishes"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    dish_id = Column(Integer, ForeignKey("dishes.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="dishes")
    dish = relationship("Dish", back_populates="order_dishes")

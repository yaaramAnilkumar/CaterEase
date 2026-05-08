from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
from app.models.menu import EventTypeName
from app.models.order import OrderStatus


class OrderDishIn(BaseModel):
    dish_id: int
    quantity: int = 1


class OrderCreate(BaseModel):
    service_type_id: int
    package_id: Optional[int]
    event_type: EventTypeName
    guest_count: int
    event_date: date
    event_time: time
    delivery_address_id: int
    special_instructions: Optional[str]
    dishes: List[OrderDishIn]
    promo_code: Optional[str] = None
    redeem_points: bool = False


class OrderDishOut(BaseModel):
    dish_id: int
    quantity: int
    unit_price: float

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    user_id: int
    service_type_id: int
    package_id: Optional[int]
    event_type: EventTypeName
    guest_count: int
    event_date: date
    event_time: time
    special_instructions: Optional[str]
    status: OrderStatus
    subtotal: float
    discount: float
    promo_code_id: Optional[int]
    promo_discount: float
    points_redeemed: int
    points_discount: float
    points_earned: int
    total_amount: float
    created_at: datetime
    dishes: List[OrderDishOut]

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: OrderStatus

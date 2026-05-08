from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.payment import PaymentStatus


class PaymentCreate(BaseModel):
    order_id: int


class PaymentOut(BaseModel):
    id: int
    order_id: int
    razorpay_order_id: str
    amount: float
    currency: str
    status: PaymentStatus

    model_config = {"from_attributes": True}


class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

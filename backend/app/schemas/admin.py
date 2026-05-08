from pydantic import BaseModel
from typing import List


class DashboardStats(BaseModel):
    total_orders: int
    pending_orders: int
    confirmed_orders: int
    total_revenue: float
    today_orders: int
    today_revenue: float
    popular_dishes: List[dict]
    orders_by_status: dict

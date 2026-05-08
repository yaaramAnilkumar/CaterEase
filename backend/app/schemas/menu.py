from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.menu import ServiceTypeName, EventTypeName


class CategoryOut(BaseModel):
    id: int
    name: str
    display_order: int

    model_config = {"from_attributes": True}


class DishOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price_per_head: float
    category_id: int
    category: CategoryOut
    is_veg: bool
    is_jain: bool
    is_vegan: bool
    is_gluten_free: bool
    image_url: Optional[str]
    is_available: bool
    is_popular: bool
    avg_rating: Optional[float] = None
    review_count: int = 0

    model_config = {"from_attributes": True}


class DishCreate(BaseModel):
    name: str
    description: Optional[str]
    price_per_head: float
    category_id: int
    is_veg: bool = True
    is_jain: bool = False
    is_vegan: bool = False
    is_gluten_free: bool = False
    image_url: Optional[str]
    is_available: bool = True
    is_popular: bool = False


class PackageOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    base_price_per_head: float
    compartments: Optional[int]
    service_type_id: int

    model_config = {"from_attributes": True}


class ServiceTypeOut(BaseModel):
    id: int
    name: ServiceTypeName
    description: Optional[str]
    min_guests: int
    max_guests: Optional[int]
    image_url: Optional[str]
    packages: List[PackageOut]

    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    dish_id: int
    rating: int  # 1-5
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    order_id: int
    user_id: int
    dish_id: int
    rating: int
    comment: Optional[str]
    is_approved: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}

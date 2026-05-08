from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/config", tags=["config"])


@router.get("")
def get_app_config():
    return {
        "app_name": settings.APP_NAME,
        "currency": settings.CURRENCY,
        "default_city": settings.DEFAULT_CITY,
        "event_types": settings.event_types_list,
        "cities": settings.cities_list,
        "discount_threshold_guests": settings.DISCOUNT_THRESHOLD_GUESTS,
        "discount_percent": settings.DISCOUNT_PERCENT,
        "points_per_hundred": settings.POINTS_PER_HUNDRED,
        "points_rupee_value": settings.POINTS_RUPEE_VALUE,
    }

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.location import Location, City

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("/")
def list_locations(db: Session = Depends(get_db)):
    locations = db.query(Location).filter(Location.is_serviceable == True).all()
    result = {}
    for loc in locations:
        city = loc.city.value
        if city not in result:
            result[city] = []
        result[city].append({"area": loc.area, "pincode": loc.pincode})
    return result


@router.get("/cities")
def list_cities():
    return [c.value for c in City]

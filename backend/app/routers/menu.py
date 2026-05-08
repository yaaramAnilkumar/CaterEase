from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from app.db.session import get_db
from app.models.menu import Dish, Category, ServiceType, Package
from app.models.review import Review
from app.schemas.menu import DishOut, CategoryOut, ServiceTypeOut, PackageOut, DishCreate
from app.routers.deps import require_admin

router = APIRouter(prefix="/menu", tags=["menu"])


def _attach_ratings(dishes: list, db: Session) -> list:
    if not dishes:
        return dishes
    dish_ids = [d.id for d in dishes]
    rows = (
        db.query(Review.dish_id, func.avg(Review.rating).label("avg"), func.count(Review.id).label("cnt"))
        .filter(Review.dish_id.in_(dish_ids), Review.is_approved == 1)
        .group_by(Review.dish_id)
        .all()
    )
    rating_map = {r.dish_id: (round(r.avg, 1), r.cnt) for r in rows}
    for d in dishes:
        avg, cnt = rating_map.get(d.id, (None, 0))
        d.avg_rating = avg
        d.review_count = cnt
    return dishes


@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).filter(Category.is_active == True).order_by(Category.display_order).all()


@router.get("/dishes", response_model=List[DishOut])
def list_dishes(
    category_id: Optional[int] = Query(None),
    is_veg: Optional[bool] = Query(None),
    is_jain: Optional[bool] = Query(None),
    is_vegan: Optional[bool] = Query(None),
    is_gluten_free: Optional[bool] = Query(None),
    is_popular: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Dish).options(joinedload(Dish.category)).filter(Dish.is_available == True)
    if category_id:
        q = q.filter(Dish.category_id == category_id)
    if is_veg is not None:
        q = q.filter(Dish.is_veg == is_veg)
    if is_jain:
        q = q.filter(Dish.is_jain == True)
    if is_vegan:
        q = q.filter(Dish.is_vegan == True)
    if is_gluten_free:
        q = q.filter(Dish.is_gluten_free == True)
    if is_popular:
        q = q.filter(Dish.is_popular == True)
    dishes = q.all()
    return _attach_ratings(dishes, db)


@router.get("/service-types", response_model=List[ServiceTypeOut])
def list_service_types(db: Session = Depends(get_db)):
    return (
        db.query(ServiceType)
        .options(joinedload(ServiceType.packages))
        .filter(ServiceType.is_active == True)
        .all()
    )


@router.get("/packages", response_model=List[PackageOut])
def list_packages(service_type_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    q = db.query(Package).filter(Package.is_active == True)
    if service_type_id:
        q = q.filter(Package.service_type_id == service_type_id)
    return q.all()


# Admin endpoints
@router.post("/dishes", response_model=DishOut, dependencies=[Depends(require_admin)])
def create_dish(payload: DishCreate, db: Session = Depends(get_db)):
    dish = Dish(**payload.model_dump())
    db.add(dish)
    db.commit()
    db.refresh(dish)
    return dish


@router.put("/dishes/{dish_id}", response_model=DishOut, dependencies=[Depends(require_admin)])
def update_dish(dish_id: int, payload: DishCreate, db: Session = Depends(get_db)):
    dish = db.query(Dish).filter(Dish.id == dish_id).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    for k, v in payload.model_dump().items():
        setattr(dish, k, v)
    db.commit()
    db.refresh(dish)
    return dish


@router.delete("/dishes/{dish_id}", dependencies=[Depends(require_admin)])
def delete_dish(dish_id: int, db: Session = Depends(get_db)):
    dish = db.query(Dish).filter(Dish.id == dish_id).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    dish.is_available = False
    db.commit()
    return {"detail": "Dish deactivated"}

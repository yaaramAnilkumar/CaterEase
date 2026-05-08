from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import date, timedelta
from app.db.session import get_db
from app.models.order import Order, OrderDish, OrderStatus
from app.models.menu import Dish
from app.models.payment import Payment, PaymentStatus
from app.schemas.admin import DashboardStats
from app.routers.deps import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db), _=Depends(require_admin)):
    today = date.today()

    total_orders = db.query(func.count(Order.id)).scalar()
    pending_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.pending).scalar()
    confirmed_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.confirmed).scalar()

    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.status == PaymentStatus.paid).scalar()

    today_orders = db.query(func.count(Order.id)).filter(cast(Order.created_at, Date) == today).scalar()
    today_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Order)
        .filter(Payment.status == PaymentStatus.paid, cast(Order.created_at, Date) == today)
        .scalar()
    )

    popular_raw = (
        db.query(Dish.name, func.sum(OrderDish.quantity).label("total"))
        .join(OrderDish, OrderDish.dish_id == Dish.id)
        .group_by(Dish.id)
        .order_by(func.sum(OrderDish.quantity).desc())
        .limit(5)
        .all()
    )
    popular_dishes = [{"name": r.name, "total_orders": r.total} for r in popular_raw]

    status_raw = db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    orders_by_status = {r[0].value: r[1] for r in status_raw}

    return DashboardStats(
        total_orders=total_orders,
        pending_orders=pending_orders,
        confirmed_orders=confirmed_orders,
        total_revenue=float(total_revenue),
        today_orders=today_orders,
        today_revenue=float(today_revenue),
        popular_dishes=popular_dishes,
        orders_by_status=orders_by_status,
    )


@router.get("/revenue-by-event-type", dependencies=[Depends(require_admin)])
def revenue_by_event_type(db: Session = Depends(get_db)):
    rows = (
        db.query(Order.event_type, func.count(Order.id).label("orders"), func.sum(Order.total_amount).label("revenue"))
        .filter(Order.status != OrderStatus.cancelled)
        .group_by(Order.event_type)
        .order_by(func.sum(Order.total_amount).desc())
        .all()
    )
    return [{"event_type": r.event_type.value if hasattr(r.event_type, "value") else str(r.event_type), "orders": r.orders, "revenue": float(r.revenue or 0)} for r in rows]


@router.get("/revenue-chart", dependencies=[Depends(require_admin)])
def revenue_chart(db: Session = Depends(get_db)):
    today = date.today()
    start = today - timedelta(days=29)
    rows = (
        db.query(cast(Order.created_at, Date).label("day"), func.sum(Order.total_amount).label("revenue"))
        .filter(Order.status != OrderStatus.cancelled, cast(Order.created_at, Date) >= start)
        .group_by(cast(Order.created_at, Date))
        .all()
    )
    rev_map = {str(r.day): float(r.revenue) for r in rows}
    return [
        {"date": (start + timedelta(days=i)).isoformat(), "revenue": rev_map.get((start + timedelta(days=i)).isoformat(), 0.0)}
        for i in range(30)
    ]

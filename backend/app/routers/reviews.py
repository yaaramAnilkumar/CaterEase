from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.session import get_db
from app.models.review import Review
from app.schemas.menu import ReviewOut
from app.routers.deps import require_admin

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/admin", dependencies=[Depends(require_admin)])
def admin_list_reviews(db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .options(joinedload(Review.user), joinedload(Review.dish), joinedload(Review.order))
        .order_by(Review.created_at.desc())
        .all()
    )
    result = []
    for r in reviews:
        d = ReviewOut.model_validate(r).model_dump()
        d["customer_name"] = r.user.name if r.user else None
        d["dish_name"] = r.dish.name if r.dish else None
        d["order_id"] = r.order_id
        result.append(d)
    return result


@router.patch("/admin/{review_id}/approve", dependencies=[Depends(require_admin)])
def toggle_approve_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_approved = 0 if review.is_approved else 1
    db.commit()
    db.refresh(review)
    return ReviewOut.model_validate(review)


@router.delete("/admin/{review_id}", dependencies=[Depends(require_admin)])
def delete_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
    return {"detail": "Review deleted"}

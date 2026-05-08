from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.routers.deps import require_admin

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", dependencies=[Depends(require_admin)])
def list_audit_logs(
    limit: int = Query(100, le=500),
    entity_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog).options(joinedload(AuditLog.admin)).order_by(AuditLog.created_at.desc())
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    logs = q.limit(limit).all()
    return [
        {
            "id": l.id,
            "admin_name": l.admin.name if l.admin else "System",
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "detail": l.detail,
            "created_at": l.created_at,
        }
        for l in logs
    ]

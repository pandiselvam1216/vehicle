"""
Router: Alerts — blacklist CRUD and alert log.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.blacklist import Blacklist
from app.models.alert import AlertLog
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/alerts", tags=["alerts"])


class BlacklistCreate(BaseModel):
    plate_number: str
    reason: Optional[str] = None


@router.get("/blacklist")
async def list_blacklist(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Blacklist).where(Blacklist.is_active == True))
    items = result.scalars().all()
    return {"blacklist": [b.to_dict() for b in items]}


@router.post("/blacklist", status_code=201)
async def add_to_blacklist(
    data: BlacklistCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    existing = await db.execute(
        select(Blacklist).where(Blacklist.plate_number == data.plate_number.upper())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Plate already blacklisted")
    entry = Blacklist(
        plate_number=data.plate_number.upper(),
        reason=data.reason,
        added_by=current_user.username,
    )
    db.add(entry)
    await db.flush()
    return entry.to_dict()


@router.delete("/blacklist/{plate_number}")
async def remove_from_blacklist(
    plate_number: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    result = await db.execute(
        select(Blacklist).where(Blacklist.plate_number == plate_number.upper())
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found in blacklist")
    entry.is_active = False
    return {"message": f"{plate_number} removed from blacklist"}


@router.get("/logs")
async def get_alert_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(AlertLog).order_by(desc(AlertLog.created_at)).limit(limit)
    )
    items = result.scalars().all()
    return {"alerts": [a.to_dict() for a in items], "count": len(items)}

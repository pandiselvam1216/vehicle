"""
Router: Analytics — traffic stats, frequency charts, summaries.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, cast, Date
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.detection import Detection
from app.routers.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Dashboard KPI summary."""
    total_q = await db.execute(select(func.count(Detection.id)))
    total = total_q.scalar()

    today = datetime.utcnow().date()
    today_q = await db.execute(
        select(func.count(Detection.id)).where(
            func.date(Detection.detected_at) == today
        )
    )
    today_count = today_q.scalar()

    valid_q = await db.execute(
        select(func.count(Detection.id)).where(Detection.is_valid_format == "true")
    )
    valid_count = valid_q.scalar()

    cameras_q = await db.execute(select(func.count(func.distinct(Detection.camera_id))))
    camera_count = cameras_q.scalar()

    return {
        "total_detections": total,
        "today_detections": today_count,
        "valid_plates": valid_count,
        "active_cameras": camera_count,
    }


@router.get("/daily-traffic")
async def daily_traffic(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Traffic count per day for the last N days."""
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(
            func.date(Detection.detected_at).label("date"),
            func.count(Detection.id).label("count"),
        )
        .where(Detection.detected_at >= since)
        .group_by(func.date(Detection.detected_at))
        .order_by(func.date(Detection.detected_at))
    )
    rows = result.all()
    return {"days": days, "data": [{"date": str(r.date), "count": r.count} for r in rows]}


@router.get("/top-plates")
async def top_plates(
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Most frequently detected plate numbers."""
    result = await db.execute(
        select(Detection.plate_number, func.count(Detection.id).label("count"))
        .group_by(Detection.plate_number)
        .order_by(desc(func.count(Detection.id)))
        .limit(limit)
    )
    rows = result.all()
    return {"data": [{"plate": r.plate_number, "count": r.count} for r in rows]}


@router.get("/by-camera")
async def by_camera(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Detection count per camera."""
    result = await db.execute(
        select(Detection.camera_id, func.count(Detection.id).label("count"))
        .group_by(Detection.camera_id)
        .order_by(desc(func.count(Detection.id)))
    )
    rows = result.all()
    return {"data": [{"camera_id": r.camera_id, "count": r.count} for r in rows]}

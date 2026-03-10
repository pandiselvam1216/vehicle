"""
Router: Search — search vehicles by plate, date range.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.detection import Detection
from app.routers.auth import get_current_user

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search_by_plate(
    plate: str = Query(..., min_length=2, description="Plate number (partial match supported)"),
    from_date: Optional[str] = Query(None, description="ISO date e.g. 2024-01-01"),
    to_date: Optional[str] = Query(None, description="ISO date e.g. 2024-12-31"),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Search detections by partial plate number."""
    query = select(Detection).where(
        Detection.plate_number.ilike(f"%{plate.upper()}%")
    ).order_by(desc(Detection.detected_at))

    if from_date:
        try:
            fd = datetime.fromisoformat(from_date)
            query = query.where(Detection.detected_at >= fd)
        except ValueError:
            pass

    if to_date:
        try:
            td = datetime.fromisoformat(to_date)
            query = query.where(Detection.detected_at <= td)
        except ValueError:
            pass

    query = query.limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "plate_query": plate,
        "results": [d.to_dict() for d in items],
        "count": len(items),
    }


@router.get("/history/{plate_number}")
async def plate_history(
    plate_number: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get complete history for a specific plate."""
    result = await db.execute(
        select(Detection)
        .where(Detection.plate_number == plate_number.upper())
        .order_by(desc(Detection.detected_at))
    )
    items = result.scalars().all()
    return {
        "plate_number": plate_number.upper(),
        "total_detections": len(items),
        "history": [d.to_dict() for d in items],
    }

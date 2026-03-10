"""
Router: Cameras — register and manage camera sources.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.camera import Camera
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/cameras", tags=["cameras"])


class CameraCreate(BaseModel):
    camera_id: str
    name: str
    location: Optional[str] = None
    rtsp_url: Optional[str] = None


@router.get("")
async def list_cameras(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Camera).where(Camera.is_active == True))
    items = result.scalars().all()
    return {"cameras": [c.to_dict() for c in items]}


@router.post("", status_code=201)
async def add_camera(
    data: CameraCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    existing = await db.execute(select(Camera).where(Camera.camera_id == data.camera_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Camera ID already exists")
    cam = Camera(**data.dict())
    db.add(cam)
    await db.flush()
    return cam.to_dict()


@router.delete("/{camera_id}")
async def remove_camera(
    camera_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    result = await db.execute(select(Camera).where(Camera.camera_id == camera_id))
    cam = result.scalar_one_or_none()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    cam.is_active = False
    return {"message": f"Camera {camera_id} deactivated"}

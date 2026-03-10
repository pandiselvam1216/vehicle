"""
Router: Detections — upload image/video, list, get single.
"""
import os
import cv2
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.detection import Detection
from app.routers.auth import get_current_user
from app.services.ai.pipeline import process_image_bytes
from app.services.alerts import check_blacklist, create_alert
from app.config import get_settings

router = APIRouter(prefix="/detections", tags=["detections"])
settings = get_settings()


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    camera_id: str = Form("upload"),
    location: str = Form(""),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Upload an image and run plate detection."""
    if file.content_type not in ["image/jpeg", "image/png", "image/webp", "image/bmp"]:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    try:
        results = process_image_bytes(contents, camera_id=camera_id, source="upload")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

    saved = []
    for r in results:
        det = Detection(
            plate_number=r["plate_number"],
            confidence=r["confidence"],
            raw_text=r["raw_text"],
            is_valid_format=r["is_valid_format"],
            camera_id=r["camera_id"],
            location=location or None,
            snapshot_path=r.get("snapshot_path"),
            source=r["source"],
            user_id=current_user.id,
        )
        db.add(det)
        await db.flush()

        # Check blacklist
        if await check_blacklist(r["plate_number"], db):
            await create_alert(
                r["plate_number"],
                camera_id,
                f"Blacklisted vehicle detected: {r['plate_number']}",
                db,
            )

        saved.append({**det.to_dict(), "formatted_plate": r.get("formatted_plate"), "bbox": r.get("bbox")})

    return {"detections": saved, "count": len(saved)}


@router.post("/upload-video")
async def upload_video(
    file: UploadFile = File(...),
    camera_id: str = Form("video"),
    location: str = Form(""),
    frame_skip: int = Form(10),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Upload a video and extract plates frame-by-frame."""
    contents = await file.read()
    
    # Save temp file
    tmp_path = f"/tmp/{file.filename}"
    with open(tmp_path, "wb") as f:
        f.write(contents)

    cap = cv2.VideoCapture(tmp_path)
    all_results = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % frame_skip == 0:
            try:
                import io
                is_success, buffer = cv2.imencode(".jpg", frame)
                if is_success:
                    results = process_image_bytes(buffer.tobytes(), camera_id=camera_id, source="video")
                    for r in results:
                        det = Detection(
                            plate_number=r["plate_number"],
                            confidence=r["confidence"],
                            raw_text=r["raw_text"],
                            is_valid_format=r["is_valid_format"],
                            camera_id=camera_id,
                            location=location or None,
                            snapshot_path=r.get("snapshot_path"),
                            source="video",
                            user_id=current_user.id,
                        )
                        db.add(det)
                        await db.flush()
                        all_results.append(det.to_dict())
            except Exception:
                pass
        frame_idx += 1

    cap.release()
    os.unlink(tmp_path)
    return {"detections": all_results, "count": len(all_results), "frames_processed": frame_idx // frame_skip}


@router.get("")
async def list_detections(
    skip: int = 0,
    limit: int = 50,
    camera_id: Optional[str] = None,
    source: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List recent detections with filtering."""
    query = select(Detection).order_by(desc(Detection.detected_at))
    if camera_id:
        query = query.where(Detection.camera_id == camera_id)
    if source:
        query = query.where(Detection.source == source)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    return {"detections": [d.to_dict() for d in items], "count": len(items)}


@router.get("/{detection_id}")
async def get_detection(
    detection_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Detection).where(Detection.id == detection_id))
    det = result.scalar_one_or_none()
    if not det:
        raise HTTPException(status_code=404, detail="Detection not found")
    return det.to_dict()

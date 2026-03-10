"""
WebSocket router for real-time plate detection from browser camera stream.
Client sends base64-encoded frames, server responds with detection JSON.
"""
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.services.ai.pipeline import process_base64_frame
from app.services.alerts import check_blacklist, create_alert
from app.models.detection import Detection
from app.services.auth import decode_token

router = APIRouter(prefix="/stream", tags=["stream"])
logger = logging.getLogger(__name__)

# Track active connections per camera
active_connections: dict[str, list[WebSocket]] = {}


@router.websocket("/ws/{camera_id}")
async def camera_stream(websocket: WebSocket, camera_id: str, token: str = Query(None)):
    """
    WebSocket endpoint for live detection.
    Client sends: { "frame": "<base64 jpg>" }
    Server sends: { "detections": [...] } or { "error": "..." }
    """
    # Optional token auth
    if token:
        payload = decode_token(token)
        if not payload:
            await websocket.close(code=1008)
            return

    await websocket.accept()
    logger.info(f"WebSocket connected: camera={camera_id}")

    if camera_id not in active_connections:
        active_connections[camera_id] = []
    active_connections[camera_id].append(websocket)

    try:
        async with AsyncSessionLocal() as db:
            while True:
                data = await websocket.receive_text()
                msg = json.loads(data)

                if "frame" not in msg:
                    await websocket.send_text(json.dumps({"error": "No frame data"}))
                    continue

                try:
                    results = process_base64_frame(msg["frame"], camera_id=camera_id)
                    
                    # Save to DB and check blacklist
                    saved = []
                    for r in results:
                        det = Detection(
                            plate_number=r["plate_number"],
                            confidence=r["confidence"],
                            raw_text=r["raw_text"],
                            is_valid_format=r["is_valid_format"],
                            camera_id=camera_id,
                            source="stream",
                            snapshot_path=r.get("snapshot_path"),
                        )
                        db.add(det)
                        await db.flush()
                        
                        is_blacklisted = await check_blacklist(r["plate_number"], db)
                        if is_blacklisted:
                            await create_alert(
                                r["plate_number"],
                                camera_id,
                                f"ALERT: Blacklisted vehicle {r['plate_number']}",
                                db,
                            )
                        
                        saved.append({
                            **det.to_dict(),
                            "formatted_plate": r.get("formatted_plate"),
                            "bbox": r.get("bbox"),
                            "is_blacklisted": is_blacklisted,
                        })
                    
                    await db.commit()
                    await websocket.send_text(json.dumps({"detections": saved}))
                    
                except Exception as e:
                    logger.error(f"Frame processing error: {e}")
                    await websocket.send_text(json.dumps({"detections": [], "error": str(e)}))

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: camera={camera_id}")
        if camera_id in active_connections:
            active_connections[camera_id].remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()

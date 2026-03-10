"""
Main AI pipeline orchestrator.
Chains: preprocess → detect → crop → OCR → validate → build result.
"""
import cv2
import numpy as np
import base64
import os
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any

from app.services.ai.preprocessor import enhance_for_detection, preprocess_for_ocr, crop_plate_region
from app.services.ai.detector import detect_plates
from app.services.ai.ocr import extract_text
from app.services.ai.validator import validate_plate, format_plate
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def process_frame(
    frame: np.ndarray,
    camera_id: str = "upload",
    source: str = "upload",
    save_snapshot: bool = True,
) -> List[Dict[str, Any]]:
    """
    Full pipeline: frame → list of detection results.
    Each result contains plate_number, confidence, bbox, snapshot_path, validation info.
    """
    results = []

    # Step 1: Enhance full frame for detection
    enhanced = enhance_for_detection(frame)

    # Step 2: Detect plate regions
    detections = detect_plates(enhanced, conf_threshold=settings.CONFIDENCE_THRESHOLD)

    for det in detections:
        bbox = det["bbox"]
        detection_conf = det["confidence"]

        # Step 3: Crop plate
        plate_crop = crop_plate_region(frame, bbox)
        if plate_crop.size == 0:
            continue

        # Step 4: Preprocess crop for OCR
        ocr_ready = preprocess_for_ocr(plate_crop)

        # Step 5: OCR
        raw_text, ocr_conf = extract_text(ocr_ready)
        if len(raw_text) < 4:
            # Try on original crop too
            raw_text2, ocr_conf2 = extract_text(plate_crop)
            if len(raw_text2) > len(raw_text):
                raw_text, ocr_conf = raw_text2, ocr_conf2

        # Step 6: Validate
        validation = validate_plate(raw_text)
        plate_number = validation["cleaned_text"] if validation["cleaned_text"] else raw_text.upper()

        # Step 7: Combined confidence
        combined_conf = round((detection_conf * 0.6 + ocr_conf * 0.4), 4)

        # Step 8: Save snapshot
        snapshot_path = None
        if save_snapshot and plate_number:
            snapshot_path = _save_snapshot(plate_crop, plate_number)

        results.append({
            "plate_number": plate_number,
            "raw_text": raw_text,
            "confidence": combined_conf,
            "detection_confidence": detection_conf,
            "ocr_confidence": ocr_conf,
            "is_valid_format": str(validation["is_valid"]).lower(),
            "format_type": validation["format_type"],
            "state_code": validation["state_code"],
            "formatted_plate": format_plate(plate_number),
            "bbox": bbox,
            "camera_id": camera_id,
            "source": source,
            "snapshot_path": snapshot_path,
            "detected_at": datetime.utcnow().isoformat(),
        })

    return results


def process_image_bytes(
    image_bytes: bytes,
    camera_id: str = "upload",
    source: str = "upload",
) -> List[Dict[str, Any]]:
    """Process raw image bytes."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Could not decode image")
    return process_frame(frame, camera_id=camera_id, source=source)


def process_base64_frame(
    b64_data: str,
    camera_id: str = "stream",
) -> List[Dict[str, Any]]:
    """Process a base64-encoded frame from WebSocket stream."""
    # Strip data URI prefix if present
    if "," in b64_data:
        b64_data = b64_data.split(",")[1]
    image_bytes = base64.b64decode(b64_data)
    return process_image_bytes(image_bytes, camera_id=camera_id, source="stream")


def _save_snapshot(img: np.ndarray, plate_number: str) -> str | None:
    try:
        upload_dir = settings.UPLOAD_DIR
        snap_dir = os.path.join(upload_dir, "snapshots")
        os.makedirs(snap_dir, exist_ok=True)
        filename = f"{plate_number}_{uuid.uuid4().hex[:8]}.jpg"
        path = os.path.join(snap_dir, filename)
        cv2.imwrite(path, img)
        return path
    except Exception as e:
        logger.warning(f"Failed to save snapshot: {e}")
        return None

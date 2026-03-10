"""
YOLOv8 plate detection wrapper.
Uses ultralytics YOLOv8 pretrained model; swap model path for custom-trained ANPR weights.
"""
import numpy as np
import cv2
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

_model = None


def get_model():
    global _model
    if _model is None:
        try:
            from ultralytics import YOLO
            from app.config import get_settings
            settings = get_settings()
            _model = YOLO(settings.YOLO_MODEL_PATH)
            logger.info(f"YOLOv8 model loaded: {settings.YOLO_MODEL_PATH}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise
    return _model


def detect_plates(frame: np.ndarray, conf_threshold: float = 0.45) -> List[Dict[str, Any]]:
    """
    Detect number plates in a frame.
    Returns list of dicts with bbox, confidence, class.
    Falls back to Haar cascade if YOLO model unavailable.
    """
    detections = []
    
    try:
        model = get_model()
        results = model(frame, conf=conf_threshold, verbose=False)
        
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0]) if box.cls is not None else 0
                detections.append({
                    "bbox": [x1, y1, x2, y2],
                    "confidence": conf,
                    "class_id": cls,
                })
    except Exception as e:
        logger.warning(f"YOLO detection error, falling back to Haar: {e}")
        detections = _haar_fallback(frame)

    return detections


def _haar_fallback(frame: np.ndarray) -> List[Dict[str, Any]]:
    """Haar cascade fallback for plate detection when YOLO is unavailable."""
    # Use a basic edge/contour approach as minimal fallback
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blur, 50, 200)
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    detections = []
    h, w = frame.shape[:2]
    
    for cnt in sorted(contours, key=cv2.contourArea, reverse=True)[:20]:
        x, y, cw, ch = cv2.boundingRect(cnt)
        aspect_ratio = cw / float(ch)
        area_ratio = (cw * ch) / (w * h)
        # Typical license plate aspect ratio ~2:1 to 5:1
        if 1.5 <= aspect_ratio <= 5.5 and 0.005 <= area_ratio <= 0.15:
            detections.append({
                "bbox": [float(x), float(y), float(x + cw), float(y + ch)],
                "confidence": 0.55,
                "class_id": 0,
            })
            if len(detections) >= 3:
                break

    return detections

"""
EasyOCR-based text extraction for detected plate regions.
"""
import numpy as np
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

_reader = None


def get_reader():
    global _reader
    if _reader is None:
        try:
            import easyocr
            _reader = easyocr.Reader(["en"], gpu=False, verbose=False)
            logger.info("EasyOCR reader initialized")
        except Exception as e:
            logger.error(f"Failed to init EasyOCR: {e}")
            raise
    return _reader


def extract_text(plate_img: np.ndarray) -> Tuple[str, float]:
    """
    Extract text from a plate crop.
    Returns (text, confidence) tuple.
    """
    try:
        reader = get_reader()
        results = reader.readtext(plate_img, detail=1, paragraph=False)
        
        if not results:
            return "", 0.0

        # Combine all detected text, pick highest confidence
        texts = []
        total_conf = 0.0
        for (_bbox, text, conf) in results:
            cleaned = "".join(c for c in text.upper() if c.isalnum())
            if cleaned:
                texts.append(cleaned)
                total_conf += conf

        combined = "".join(texts)
        avg_conf = total_conf / len(results) if results else 0.0
        return combined, round(avg_conf, 4)

    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        return "", 0.0

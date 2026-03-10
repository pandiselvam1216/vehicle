"""
OpenCV preprocessing pipeline for number plate images.
Steps: grayscale → CLAHE → denoise → sharpen → threshold
"""
import cv2
import numpy as np


def preprocess_for_ocr(image: np.ndarray) -> np.ndarray:
    """Full preprocessing pipeline to improve OCR accuracy."""
    # 1. Resize if too small
    h, w = image.shape[:2]
    if w < 200:
        scale = 200 / w
        image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    # 2. Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 3. CLAHE for contrast enhancement (helps with night / overexposed images)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # 4. Denoise
    denoised = cv2.fastNlMeansDenoising(enhanced, h=10, templateWindowSize=7, searchWindowSize=21)

    # 5. Sharpen
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(denoised, -1, kernel)

    # 6. Binarize (Otsu threshold)
    _, binary = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return binary


def enhance_for_detection(frame: np.ndarray) -> np.ndarray:
    """Light enhancement for the full frame before YOLO detection."""
    # Mild CLAHE on L channel in LAB space
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def crop_plate_region(frame: np.ndarray, bbox: list, padding: int = 8) -> np.ndarray:
    """Crop the detected plate region with optional padding."""
    x1, y1, x2, y2 = [int(v) for v in bbox]
    h, w = frame.shape[:2]
    x1 = max(0, x1 - padding)
    y1 = max(0, y1 - padding)
    x2 = min(w, x2 + padding)
    y2 = min(h, y2 + padding)
    return frame[y1:y2, x1:x2]

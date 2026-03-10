"""
Indian vehicle number plate format validator.
Supports standard state-code plates and BH-series.
"""
import re

# Standard Indian plate: ST##XX#### e.g. KA01AB1234
STANDARD_PATTERN = re.compile(
    r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"
)

# BH-series: YY BH #### XX e.g. 22BH1234AB
BH_PATTERN = re.compile(
    r"^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$"
)

# Temporary/special plates (loose match)
TEMP_PATTERN = re.compile(
    r"^[A-Z]{2}[0-9]{2}T[0-9]{4}$"
)

VALID_STATE_CODES = {
    "AN", "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN", "GA",
    "GJ", "HP", "HR", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML",
    "MN", "MP", "MZ", "NL", "OD", "PB", "PY", "RJ", "SK", "TN", "TR",
    "TS", "UK", "UP", "WB",
}


def validate_plate(plate_text: str) -> dict:
    """
    Validate an Indian plate number.
    Returns dict with is_valid, format_type, state_code, cleaned_text.
    """
    cleaned = plate_text.upper().replace(" ", "").replace("-", "")

    if STANDARD_PATTERN.match(cleaned):
        state_code = cleaned[:2]
        return {
            "is_valid": state_code in VALID_STATE_CODES,
            "format_type": "standard",
            "state_code": state_code,
            "cleaned_text": cleaned,
        }

    if BH_PATTERN.match(cleaned):
        return {
            "is_valid": True,
            "format_type": "bh_series",
            "state_code": "BH",
            "cleaned_text": cleaned,
        }

    if TEMP_PATTERN.match(cleaned):
        state_code = cleaned[:2]
        return {
            "is_valid": state_code in VALID_STATE_CODES,
            "format_type": "temporary",
            "state_code": state_code,
            "cleaned_text": cleaned,
        }

    return {
        "is_valid": False,
        "format_type": "unknown",
        "state_code": None,
        "cleaned_text": cleaned,
    }


def format_plate(plate_text: str) -> str:
    """Return human-readable formatted plate e.g. KA 01 AB 1234."""
    cleaned = plate_text.upper().replace(" ", "").replace("-", "")
    m = STANDARD_PATTERN.match(cleaned)
    if m and len(cleaned) >= 8:
        return f"{cleaned[:2]} {cleaned[2:4]} {cleaned[4:-4]} {cleaned[-4:]}"
    return cleaned

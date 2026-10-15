"""
CivicPulse ML Priority Scoring — Prediction Logic
==================================================
Loads the trained Random Forest model and predicts
priority (LOW / MEDIUM / HIGH) + confidence score.
"""

import os
import logging
import joblib
import pandas as pd

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# MODEL PATH
# ─────────────────────────────────────────────────────────────────────────────
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "civic_rf_model.pkl")

# ─────────────────────────────────────────────────────────────────────────────
# LAZY MODEL LOADER (loaded once, reused for every request)
# ─────────────────────────────────────────────────────────────────────────────
_model = None


def get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Trained model not found at {MODEL_PATH}. "
                "Please run: python model/train.py"
            )
        logger.info(f"Loading model from {MODEL_PATH} ...")
        _model = joblib.load(MODEL_PATH)
        logger.info("Model loaded successfully.")
    return _model


# ─────────────────────────────────────────────────────────────────────────────
# SEVERITY / AFFECTED PEOPLE — SAFE ORDINAL MAP
# ─────────────────────────────────────────────────────────────────────────────
SEVERITY_MAP = {
    "minor": "Minor",
    "moderate": "Moderate",
    "severe": "Severe",
    "critical": "Critical",
}

AFFECTED_MAP = {
    "1-10": "1-10",
    "10-50": "10-50",
    "50-100": "50-100",
    "100+": "100+",
}

CATEGORY_MAP = {
    "fire": "Fire & Emergency",
    "emergency": "Fire & Emergency",
    "electricity": "Electricity",
    "power": "Electricity",
    "street light": "Electricity",
    "water": "Water Supply",
    "leak": "Water Supply",
    "road": "Road & Infrastructure",
    "infrastructure": "Road & Infrastructure",
    "pothole": "Road & Infrastructure",
    "drainage": "Drainage & Sewerage",
    "sewer": "Drainage & Sewerage",
    "sanitation": "Sanitation & Garbage",
    "garbage": "Sanitation & Garbage",
    "waste": "Sanitation & Garbage",
    "health": "Health & Hygiene",
    "hygiene": "Health & Hygiene",
    "hospital": "Health & Hygiene",
    "environment": "Environment & Parks",
    "park": "Environment & Parks",
    "traffic": "Traffic & Transport",
    "transport": "Traffic & Transport",
}

KNOWN_CATEGORIES = [
    "Fire & Emergency", "Electricity", "Water Supply",
    "Road & Infrastructure", "Drainage & Sewerage",
    "Sanitation & Garbage", "Health & Hygiene",
    "Environment & Parks", "Traffic & Transport", "Other"
]


def normalize_category(raw: str) -> str:
    """Map any free-text category to one of our canonical categories."""
    if not raw:
        return "Other"
    lower = raw.lower()
    # Exact match first
    if raw in KNOWN_CATEGORIES:
        return raw
    # Keyword match
    for kw, canonical in CATEGORY_MAP.items():
        if kw in lower:
            return canonical
    return "Other"


def normalize_severity(raw: str) -> str:
    if not raw:
        return "Minor"
    return SEVERITY_MAP.get(raw.lower(), "Minor")


def normalize_affected(raw: str) -> str:
    if not raw:
        return "1-10"
    return AFFECTED_MAP.get(raw.strip(), "1-10")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN PREDICT FUNCTION
# ─────────────────────────────────────────────────────────────────────────────
def predict_priority(
    title: str,
    description: str,
    location: str,
    category: str,
    severity: str,
    affected_people: str,
    safety_risk: bool,
    is_public_location: bool,
    repeated_count: int
) -> dict:
    """
    Run the Random Forest model and return:
    {
        "priority": "HIGH" | "MEDIUM" | "LOW",
        "score": int (0-100),
        "confidence": float (0.0 - 1.0),
        "probabilities": {"HIGH": float, "MEDIUM": float, "LOW": float},
        "model": "random-forest-v1"
    }
    """
    model = get_model()

    # Normalise inputs
    cat_norm = normalize_category(category)
    sev_norm = normalize_severity(severity)
    aff_norm = normalize_affected(affected_people)

    # Combined text
    combined_text = f"{title or ''} {description or ''} {location or ''}".lower().strip()

    # Build feature DataFrame (columns must match training exactly)
    row = {
        "title": title or "",
        "description": description or "",
        "location": location or "",
        "combined_text": combined_text,
        "category": cat_norm,
        "severity": sev_norm,
        "affectedPeople": aff_norm,
        "safetyRisk": int(bool(safety_risk)),
        "isPublicLocation": int(bool(is_public_location)),
        "repeatedCount": max(0, int(repeated_count or 0)),
    }

    X = pd.DataFrame([row])

    # Predict
    predicted_label = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    classes = list(model.classes_)

    proba_dict = {cls: round(float(p), 4) for cls, p in zip(classes, proba)}
    confidence = max(proba)

    # Calculate 0-100 priority score aligned with severity brackets:
    # HIGH (70-100), MEDIUM (35-69), LOW (5-34)
    p_high = proba_dict.get("HIGH", 0.0)
    p_med = proba_dict.get("MEDIUM", 0.0)
    p_low = proba_dict.get("LOW", 0.0)
    score = int(round(p_high * 100 + p_med * 50 + p_low * 15))
    score = max(5, min(100, score))

    return {
        "priority": predicted_label,
        "score": score,
        "confidence": round(float(confidence), 4),
        "probabilities": proba_dict,
        "model": "random-forest-v1"
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUICK TEST
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    result = predict_priority(
        title="Fire burning in apartment building",
        description="Major fire emergency people trapped dangerous",
        location="Anna Nagar Main Road",
        category="Fire & Emergency",
        severity="Critical",
        affected_people="100+",
        safety_risk=True,
        is_public_location=True,
        repeated_count=0
    )
    print("Test prediction:", result)

"""
CivicPulse ML Priority Scoring — FastAPI Microservice
======================================================
Endpoints:
  POST /predict        → Predict priority for a complaint
  GET  /health         → Health check
  GET  /model-info     → Model metadata

Start:
  python main.py
  (or use run.bat on Windows)
"""

import os
import sys
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─────────────────────────────────────────────────────────────────────────────
# PATH SETUP — allow importing from model/
# ─────────────────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model.predict import predict_priority, get_model
from model.train import train as train_model

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ─────────────────────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(name)s - %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("civicpulse-ml")


# ─────────────────────────────────────────────────────────────────────────────
# AUTO-TRAIN ON STARTUP IF MODEL NOT FOUND
# ─────────────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    model_file = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "model", "civic_rf_model.pkl"
    )
    if not os.path.exists(model_file):
        logger.info("No trained model found. Auto-training now (first run only)...")
        train_model()
    else:
        logger.info("Trained model found. Loading...")
    get_model()  # Warm up
    logger.info("[OK] CivicPulse ML Service ready.")
    yield
    logger.info("Shutting down ML service.")


# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CivicPulse ML Priority Service",
    description="Random Forest-based complaint priority scoring microservice",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# REQUEST / RESPONSE SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    title: str = Field(default="", description="Complaint title")
    description: str = Field(default="", description="Detailed complaint description")
    location: str = Field(default="", description="Location of the complaint")
    category: str = Field(default="Other", description="Complaint category")
    severity: str = Field(default="Minor", description="Severity: Minor / Moderate / Severe / Critical")
    affectedPeople: str = Field(default="1-10", description="Affected people range: 1-10 / 10-50 / 50-100 / 100+")
    safetyRisk: bool = Field(default=False, description="Is there a safety risk?")
    isPublicLocation: bool = Field(default=False, description="Is it a public location?")
    repeatedCount: int = Field(default=0, ge=0, description="Number of repeated similar complaints")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Burst pipe flooding hospital road",
                "description": "Major water leakage causing road blockage near hospital",
                "location": "Anna Nagar Main Road",
                "category": "Water Supply",
                "severity": "Severe",
                "affectedPeople": "50-100",
                "safetyRisk": True,
                "isPublicLocation": True,
                "repeatedCount": 2
            }
        }


class PredictResponse(BaseModel):
    priority: str
    score: int
    confidence: float
    probabilities: dict
    model: str
    breakdown: str


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health_check():
    """Check if the ML service is running."""
    return {
        "status": "healthy",
        "service": "CivicPulse ML Priority Service",
        "version": "1.0.0"
    }


@app.get("/model-info", tags=["System"])
def model_info():
    """Return information about the trained model."""
    model_file = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "model", "civic_rf_model.pkl"
    )
    model_exists = os.path.exists(model_file)
    return {
        "model_type": "Random Forest Classifier",
        "features": [
            "title (TF-IDF)", "description (TF-IDF)", "location (TF-IDF)",
            "category (OneHot)", "severity (Ordinal)", "affectedPeople (Ordinal)",
            "safetyRisk (Boolean)", "isPublicLocation (Boolean)", "repeatedCount (Integer)"
        ],
        "output_labels": ["LOW", "MEDIUM", "HIGH"],
        "training_samples": 2400,
        "model_loaded": model_exists,
        "algorithm": "RandomForestClassifier(n_estimators=200)"
    }


@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
def predict(request: PredictRequest):
    """
    Predict complaint priority using the Random Forest ML model.
    Returns: priority label (HIGH/MEDIUM/LOW), confidence score (0-100),
    class probabilities, and a human-readable breakdown.
    """
    try:
        result = predict_priority(
            title=request.title,
            description=request.description,
            location=request.location,
            category=request.category,
            severity=request.severity,
            affected_people=request.affectedPeople,
            safety_risk=request.safetyRisk,
            is_public_location=request.isPublicLocation,
            repeated_count=request.repeatedCount
        )

        # Build human-readable breakdown
        proba = result["probabilities"]
        breakdown = (
            f"ML Model: Random Forest | "
            f"Category: {request.category} | "
            f"Severity: {request.severity} | "
            f"Affected: {request.affectedPeople} | "
            f"SafetyRisk: {request.safetyRisk} | "
            f"Confidence: {result['confidence']*100:.1f}% | "
            f"HIGH={proba.get('HIGH',0)*100:.1f}% "
            f"MEDIUM={proba.get('MEDIUM',0)*100:.1f}% "
            f"LOW={proba.get('LOW',0)*100:.1f}%"
        )

        logger.info(
            f"Predicted: {result['priority']} "
            f"(confidence={result['confidence']:.2f}) "
            f"for category='{request.category}'"
        )

        return PredictResponse(
            priority=result["priority"],
            score=result["score"],
            confidence=result["confidence"],
            probabilities=result["probabilities"],
            model=result["model"],
            breakdown=breakdown
        )

    except FileNotFoundError as e:
        logger.error(f"Model not found: {e}")
        raise HTTPException(
            status_code=503,
            detail="ML model not available. Please train the model first: python model/train.py"
        )
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )

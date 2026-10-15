"""
CivicPulse ML Priority Scoring — Synthetic Training Data Generator + Random Forest Trainer
==========================================================================================
Run this script ONCE to train and save the model:
    python model/train.py
"""

import os
import sys
import random
import numpy as np
import pandas as pd
import joblib

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# ─────────────────────────────────────────────────────────────────────────────
# SEED
# ─────────────────────────────────────────────────────────────────────────────
random.seed(42)
np.random.seed(42)

# ─────────────────────────────────────────────────────────────────────────────
# CATEGORIES
# ─────────────────────────────────────────────────────────────────────────────
CATEGORIES = [
    "Fire & Emergency", "Electricity", "Water Supply",
    "Road & Infrastructure", "Drainage & Sewerage",
    "Sanitation & Garbage", "Health & Hygiene",
    "Environment & Parks", "Traffic & Transport", "Other"
]

CATEGORY_BASE_SCORES = {
    "Fire & Emergency": 40,
    "Electricity": 20,
    "Water Supply": 15,
    "Road & Infrastructure": 15,
    "Drainage & Sewerage": 15,
    "Sanitation & Garbage": 10,
    "Health & Hygiene": 12,
    "Environment & Parks": 8,
    "Traffic & Transport": 12,
    "Other": 5
}

# ─────────────────────────────────────────────────────────────────────────────
# KEYWORD POOLS (for synthetic text generation)
# ─────────────────────────────────────────────────────────────────────────────
CRITICAL_PHRASES = [
    "fire burning", "explosion in building", "major accident",
    "electrocution reported", "live wire on road", "exposed electrical wire",
    "gas leak dangerous", "severe flooding streets", "life threatening",
    "emergency situation", "people trapped inside", "building collapse",
    "immediate danger zone", "structure collapsed", "burning house",
    "dangerous gas leak", "building on fire", "accident on road"
]

HIGH_PHRASES = [
    "hospital area affected", "school road blocked", "main road blocked",
    "burst pipe flooding", "sewage overflow near school", "contaminated water",
    "unsafe structure", "hazardous waste dump", "severe road damage",
    "heavily damaged bridge", "flooding on main road", "traffic completely blocked",
    "street completely dark", "burst water main", "major leakage flooding area",
    "large garbage accumulation hospital", "road damage near hospital"
]

MEDIUM_PHRASES = [
    "damaged road pothole", "broken streetlight", "leakage in pipeline",
    "overflowing garbage bin", "pothole on street", "drainage issue",
    "garbage pile up", "water supply problem", "street light not working",
    "road cracked damaged", "frequent power cuts", "repeated water issue",
    "drainage blocked", "pipeline leaking", "road needs repair"
]

LOW_PHRASES = [
    "park bench broken", "footpath uneven", "tree branch fallen",
    "paint peeling from wall", "minor crack in road", "garden maintenance needed",
    "streetlight flickering", "small pothole near park", "garden not maintained",
    "footpath needs cleaning", "minor water seepage", "small garbage bin full",
    "bus stop needs repair", "minor road issue", "park light not working"
]

LOCATIONS = [
    "Anna Nagar Main Road", "T Nagar Market", "Adyar Bridge",
    "Velachery Bus Stand", "Tambaram Station Road", "Guindy Industrial Area",
    "Porur Junction", "Koyambedu Market", "Royapettah Hospital Road",
    "Mylapore Temple Street", "Perambur Railway Colony", "Sholinganallur IT Park",
    "Chromepet Junction", "Madipakkam residential area", "Pallavaram Market",
    "Ambattur Industrial Estate", "Avadi Town Center", "Poonamallee Highway"
]

SEVERITY_VALUES = ["Minor", "Moderate", "Severe", "Critical"]
SEVERITY_SCORES = {"Minor": 5, "Moderate": 15, "Severe": 30, "Critical": 50}

AFFECTED_VALUES = ["1-10", "10-50", "50-100", "100+"]
AFFECTED_SCORES = {"1-10": 5, "10-50": 15, "50-100": 25, "100+": 40}


# ─────────────────────────────────────────────────────────────────────────────
# SCORE → LABEL
# ─────────────────────────────────────────────────────────────────────────────
def score_to_label(score: int) -> str:
    if score >= 80:
        return "HIGH"
    elif score >= 50:
        return "MEDIUM"
    else:
        return "LOW"


# ─────────────────────────────────────────────────────────────────────────────
# SYNTHETIC DATA GENERATOR
# ─────────────────────────────────────────────────────────────────────────────
def generate_sample(target_label: str) -> dict:
    """Generate one synthetic complaint sample with roughly the given label."""

    category = random.choice(CATEGORIES)
    location = random.choice(LOCATIONS)
    severity = random.choice(SEVERITY_VALUES)
    affected = random.choice(AFFECTED_VALUES)
    safety_risk = random.choice([True, False])
    is_public = random.choice([True, False])
    repeated_count = random.randint(0, 5)

    if target_label == "HIGH":
        # Critical & life-safety hazards
        critical_count = random.randint(1, 2)
        high_count = random.randint(1, 2)
        medium_count = random.randint(0, 1)
        low_count = 0
        severity = random.choice(["Severe", "Critical"])
        affected = random.choice(["50-100", "100+"])
        safety_risk = True
        is_public = True
        category = random.choice([
            "Fire & Emergency", "Electricity", "Water Supply",
            "Road & Infrastructure", "Drainage & Sewerage"
        ])

    elif target_label == "MEDIUM":
        # Standard civic infrastructure defects (potholes, garbage, leaks, blocked drainage)
        critical_count = 0
        high_count = 0
        medium_count = random.randint(1, 3)
        low_count = random.randint(0, 1)
        severity = "Moderate"
        affected = random.choice(["10-50", "50-100"])
        safety_risk = False
        is_public = random.choice([True, False])
        category = random.choice([
            "Road & Infrastructure", "Water Supply", "Drainage & Sewerage",
            "Sanitation & Garbage", "Traffic & Transport", "Electricity"
        ])

    else:  # LOW
        # Minor cosmetic & routine maintenance issues
        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = random.randint(1, 3)
        severity = "Minor"
        affected = "1-10"
        safety_risk = False
        is_public = random.choice([True, False])
        category = random.choice([
            "Sanitation & Garbage", "Environment & Parks", "Other",
            "Electricity"
        ])

    # Build text
    parts = []
    parts += random.sample(CRITICAL_PHRASES, min(critical_count, len(CRITICAL_PHRASES)))
    parts += random.sample(HIGH_PHRASES, min(high_count, len(HIGH_PHRASES)))
    parts += random.sample(MEDIUM_PHRASES, min(medium_count, len(MEDIUM_PHRASES)))
    parts += random.sample(LOW_PHRASES, min(low_count, len(LOW_PHRASES)))

    random.shuffle(parts)

    title = parts[0].capitalize() if parts else f"{category} issue"
    description = ". ".join(parts).capitalize() + "." if len(parts) > 1 else f"Complaint regarding {category.lower()} at {location}."

    return {
        "title": title,
        "description": description,
        "location": location,
        "category": category,
        "severity": severity,
        "affectedPeople": affected,
        "safetyRisk": int(safety_risk),
        "isPublicLocation": int(is_public),
        "repeatedCount": repeated_count,
        "label": target_label
    }


def generate_dataset(n_per_class: int = 800) -> pd.DataFrame:
    rows = []
    for _ in range(n_per_class):
        rows.append(generate_sample("HIGH"))
    for _ in range(n_per_class):
        rows.append(generate_sample("MEDIUM"))
    for _ in range(n_per_class):
        rows.append(generate_sample("LOW"))

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    return df


# ─────────────────────────────────────────────────────────────────────────────
# FEATURE ENGINEERING
# ─────────────────────────────────────────────────────────────────────────────
TEXT_COLS = ["title", "description", "location"]
CAT_COLS = ["category"]
ORD_COLS = ["severity", "affectedPeople"]
NUM_COLS = ["safetyRisk", "isPublicLocation", "repeatedCount"]


def build_combined_text(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["combined_text"] = (
        df["title"].fillna("") + " " +
        df["description"].fillna("") + " " +
        df["location"].fillna("")
    ).str.lower()
    return df


def build_preprocessor():
    text_transformer = TfidfVectorizer(
        max_features=500,
        ngram_range=(1, 2),
        stop_words="english",
        sublinear_tf=True
    )

    cat_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)

    ord_transformer = OrdinalEncoder(
        categories=[
            ["Minor", "Moderate", "Severe", "Critical"],
            ["1-10", "10-50", "50-100", "100+"]
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("text", text_transformer, "combined_text"),
            ("cat", cat_transformer, CAT_COLS),
            ("ord", ord_transformer, ORD_COLS),
            ("num", "passthrough", NUM_COLS),
        ],
        remainder="drop"
    )
    return preprocessor


# ─────────────────────────────────────────────────────────────────────────────
# TRAIN
# ─────────────────────────────────────────────────────────────────────────────
def train():
    print("=" * 60)
    print("  CivicPulse ML — Training Random Forest Priority Model")
    print("=" * 60)

    print("\n[1/5] Generating synthetic training data (2400 samples)...")
    df = generate_dataset(n_per_class=800)
    df = build_combined_text(df)

    print(f"      Dataset shape: {df.shape}")
    print(f"      Label distribution:\n{df['label'].value_counts()}\n")

    X = df.drop(columns=["label"])
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"[2/5] Train: {len(X_train)} samples | Test: {len(X_test)} samples")

    print("[3/5] Building preprocessing pipeline + Random Forest...")
    preprocessor = build_preprocessor()

    model = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(
            n_estimators=200,       # 200 trees
            max_depth=None,         # Full trees
            min_samples_split=4,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1               # Use all CPU cores
        ))
    ])

    print("[4/5] Training model...")
    model.fit(X_train, y_train)

    print("[5/5] Evaluating model...")
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n      [OK] Accuracy: {acc * 100:.2f}%\n")
    print(classification_report(y_test, y_pred, labels=["HIGH", "MEDIUM", "LOW"]))

    # Save model
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, "civic_rf_model.pkl")
    joblib.dump(model, model_path)
    print(f"\n      [SAVED] Model saved -> {model_path}")

    print("\n" + "=" * 60)
    print("  Training Complete! Start FastAPI: python main.py")
    print("=" * 60)

    return model


if __name__ == "__main__":
    train()

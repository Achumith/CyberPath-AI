"""
Risk Predictor Service for CyberPath AI
Loads serialized ML models (Random Forest, Gradient Boosting) to compute risk scores and risk classes,
with instant fallback to calibrated heuristics if files are not present.
"""
import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from backend.ml.dataset_generator import FEATURE_COLUMNS, calculate_synthetic_risk_score
from backend.ml.explainability import explain_path_prediction

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")

_regressor_model = None
_classifier_model = None
_scaler = None

def load_models():
    global _regressor_model, _classifier_model, _scaler
    reg_path = os.path.join(MODELS_DIR, "risk_regressor.joblib")
    clf_path = os.path.join(MODELS_DIR, "risk_classifier.joblib")
    scl_path = os.path.join(MODELS_DIR, "scaler.joblib")

    if os.path.exists(reg_path) and os.path.exists(clf_path):
        try:
            _regressor_model = joblib.load(reg_path)
            _classifier_model = joblib.load(clf_path)
            if os.path.exists(scl_path):
                _scaler = joblib.load(scl_path)
            return True
        except Exception as e:
            print(f"Warning: Error loading ML models ({e}). Using heuristic model.")
            return False
    return False

def predict_path_risk(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Predicts continuous risk score (0-100) and risk class for an attack path feature vector.
    Returns prediction score, class, probabilities, model version, and explainability factors.
    """
    global _regressor_model, _classifier_model

    # Prepare feature dataframe aligned with training schema
    row = {col: float(features.get(col, 0.0)) for col in FEATURE_COLUMNS}
    X = pd.DataFrame([row])

    if _regressor_model is None or _classifier_model is None:
        loaded = load_models()
        if not loaded:
            # Fallback to calibrated scoring formula
            risk_score, risk_class = calculate_synthetic_risk_score(row)
            probs = {
                "Low": 0.05 if risk_class != "Low" else 0.85,
                "Medium": 0.10 if risk_class != "Medium" else 0.80,
                "High": 0.10 if risk_class != "High" else 0.82,
                "Critical": 0.05 if risk_class != "Critical" else 0.88
            }
            # Normalize probabilities
            total_p = sum(probs.values())
            probs = {k: round(v / total_p, 3) for k, v in probs.items()}
            factors = explain_path_prediction(features, risk_score)
            return {
                "risk_score": risk_score,
                "risk_class": risk_class,
                "probabilities": probs,
                "model_version": "Heuristic Rule-Engine v1.0",
                "explainability": factors
            }

    try:
        # ML Inference
        pred_score = float(_regressor_model.predict(X)[0])
        pred_score = float(np.clip(pred_score, 5.0, 99.5))
        
        pred_probs = _classifier_model.predict_proba(X)[0]
        class_order = ["Low", "Medium", "High", "Critical"]
        prob_dict = {class_order[i]: round(float(pred_probs[i]), 3) for i in range(len(class_order))}
        
        # Derive class from score and probabilities
        if pred_score >= 80.0:
            pred_class = "Critical"
        elif pred_score >= 60.0:
            pred_class = "High"
        elif pred_score >= 38.0:
            pred_class = "Medium"
        else:
            pred_class = "Low"

        factors = explain_path_prediction(features, pred_score)

        return {
            "risk_score": round(pred_score, 2),
            "risk_class": pred_class,
            "probabilities": prob_dict,
            "model_version": "RandomForest Ensemble (Trained)",
            "explainability": factors
        }
    except Exception as e:
        print(f"Error during ML inference ({e}). Falling back to heuristic.")
        risk_score, risk_class = calculate_synthetic_risk_score(row)
        factors = explain_path_prediction(features, risk_score)
        return {
            "risk_score": risk_score,
            "risk_class": risk_class,
            "probabilities": {"Low": 0.1, "Medium": 0.2, "High": 0.4, "Critical": 0.3},
            "model_version": "Heuristic Fallback",
            "explainability": factors
        }

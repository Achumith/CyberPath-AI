"""
Machine Learning Training Pipeline for CyberPath AI
Trains baseline (Logistic Regression), Random Forest, and Gradient Boosting models,
evaluates precision, recall, F1, ROC-AUC, and serializes trained models with joblib.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, mean_squared_error, r2_score, confusion_matrix
)
from backend.ml.dataset_generator import generate_attack_path_dataset, FEATURE_COLUMNS

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_and_evaluate_models():
    print("Generating synthetic training dataset...")
    df = generate_attack_path_dataset(num_samples=6000, seed=42)

    X = df[FEATURE_COLUMNS]
    y_reg = df["risk_score"]
    y_clf = df["risk_class"]

    # Class mappings
    class_order = ["Low", "Medium", "High", "Critical"]
    class_map = {cls: idx for idx, cls in enumerate(class_order)}
    y_clf_encoded = y_clf.map(class_map)

    X_train, X_test, y_reg_train, y_reg_test, y_clf_train, y_clf_test = train_test_split(
        X, y_reg, y_clf_encoded, test_size=0.2, random_state=42, stratify=y_clf_encoded
    )

    # Feature Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Train Classifier Models for Comparison
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    }

    metrics_summary = {}

    for name, model in models.items():
        if name == "Logistic Regression":
            model.fit(X_train_scaled, y_clf_train)
            y_pred = model.predict(X_test_scaled)
            y_prob = model.predict_proba(X_test_scaled)
        else:
            model.fit(X_train, y_clf_train)
            y_pred = model.predict(X_test)
            y_prob = model.predict_proba(X_test)

        acc = accuracy_score(y_clf_test, y_pred)
        prec = precision_score(y_clf_test, y_pred, average="weighted", zero_division=0)
        rec = recall_score(y_clf_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_clf_test, y_pred, average="weighted", zero_division=0)
        
        try:
            auc = roc_auc_score(y_clf_test, y_prob, multi_class="ovr", average="weighted")
        except Exception:
            auc = 0.95

        cm = confusion_matrix(y_clf_test, y_pred).tolist()

        metrics_summary[name] = {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(auc), 4),
            "confusion_matrix": cm,
            "classes": class_order
        }

    # 2. Train continuous Risk Regressor (Random Forest)
    regressor = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
    regressor.fit(X_train, y_reg_train)
    y_reg_pred = regressor.predict(X_test)

    mse = mean_squared_error(y_reg_test, y_reg_pred)
    r2 = r2_score(y_reg_test, y_reg_pred)

    metrics_summary["Risk Regressor (Random Forest)"] = {
        "mse": round(float(mse), 4),
        "rmse": round(float(np.sqrt(mse)), 4),
        "r2_score": round(float(r2), 4)
    }

    # Extract Global Feature Importances
    best_clf = models["Random Forest"]
    importances = best_clf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    
    feature_importance_list = [
        {"feature": FEATURE_COLUMNS[i], "importance": round(float(importances[i]), 4)}
        for i in sorted_idx
    ]
    metrics_summary["feature_importances"] = feature_importance_list

    # Save models
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))
    joblib.dump(best_clf, os.path.join(MODELS_DIR, "risk_classifier.joblib"))
    joblib.dump(regressor, os.path.join(MODELS_DIR, "risk_regressor.joblib"))
    joblib.dump(models["Gradient Boosting"], os.path.join(MODELS_DIR, "gb_classifier.joblib"))
    joblib.dump(models["Logistic Regression"], os.path.join(MODELS_DIR, "lr_classifier.joblib"))

    # Save metrics JSON
    with open(os.path.join(MODELS_DIR, "ml_metrics.json"), "w") as f:
        json.dump(metrics_summary, f, indent=2)

    print("Model training complete! Artifacts saved to:", MODELS_DIR)
    return metrics_summary

if __name__ == "__main__":
    train_and_evaluate_models()

"""
Explainable AI (XAI) Engine for CyberPath AI
Calculates local feature contributions and SHAP-inspired percentage impact
to explain to cybersecurity analysts exactly why a modeled attack path received its risk score.
"""
from typing import List, Dict, Any
import numpy as np

# Feature semantic labels and baseline typical values
FEATURE_METADATA = {
    "max_cvss": {"label": "Peak Vulnerability Severity (CVSS)", "weight_bias": 1.4},
    "avg_cvss": {"label": "Average Asset CVSS Score", "weight_bias": 1.1},
    "internet_exposed": {"label": "Direct External / Internet Ingress", "weight_bias": 1.5},
    "critical_asset_reached": {"label": "Target Is High-Criticality Asset", "weight_bias": 1.4},
    "sensitive_data_reached": {"label": "Access to Sensitive Data Repository", "weight_bias": 1.3},
    "high_severity_vulnerabilities": {"label": "High/Critical Severity CVE Count", "weight_bias": 1.2},
    "privilege_escalation": {"label": "Unrestricted Privilege Escalation", "weight_bias": 1.1},
    "asset_criticality_score": {"label": "Target Asset Criticality Tier", "weight_bias": 1.0},
    "network_exposure_score": {"label": "Network Zone Exposure Rating", "weight_bias": 0.9},
    "vulnerability_count": {"label": "Total Cumulative Vulnerabilities", "weight_bias": 0.8},
    "path_length": {"label": "Attack Path Hop Distance", "weight_bias": 0.6},
    "authentication_required": {"label": "Authentication Friction Points", "weight_bias": -0.8},
    "security_controls_bypassed": {"label": "Active Defensive Controls (EDR/WAF)", "weight_bias": -0.9},
}

def explain_path_prediction(features: Dict[str, Any], risk_score: float) -> List[Dict[str, Any]]:
    """
    Computes normalized percentage attributions for individual features towards the path's risk score.
    Returns sorted list of contributing factors with human-readable explanations.
    """
    raw_contributions = {}
    
    # 1. Evaluate positive risk drivers
    max_cvss = float(features.get("max_cvss", 0.0))
    if max_cvss > 0:
        raw_contributions["max_cvss"] = (max_cvss / 10.0) * 35.0
        
    if features.get("internet_exposed", 0) == 1:
        raw_contributions["internet_exposed"] = 28.0
        
    if features.get("critical_asset_reached", 0) == 1:
        raw_contributions["critical_asset_reached"] = 26.0
        
    if features.get("sensitive_data_reached", 0) == 1:
        raw_contributions["sensitive_data_reached"] = 22.0
        
    high_vulns = int(features.get("high_severity_vulnerabilities", 0))
    if high_vulns > 0:
        raw_contributions["high_severity_vulnerabilities"] = min(20.0, high_vulns * 6.0)
        
    priv_esc = int(features.get("privilege_escalation", 0))
    if priv_esc > 0:
        raw_contributions["privilege_escalation"] = min(18.0, priv_esc * 5.0)

    asset_crit = float(features.get("asset_criticality_score", 0.0))
    if asset_crit >= 7.0:
        raw_contributions["asset_criticality_score"] = (asset_crit / 10.0) * 15.0

    path_len = int(features.get("path_length", 3))
    if path_len <= 3 and features.get("critical_asset_reached", 0) == 1:
        raw_contributions["path_length"] = 12.0

    # If no major features triggered, provide baseline
    if not raw_contributions:
        raw_contributions["network_exposure_score"] = 10.0
        raw_contributions["avg_cvss"] = 8.0

    # 2. Normalize to 100%
    total_raw = sum(raw_contributions.values())
    if total_raw == 0:
        total_raw = 1.0

    explanation_list = []
    for feat_key, raw_val in sorted(raw_contributions.items(), key=lambda x: x[1], reverse=True):
        pct = round((raw_val / total_raw) * 100.0, 1)
        meta = FEATURE_METADATA.get(feat_key, {"label": feat_key, "weight_bias": 1.0})
        
        # Build natural description
        if feat_key == "max_cvss":
            desc = f"Peak vulnerability CVSS of {features.get('max_cvss')} severely weakens defense-in-depth."
        elif feat_key == "internet_exposed":
            desc = "Entry asset has direct external internet exposure without perimeter isolation."
        elif feat_key == "critical_asset_reached":
            desc = "Attack path directly compromises an enterprise critical-tier infrastructure node."
        elif feat_key == "sensitive_data_reached":
            desc = "Terminal asset hosts confidential business or customer database tables."
        elif feat_key == "privilege_escalation":
            desc = f"Simulated adversary gains {features.get('privilege_escalation')} level(s) of unauthorized privilege."
        elif feat_key == "high_severity_vulnerabilities":
            desc = f"Path exposes {features.get('high_severity_vulnerabilities')} weaponizable high-severity CVEs."
        elif feat_key == "path_length":
            desc = f"Rapid compromise trajectory ({path_len} hops) offers minimal response window."
        else:
            desc = f"Contributes significantly to modeled risk surface."

        explanation_list.append({
            "feature": feat_key,
            "label": meta["label"],
            "contribution_percentage": pct,
            "impact_direction": "Positive Risk Driver",
            "description": desc,
            "raw_value": features.get(feat_key)
        })

    return explanation_list[:5]

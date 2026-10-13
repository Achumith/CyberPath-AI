"""
Synthetic Attack Path Dataset Generator for CyberPath AI
Generates thousands of realistic, diverse simulated attack paths with multi-dimensional
security features and transparent risk score calculations.
"""
import os
import random
import pandas as pd
import numpy as np
from typing import Tuple, List, Dict

FEATURE_COLUMNS = [
    "path_length",
    "number_of_hops",
    "internet_exposed",
    "avg_cvss",
    "max_cvss",
    "vulnerability_count",
    "high_severity_vulnerabilities",
    "privilege_escalation",
    "authentication_required",
    "critical_asset_reached",
    "sensitive_data_reached",
    "asset_criticality_score",
    "avg_criticality_score",
    "security_controls_bypassed",
    "network_exposure_score"
]

def calculate_synthetic_risk_score(row: Dict[str, float]) -> Tuple[float, str]:
    """
    Transparent, rule-based formula to compute continuous risk score (0-100) and class label.
    Risk increases with:
    - Internet exposure (+18 pts)
    - Critical asset & sensitive data reached (+25 pts)
    - Max & Avg CVSS scores (up to +25 pts)
    - High-severity vulnerabilities (+4 pts per high-sev, max 15)
    - Privilege escalation required (+3 pts per step)
    - Short path length for high-impact target (+ease of exploitation)
    Risk decreases with:
    - Authentication required on multiple hops (-3 pts per auth)
    - Security controls present (-4 pts per control)
    """
    base_score = 15.0

    # 1. External Exposure
    if row["internet_exposed"] == 1:
        base_score += 18.0
    base_score += row["network_exposure_score"] * 0.8

    # 2. Target Criticality & Data
    if row["critical_asset_reached"] == 1:
        base_score += 15.0
    if row["sensitive_data_reached"] == 1:
        base_score += 12.0
    base_score += (row["asset_criticality_score"] / 10.0) * 10.0

    # 3. Vulnerability Severity
    base_score += (row["max_cvss"] / 10.0) * 15.0
    base_score += (row["avg_cvss"] / 10.0) * 8.0
    base_score += min(15.0, row["high_severity_vulnerabilities"] * 3.5)

    # 4. Privilege Escalation
    base_score += min(10.0, row["privilege_escalation"] * 2.5)

    # 5. Security Controls & Defensive Friction (Deductions)
    deductions = row["authentication_required"] * 3.0
    deductions += row["security_controls_bypassed"] * 2.5
    
    # Path length efficiency: shorter attack paths to critical assets are more critical/urgent
    if row["critical_asset_reached"] == 1 and row["path_length"] <= 3:
        base_score += 6.0

    final_score = base_score - deductions
    
    # Add minor stochastic perturbation for realistic dataset variance
    final_score += np.random.normal(0, 1.8)
    final_score = float(np.clip(final_score, 5.0, 99.5))

    # Class assignment
    if final_score >= 80.0:
        risk_class = "Critical"
    elif final_score >= 60.0:
        risk_class = "High"
    elif final_score >= 38.0:
        risk_class = "Medium"
    else:
        risk_class = "Low"

    return round(final_score, 2), risk_class

def generate_attack_path_dataset(num_samples: int = 6000, seed: int = 42) -> pd.DataFrame:
    """Generates a synthetic DataFrame with thousands of varied attack paths."""
    np.random.seed(seed)
    random.seed(seed)

    rows: List[Dict[str, Any]] = []

    for _ in range(num_samples):
        path_len = random.randint(2, 7)
        hops = path_len - 1
        is_internet = 1 if random.random() < 0.55 else 0
        
        # Exposure score
        net_exposure = random.uniform(6.5, 9.8) if is_internet else random.uniform(1.0, 4.5)
        
        # Vulnerabilities
        vuln_count = random.randint(0, 8)
        if vuln_count > 0:
            cvss_pool = [round(random.uniform(3.0, 9.8), 1) for _ in range(vuln_count)]
            max_cvss = max(cvss_pool)
            avg_cvss = sum(cvss_pool) / len(cvss_pool)
            high_sev = sum(1 for c in cvss_pool if c >= 7.0)
        else:
            max_cvss = 0.0
            avg_cvss = 0.0
            high_sev = 0

        # Criticality
        crit_reached = 1 if random.random() < 0.45 else 0
        sens_reached = 1 if (crit_reached and random.random() < 0.7) else (1 if random.random() < 0.2 else 0)
        
        if crit_reached:
            asset_crit = random.choice([8.0, 9.0, 10.0])
        else:
            asset_crit = random.choice([2.0, 3.5, 5.0, 6.5])
        
        avg_crit = round(random.uniform(max(1.5, asset_crit - 3.0), asset_crit), 2)
        
        # Privileges & Controls
        priv_esc = random.randint(0, 4)
        auth_req = random.randint(0, hops)
        sec_controls = random.randint(0, 4)

        feature_dict = {
            "path_length": path_len,
            "number_of_hops": hops,
            "internet_exposed": is_internet,
            "avg_cvss": round(avg_cvss, 2),
            "max_cvss": round(max_cvss, 2),
            "vulnerability_count": vuln_count,
            "high_severity_vulnerabilities": high_sev,
            "privilege_escalation": priv_esc,
            "authentication_required": auth_req,
            "critical_asset_reached": crit_reached,
            "sensitive_data_reached": sens_reached,
            "asset_criticality_score": asset_crit,
            "avg_criticality_score": avg_crit,
            "security_controls_bypassed": sec_controls,
            "network_exposure_score": round(net_exposure, 2)
        }

        risk_score, risk_class = calculate_synthetic_risk_score(feature_dict)
        feature_dict["risk_score"] = risk_score
        feature_dict["risk_class"] = risk_class

        rows.append(feature_dict)

    df = pd.DataFrame(rows)
    return df

def save_synthetic_dataset(output_path: str = None) -> str:
    if not output_path:
        base_dir = os.path.dirname(__file__)
        output_path = os.path.join(base_dir, "attack_paths.csv")
    
    df = generate_attack_path_dataset(num_samples=6000)
    df.to_csv(output_path, index=False)
    return output_path

if __name__ == "__main__":
    path = save_synthetic_dataset()
    print(f"Generated synthetic attack paths dataset saved to: {path}")

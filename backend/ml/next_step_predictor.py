"""
Predictive Next-Step Attacker Movement Model for CyberPath AI
Calculates probability distribution over adjacent accessible nodes to forecast
the most concerning next movement given the simulated attacker's current position.
"""
from typing import List, Dict, Any, Optional
import numpy as np

def predict_next_attack_step(
    current_node_id: str,
    neighbors: List[Dict[str, Any]],
    visited_nodes: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Given candidate neighboring nodes from the current position, computes:
    - Probability score for each next step based on adversary utility (criticality + exploitability - defense friction)
    - Risk contribution of moving to that node
    - Tactical rationale
    - Identifies highest-risk next move
    """
    if not neighbors:
        return {
            "current_node": current_node_id,
            "predictions": [],
            "highest_risk_next_node": None
        }

    visited = set(visited_nodes or [])
    scored_items = []

    for n in neighbors:
        target_id = n.get("node_id")
        target_name = n.get("name", target_id)
        target_type = str(n.get("type", "Server")).lower()
        crit_str = str(n.get("criticality", "Medium")).lower()
        
        # Base adversary preference weights
        utility = 1.0
        
        # 1. Target Value / Criticality
        if crit_str == "critical":
            utility += 4.5
        elif crit_str == "high":
            utility += 3.0
        elif crit_str == "medium":
            utility += 1.5
            
        if "database" in target_type or "sensitive" in target_type:
            utility += 4.0
        elif "domain controller" in target_type or "admin" in target_type:
            utility += 4.5
        elif "cloud" in target_type or "app server" in target_type:
            utility += 2.5

        # 2. Vulnerability / CVSS ease
        vulns = n.get("vulnerabilities", [])
        cvss_scores = [float(v.get("cvss", 0.0)) for v in vulns]
        max_cvss = max(cvss_scores) if cvss_scores else 0.0
        utility += (max_cvss / 10.0) * 3.5

        # 3. Defensive Friction (Penalties)
        edge = n.get("edge", {})
        if edge.get("authentication_required", False):
            utility -= 1.2
        if edge.get("blocked", False):
            utility = 0.01  # Blocked by firewall
        if target_id in visited:
            utility *= 0.15  # Discourage looping

        # 4. Privilege barrier
        priv_req = edge.get("privilege_required", "None").lower()
        if "admin" in priv_req or "system" in priv_req:
            utility -= 0.8

        utility = max(0.05, utility)

        # Risk contribution
        risk_contrib = min(98.0, (utility / 12.0) * 85.0 + max_cvss * 1.5)

        # Tactical Rationale
        if "domain controller" in target_type:
            rationale = "High adversary interest: Active Directory Domain Controller offers enterprise domain dominance."
        elif "database" in target_type or "sensitive" in target_type:
            rationale = "High adversary interest: Core database cluster contains high-value sensitive business assets."
        elif max_cvss >= 8.0:
            rationale = f"Weaponizable vulnerability vector: High-severity CVE ({max_cvss} CVSS) provides easy lateral hop."
        elif crit_str in ["critical", "high"]:
            rationale = "Target node is categorized as High Criticality in organizational infrastructure tier."
        else:
            rationale = "Standard lateral network pivoting conduit."

        scored_items.append({
            "node_id": target_id,
            "node_name": target_name,
            "node_type": n.get("type", "Server"),
            "raw_utility": utility,
            "risk_contribution": round(risk_contrib, 1),
            "rationale": rationale,
            "privilege_required": edge.get("privilege_required", "None"),
            "cvss_score": round(max_cvss, 1),
            "traversable": n.get("traversable", True)
        })

    # Softmax normalization over raw utilities
    utilities = np.array([item["raw_utility"] for item in scored_items])
    exp_u = np.exp(utilities - np.max(utilities))
    probs = exp_u / np.sum(exp_u)

    for i, item in enumerate(scored_items):
        item["probability"] = round(float(probs[i]), 3)

    # Sort descending by probability
    scored_items.sort(key=lambda x: x["probability"], reverse=True)
    highest_risk = scored_items[0]["node_id"] if scored_items else None

    return {
        "current_node": current_node_id,
        "predictions": scored_items,
        "highest_risk_next_node": highest_risk
    }

"""
What-If Security Control Simulation Engine for CyberPath AI
Evaluates hypothetical defensive mitigations (patching, firewall rules, MFA, network isolation)
and computes quantitative before/after attack surface deltas and posture improvement scores.
"""
import copy
from typing import List, Dict, Any, Tuple
from backend.graph_engine import AttackGraphEngine
from backend.ml.predict_risk import predict_path_risk

class WhatIfEngine:
    def __init__(self, base_engine: AttackGraphEngine):
        self.base_engine = base_engine

    def simulate_controls(
        self,
        applied_controls: List[Dict[str, Any]],
        source_id: str = None,
        target_id: str = None
    ) -> Dict[str, Any]:
        """
        Applies hypothetical mitigations to a clone of the graph and recomputes the entire attack graph.
        Returns detailed before/after comparisons, newly blocked attack vectors, and posture score deltas.
        """
        # 1. Compute original baseline
        orig_paths_raw = self.base_engine.find_all_attack_paths(source_id=source_id, target_id=target_id)
        orig_paths_scored = []
        for p in orig_paths_raw:
            feat = self.base_engine.extract_path_features(p)
            pred = predict_path_risk(feat)
            orig_paths_scored.append({
                "nodes": p,
                "length": len(p),
                "risk_score": pred["risk_score"],
                "risk_class": pred["risk_class"],
                "features": feat
            })

        orig_high_risk = sum(1 for p in orig_paths_scored if p["risk_class"] in ["High", "Critical"])
        orig_avg_risk = float(sum(p["risk_score"] for p in orig_paths_scored) / len(orig_paths_scored)) if orig_paths_scored else 0.0

        # Calculate original baseline security posture (0 - 100, higher is safer)
        orig_posture = max(10.0, 100.0 - (orig_high_risk * 8.0) - (orig_avg_risk * 0.4))

        # 2. Clone assets and connections to apply mitigations
        mitigated_assets = copy.deepcopy(list(self.base_engine.nodes_data.values()))
        mitigated_connections = copy.deepcopy(self.base_engine.edges_data)

        # Apply controls
        for ctrl in applied_controls:
            c_type = ctrl.get("control_type", "")
            target_asset = ctrl.get("target_asset_id")
            target_vuln = ctrl.get("target_vulnerability_id")
            src_asset = ctrl.get("source_asset_id")
            dst_asset = ctrl.get("destination_asset_id")
            enabled = bool(ctrl.get("enabled", True))

            if not enabled:
                continue

            if c_type == "patch_vulnerability":
                for a in mitigated_assets:
                    if a.get("id") == target_asset or not target_asset:
                        if target_vuln:
                            a["vulnerabilities"] = [v for v in a.get("vulnerabilities", []) if v.get("id") != target_vuln and v.get("identifier") != target_vuln]
                        else:
                            a["vulnerabilities"] = []

            elif c_type in ["add_firewall_rule", "remove_connection", "isolate_connection"]:
                for conn in mitigated_connections:
                    if (conn.get("source") == src_asset and conn.get("target") == dst_asset) or \
                       (conn.get("source") == dst_asset and conn.get("target") == src_asset):
                        conn["blocked"] = True

            elif c_type == "isolate_asset":
                for conn in mitigated_connections:
                    if conn.get("source") == target_asset or conn.get("target") == target_asset:
                        conn["blocked"] = True

            elif c_type == "remove_internet_exposure":
                for a in mitigated_assets:
                    if a.get("id") == target_asset:
                        a["internet_exposed"] = False
                        # Block direct internet ingress
                        for conn in mitigated_connections:
                            if conn.get("target") == target_asset and "internet" in str(conn.get("source", "")).lower():
                                conn["blocked"] = True

            elif c_type == "enable_mfa":
                for conn in mitigated_connections:
                    if conn.get("target") == target_asset or (src_asset and conn.get("source") == src_asset and conn.get("target") == dst_asset):
                        conn["authentication_required"] = True
                for a in mitigated_assets:
                    if a.get("id") == target_asset:
                        if "MFA" not in a.get("security_controls", []):
                            a.setdefault("security_controls", []).append("MFA")

            elif c_type == "reduce_privilege":
                for a in mitigated_assets:
                    if a.get("id") == target_asset:
                        a["privilege_level"] = "User"

        # 3. Build mitigated temporary engine and recompute
        mitigated_engine = AttackGraphEngine()
        mitigated_engine.load_graph(mitigated_assets, mitigated_connections)
        mitigated_paths_raw = mitigated_engine.find_all_attack_paths(source_id=source_id, target_id=target_id)

        mitigated_paths_scored = []
        for p in mitigated_paths_raw:
            feat = mitigated_engine.extract_path_features(p)
            pred = predict_path_risk(feat)
            mitigated_paths_scored.append({
                "nodes": p,
                "length": len(p),
                "risk_score": pred["risk_score"],
                "risk_class": pred["risk_class"],
                "features": feat
            })

        mitigated_high_risk = sum(1 for p in mitigated_paths_scored if p["risk_class"] in ["High", "Critical"])
        mitigated_avg_risk = float(sum(p["risk_score"] for p in mitigated_paths_scored) / len(mitigated_paths_scored)) if mitigated_paths_scored else 0.0

        mitigated_posture = min(98.5, max(15.0, 100.0 - (mitigated_high_risk * 8.0) - (mitigated_avg_risk * 0.4)))
        posture_delta = mitigated_posture - orig_posture

        # Determine newly blocked paths
        orig_sigs = set("->".join(p["nodes"]) for p in orig_paths_scored)
        mit_sigs = set("->".join(p["nodes"]) for p in mitigated_paths_scored)
        blocked_sigs = orig_sigs - mit_sigs
        blocked_paths = [s.split("->") for s in blocked_sigs]

        # Generate automated recommendation narrative
        controls_count = len([c for c in applied_controls if c.get("enabled", True)])
        narrative = (
            f"Applying {controls_count} defensive control(s) successfully eliminated {len(blocked_paths)} attack path(s) "
            f"and reduced high-risk exposure paths from {orig_high_risk} down to {mitigated_high_risk}. "
            f"Simulated enterprise security posture improved by +{round(posture_delta, 1)} points "
            f"(from {round(orig_posture, 1)}/100 to {round(mitigated_posture, 1)}/100)."
        )

        return {
            "original_metrics": {
                "total_paths": len(orig_paths_scored),
                "high_risk_paths": orig_high_risk,
                "average_risk_score": round(orig_avg_risk, 1),
                "security_posture_score": round(orig_posture, 1)
            },
            "mitigated_metrics": {
                "total_paths": len(mitigated_paths_scored),
                "high_risk_paths": mitigated_high_risk,
                "average_risk_score": round(mitigated_avg_risk, 1),
                "security_posture_score": round(mitigated_posture, 1)
            },
            "delta": {
                "paths_eliminated": len(blocked_paths),
                "high_risk_reduction": orig_high_risk - mitigated_high_risk,
                "average_risk_reduction": round(orig_avg_risk - mitigated_avg_risk, 1),
                "posture_score_gain": round(posture_delta, 1)
            },
            "blocked_paths_count": len(blocked_paths),
            "remaining_paths_count": len(mitigated_paths_scored),
            "blocked_paths": blocked_paths[:15],
            "remaining_high_risk_paths": mitigated_paths_scored[:10],
            "posture_improvement_percentage": round(max(0.0, (posture_delta / max(1.0, orig_posture)) * 100.0), 1),
            "recommendation_summary": narrative
        }

"""
Dynamic Attack Simulation Engine for CyberPath AI
Simulates multi-stage adversarial progression across the IT infrastructure graph
mapping steps to MITRE ATT&CK techniques, privilege elevation, and real-time posture impact.
"""
import uuid
from typing import Dict, Any, List, Optional
from backend.graph_engine import AttackGraphEngine
from backend.ml.next_step_predictor import predict_next_attack_step

MITRE_TECHNIQUES = {
    "web_rce": {"id": "T1190", "tactic": "Initial Access", "name": "Exploit Public-Facing Application"},
    "priv_esc": {"id": "T1068", "tactic": "Privilege Escalation", "name": "Exploitation for Privilege Escalation"},
    "lateral_move": {"id": "T1021.002", "tactic": "Lateral Movement", "name": "SMB/Windows Admin Shares"},
    "rdp_move": {"id": "T1021.001", "tactic": "Lateral Movement", "name": "Remote Desktop Protocol"},
    "cred_dump": {"id": "T1003", "tactic": "Credential Access", "name": "OS Credential Dumping (LSASS/NTDS)"},
    "api_abuse": {"id": "T1106", "tactic": "Execution", "name": "Native API / Internal Service Abuse"},
    "data_exfil": {"id": "T1048", "tactic": "Exfiltration", "name": "Exfiltration Over Alternative Protocol"},
    "domain_dominance": {"id": "T1078.002", "tactic": "Persistence", "name": "Domain Accounts Compromise"}
}

class AttackSimulator:
    def __init__(self, graph_engine: AttackGraphEngine):
        self.engine = graph_engine

    def run_simulation(
        self,
        start_node_id: Optional[str] = None,
        target_node_id: Optional[str] = None,
        strategy: str = "HighestRisk",
        max_steps: int = 8
    ) -> Dict[str, Any]:
        """
        Executes a dynamic step-by-step traversal simulation through the simulated network graph.
        Returns full timeline, step-by-step telemetry, exploited CVEs, and posture impacts.
        """
        graph = self.engine.graph
        if len(graph.nodes) == 0:
            return {
                "simulation_id": str(uuid.uuid4()),
                "start_node": start_node_id or "None",
                "target_node": target_node_id,
                "total_steps": 0,
                "target_reached": False,
                "path_taken": [],
                "steps": [],
                "final_posture_impact": 0.0,
                "summary": "Cannot simulate: Graph has no nodes."
            }

        # 1. Determine starting node
        if not start_node_id or start_node_id not in graph:
            # Pick Internet or first exposed web server
            for n, d in graph.nodes(data=True):
                if d.get("type", "").lower() == "internet" or d.get("internet_exposed", False):
                    start_node_id = n
                    break
            if not start_node_id:
                start_node_id = list(graph.nodes)[0]

        # 2. Determine target node if not provided
        if not target_node_id or target_node_id not in graph:
            for n, d in graph.nodes(data=True):
                if str(d.get("criticality", "")).lower() == "critical" and n != start_node_id:
                    target_node_id = n
                    break

        curr_id = start_node_id
        path_taken = [curr_id]
        visited = {curr_id}
        steps: List[Dict[str, Any]] = []
        target_reached = False
        cumulative_impact = 0.0

        for step_idx in range(1, max_steps + 1):
            curr_data = graph.nodes.get(curr_id, {})
            curr_type = str(curr_data.get("type", "")).lower()
            curr_vulns = curr_data.get("vulnerabilities", [])
            
            # Identify accessible neighbors
            neighbors = self.engine.get_neighbors_for_node(curr_id)
            unvisited_neighbors = [n for n in neighbors if n["node_id"] not in visited and n.get("traversable", True)]

            # Check if current node is target
            if target_node_id and curr_id == target_node_id:
                target_reached = True
                steps.append({
                    "step_number": step_idx,
                    "current_node": {"id": curr_id, "name": curr_data.get("name", curr_id), "type": curr_data.get("type")},
                    "action": "Mission Objective Achieved: High-Value Target Compromise",
                    "technique": MITRE_TECHNIQUES["data_exfil"]["name"],
                    "mitre_id": MITRE_TECHNIQUES["data_exfil"]["id"],
                    "status": "Success",
                    "privilege_obtained": curr_data.get("privilege_level", "Admin"),
                    "vulnerability_exploited": None,
                    "next_possible_nodes": [],
                    "step_risk": 95.0,
                    "log_message": f"[SIMULATION ALERT] Attacker reached ultimate objective: {curr_data.get('name')}. Sensitive data accessible."
                })
                cumulative_impact += 35.0
                break

            if not unvisited_neighbors:
                # Dead end or blocked
                steps.append({
                    "step_number": step_idx,
                    "current_node": {"id": curr_id, "name": curr_data.get("name", curr_id), "type": curr_data.get("type")},
                    "action": "Adversary Movement Contained / No Viable Pivots",
                    "technique": "Network Segmentation Defense",
                    "mitre_id": "M1030",
                    "status": "Blocked",
                    "privilege_obtained": curr_data.get("privilege_level", "User"),
                    "vulnerability_exploited": None,
                    "next_possible_nodes": [],
                    "step_risk": 20.0,
                    "log_message": f"Lateral movement halted at {curr_data.get('name')}. No unsegmented downstream conduits available."
                })
                break

            # Predict next step utilities and pick best next move
            prediction_res = predict_next_attack_step(curr_id, unvisited_neighbors, list(visited))
            best_pred = prediction_res["predictions"][0] if prediction_res["predictions"] else None

            if not best_pred:
                break

            next_id = best_pred["node_id"]
            next_data = graph.nodes.get(next_id, {})
            next_type = str(next_data.get("type", "")).lower()

            # Determine action, MITRE technique, and exploited vulnerability
            exploited_cve = None
            if curr_vulns:
                top_v = max(curr_vulns, key=lambda v: float(v.get("cvss", 0)))
                exploited_cve = f"{top_v.get('identifier')} - {top_v.get('title')}"

            if step_idx == 1 and ("internet" in curr_type or curr_data.get("internet_exposed", False)):
                tech = MITRE_TECHNIQUES["web_rce"]
                action_desc = f"Initial Ingress: Exploit exposed perimeter service on {curr_data.get('name')}"
                step_risk = 68.0
            elif "database" in next_type or "sensitive" in next_type:
                tech = MITRE_TECHNIQUES["data_exfil"]
                action_desc = f"Data Access: Pivot into {next_data.get('name')} to access confidential stores"
                step_risk = 88.0
            elif "domain controller" in next_type or "admin" in next_type:
                tech = MITRE_TECHNIQUES["domain_dominance"]
                action_desc = f"Domain Privilege Escalation: Compromise administrative control on {next_data.get('name')}"
                step_risk = 92.0
            elif "rdp" in str(best_pred.get("rationale", "")).lower():
                tech = MITRE_TECHNIQUES["rdp_move"]
                action_desc = f"Lateral Movement: Remote session pivot into {next_data.get('name')}"
                step_risk = 55.0
            else:
                tech = MITRE_TECHNIQUES["lateral_move"]
                action_desc = f"Internal Network Pivot: Traverse network conduit to {next_data.get('name')}"
                step_risk = 50.0

            cumulative_impact += (step_risk * 0.15)

            steps.append({
                "step_number": step_idx,
                "current_node": {"id": curr_id, "name": curr_data.get("name", curr_id), "type": curr_data.get("type")},
                "action": action_desc,
                "technique": tech["name"],
                "mitre_id": tech["id"],
                "status": "Success",
                "privilege_obtained": next_data.get("privilege_level", "Elevated"),
                "vulnerability_exploited": exploited_cve,
                "next_possible_nodes": [
                    {"id": p["node_id"], "name": p["node_name"], "probability": p["probability"]}
                    for p in prediction_res["predictions"]
                ],
                "step_risk": step_risk,
                "log_message": f"[STEP {step_idx}] Adversary pivoted from {curr_data.get('name')} to {next_data.get('name')} via {tech['id']} ({tech['name']})."
            })

            curr_id = next_id
            path_taken.append(curr_id)
            visited.add(curr_id)

            if target_node_id and curr_id == target_node_id:
                target_reached = True
                steps.append({
                    "step_number": step_idx + 1,
                    "current_node": {"id": curr_id, "name": next_data.get("name", curr_id), "type": next_data.get("type")},
                    "action": "Mission Objective Reached",
                    "technique": MITRE_TECHNIQUES["data_exfil"]["name"],
                    "mitre_id": MITRE_TECHNIQUES["data_exfil"]["id"],
                    "status": "Success",
                    "privilege_obtained": next_data.get("privilege_level", "SYSTEM/Root"),
                    "vulnerability_exploited": None,
                    "next_possible_nodes": [],
                    "step_risk": 96.0,
                    "log_message": f"[SIMULATION TARGET COMPROMISED] Adversary successfully achieved target: {next_data.get('name')}."
                })
                cumulative_impact += 30.0
                break

        sim_id = f"sim-{uuid.uuid4().hex[:8]}"
        summary_text = (
            f"Simulation executed over {len(path_taken)} hops. "
            f"Adversary started at '{graph.nodes.get(path_taken[0], {}).get('name', path_taken[0])}' "
            f"and {'successfully reached target ' + str(graph.nodes.get(target_node_id, {}).get('name', target_node_id)) if target_reached else 'was contained before reaching critical target'}."
        )

        return {
            "simulation_id": sim_id,
            "start_node": start_node_id,
            "target_node": target_node_id,
            "total_steps": len(steps),
            "target_reached": target_reached,
            "path_taken": path_taken,
            "steps": steps,
            "final_posture_impact": round(min(100.0, cumulative_impact), 1),
            "summary": summary_text
        }

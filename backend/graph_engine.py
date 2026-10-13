"""
Core Attack Graph Engine for CyberPath AI
Models infrastructure as a directed graph using NetworkX, computes reachability,
discovers all candidate attack paths, and extracts comprehensive path features for ML.
"""
from typing import List, Dict, Any, Optional, Set, Tuple
import networkx as nx
import numpy as np

class AttackGraphEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.nodes_data: Dict[str, Dict[str, Any]] = {}
        self.edges_data: List[Dict[str, Any]] = []

    def load_graph(self, assets: List[Dict[str, Any]], connections: List[Dict[str, Any]]) -> None:
        """Constructs or updates the internal NetworkX graph from assets and connections."""
        self.graph.clear()
        self.nodes_data.clear()
        self.edges_data = connections

        # 1. Add nodes
        for asset in assets:
            node_id = str(asset.get("id") or asset.get("name"))
            self.nodes_data[node_id] = asset
            
            # Calculate intrinsic node criticality weight (1 to 10)
            crit_str = str(asset.get("criticality", "Medium")).lower()
            crit_weight = 10.0 if crit_str == "critical" else 7.0 if crit_str == "high" else 4.0 if crit_str == "medium" else 2.0
            
            # Aggregate CVSS and vulnerability stats
            vulns = asset.get("vulnerabilities", [])
            cvss_scores = [float(v.get("cvss", 0.0)) for v in vulns if "cvss" in v]
            avg_cvss = float(np.mean(cvss_scores)) if cvss_scores else 0.0
            max_cvss = float(np.max(cvss_scores)) if cvss_scores else 0.0
            high_sev_count = sum(1 for v in vulns if str(v.get("severity", "")).lower() in ["high", "critical"] or float(v.get("cvss", 0)) >= 7.0)
            
            self.graph.add_node(
                node_id,
                name=asset.get("name", node_id),
                type=asset.get("type", "Server"),
                os=asset.get("os", "Linux"),
                criticality=asset.get("criticality", "Medium"),
                criticality_weight=crit_weight,
                internet_exposed=bool(asset.get("internet_exposed", False)),
                privilege_level=asset.get("privilege_level", "User"),
                zone=asset.get("zone", "Internal"),
                services=asset.get("services", []),
                vulnerabilities=vulns,
                vulnerability_count=len(vulns),
                avg_cvss=avg_cvss,
                max_cvss=max_cvss,
                high_sev_count=high_sev_count,
                security_controls=asset.get("security_controls", [])
            )

        # 2. Add edges
        for conn in connections:
            u = str(conn.get("source"))
            v = str(conn.get("target"))
            
            # Only add edge if both endpoints exist
            if u in self.graph and v in self.graph:
                conn_type = conn.get("connection_type", "Network")
                auth_req = bool(conn.get("authentication_required", False))
                priv_req = conn.get("privilege_required", "None")
                is_blocked = bool(conn.get("blocked", False)) # e.g. blocked by simulated firewall
                
                # Weight represents attacker resistance/cost: lower cost = higher ease of traversal
                base_cost = 1.0
                if auth_req:
                    base_cost += 1.5
                if priv_req in ["Admin", "SYSTEM/Root"]:
                    base_cost += 2.0
                if is_blocked:
                    base_cost += 999.0  # Impassable
                
                self.graph.add_edge(
                    u, v,
                    connection_type=conn_type,
                    port=conn.get("port"),
                    protocol=conn.get("protocol", "TCP"),
                    authentication_required=auth_req,
                    privilege_required=priv_req,
                    blocked=is_blocked,
                    weight=base_cost,
                    encrypted=bool(conn.get("encrypted", True))
                )
                
                if conn.get("bidirectional", False):
                    self.graph.add_edge(
                        v, u,
                        connection_type=conn_type,
                        port=conn.get("port"),
                        protocol=conn.get("protocol", "TCP"),
                        authentication_required=auth_req,
                        privilege_required=priv_req,
                        blocked=is_blocked,
                        weight=base_cost,
                        encrypted=bool(conn.get("encrypted", True))
                    )

    def is_traversable(self, u: str, v: str) -> bool:
        """Determines if a simulated attacker can traverse from node u to node v."""
        if not self.graph.has_edge(u, v):
            return False
        
        edge_data = self.graph.get_edge_data(u, v)
        if edge_data.get("blocked", False):
            return False
        
        u_data = self.graph.nodes[u]
        v_data = self.graph.nodes[v]
        
        # If source is Internet, target MUST be internet_exposed or an edge gateway/firewall/router
        if u_data.get("type", "").lower() == "internet" or u.lower() == "internet":
            if not v_data.get("internet_exposed", False) and v_data.get("type", "").lower() not in ["firewall", "router", "gateway", "load balancer"]:
                return False
        
        return True

    def find_all_attack_paths(
        self,
        source_id: Optional[str] = None,
        target_id: Optional[str] = None,
        max_depth: int = 6,
        max_paths: int = 50
    ) -> List[List[str]]:
        """
        Discovers candidate attack paths across the graph using bounded depth-first search.
        If source is not provided, uses 'Internet' or all internet-exposed/external assets.
        If target is not provided, targets high/critical criticality assets, databases, and domain controllers.
        """
        if len(self.graph.nodes) == 0:
            return []

        # Determine candidate source nodes
        sources: List[str] = []
        if source_id and source_id in self.graph:
            sources = [source_id]
        else:
            # Find Internet node or internet-exposed entry points
            for n, d in self.graph.nodes(data=True):
                if d.get("type", "").lower() == "internet" or n.lower() == "internet" or d.get("internet_exposed", False):
                    sources.append(n)
            # If still none, use all workstations or edge nodes
            if not sources:
                sources = [n for n, d in self.graph.nodes(data=True) if d.get("type", "").lower() in ["workstation", "user", "router"]]
            if not sources:
                sources = list(self.graph.nodes)[:3]

        # Determine candidate target nodes
        targets: List[str] = []
        if target_id and target_id in self.graph:
            targets = [target_id]
        else:
            for n, d in self.graph.nodes(data=True):
                is_crit = str(d.get("criticality", "")).lower() in ["critical", "high"]
                is_high_val_type = str(d.get("type", "")).lower() in ["database", "domain controller", "sensitive data", "cloud resource", "admin pc"]
                if (is_crit or is_high_val_type) and n not in sources:
                    targets.append(n)
            if not targets:
                # Fallback to any node with highest degree or non-source
                targets = [n for n in self.graph.nodes if n not in sources]

        all_paths: List[List[str]] = []
        visited_path_signatures: Set[str] = set()

        for s in sources:
            for t in targets:
                if s == t:
                    continue
                try:
                    # Find simple paths up to cutoff
                    paths_gen = nx.all_simple_paths(self.graph, source=s, target=t, cutoff=max_depth)
                    for path in paths_gen:
                        # Verify edge traversability along the path
                        valid = True
                        for i in range(len(path) - 1):
                            if not self.is_traversable(path[i], path[i+1]):
                                valid = False
                                break
                        if valid:
                            sig = "->".join(path)
                            if sig not in visited_path_signatures:
                                visited_path_signatures.add(sig)
                                all_paths.append(path)
                                if len(all_paths) >= max_paths:
                                    break
                except (nx.NetworkXNoPath, nx.NodeNotFound):
                    continue
            if len(all_paths) >= max_paths:
                break

        # Sort paths by a heuristic score (e.g. target criticality / length)
        all_paths.sort(key=lambda p: len(p))
        return all_paths

    def extract_path_features(self, path: List[str]) -> Dict[str, Any]:
        """
        Extracts structural, vulnerability, privilege, and exposure metrics from an attack path.
        These features feed directly into the Machine Learning risk models.
        """
        if not path or len(path) < 1:
            return {}

        path_length = len(path)
        number_of_hops = max(0, path_length - 1)
        
        all_cvss: List[float] = []
        total_vulns = 0
        high_sev_vulns = 0
        privilege_escalation_count = 0
        auth_required_count = 0
        security_controls_bypassed = 0
        critical_asset_reached = 0
        sensitive_data_reached = 0
        asset_crit_scores: List[float] = []
        
        first_node = self.graph.nodes.get(path[0], {})
        internet_exposed = 1 if (first_node.get("internet_exposed", False) or str(first_node.get("type", "")).lower() == "internet") else 0
        
        # Track privilege progression
        priv_order = {"none": 0, "user": 1, "low": 1, "medium": 2, "elevated": 2, "admin": 3, "high": 3, "system/root": 4, "root": 4, "system": 4}
        prev_priv = priv_order.get(str(first_node.get("privilege_level", "user")).lower(), 1)
        
        for idx, node_id in enumerate(path):
            n_data = self.graph.nodes.get(node_id, {})
            node_type = str(n_data.get("type", "")).lower()
            crit_str = str(n_data.get("criticality", "")).lower()
            crit_val = 10.0 if crit_str == "critical" else 7.5 if crit_str == "high" else 4.0 if crit_str == "medium" else 1.5
            asset_crit_scores.append(crit_val)
            
            # Check if target reaches high value
            if idx == len(path) - 1:
                if crit_str in ["critical", "high"]:
                    critical_asset_reached = 1
                if "database" in node_type or "sensitive" in node_type or "domain controller" in node_type:
                    sensitive_data_reached = 1

            # Vulnerabilities on this asset
            vulns = n_data.get("vulnerabilities", [])
            total_vulns += len(vulns)
            for v in vulns:
                cvss = float(v.get("cvss", 0.0))
                all_cvss.append(cvss)
                if cvss >= 7.0 or str(v.get("severity", "")).lower() in ["high", "critical"]:
                    high_sev_vulns += 1
            
            # Security controls on asset
            controls = n_data.get("security_controls", [])
            security_controls_bypassed += len(controls)

            # Check edge attributes if not first node
            if idx > 0:
                prev_id = path[idx - 1]
                edge_data = self.graph.get_edge_data(prev_id, node_id, default={})
                if edge_data.get("authentication_required", False):
                    auth_required_count += 1
                
                curr_priv = priv_order.get(str(n_data.get("privilege_level", "user")).lower(), 1)
                if curr_priv > prev_priv:
                    privilege_escalation_count += (curr_priv - prev_priv)
                prev_priv = curr_priv

        avg_cvss = float(np.mean(all_cvss)) if all_cvss else 0.0
        max_cvss = float(np.max(all_cvss)) if all_cvss else 0.0
        target_crit = asset_crit_scores[-1] if asset_crit_scores else 5.0
        avg_crit = float(np.mean(asset_crit_scores)) if asset_crit_scores else 5.0

        # Network exposure composite score (0 to 10)
        net_exposure = 9.5 if internet_exposed else 3.0
        if "dmz" in str(first_node.get("zone", "")).lower():
            net_exposure += 1.0

        features = {
            "path_length": path_length,
            "number_of_hops": number_of_hops,
            "internet_exposed": internet_exposed,
            "avg_cvss": round(avg_cvss, 2),
            "max_cvss": round(max_cvss, 2),
            "vulnerability_count": total_vulns,
            "high_severity_vulnerabilities": high_sev_vulns,
            "privilege_escalation": privilege_escalation_count,
            "authentication_required": auth_required_count,
            "critical_asset_reached": critical_asset_reached,
            "sensitive_data_reached": sensitive_data_reached,
            "asset_criticality_score": round(target_crit, 2),
            "avg_criticality_score": round(avg_crit, 2),
            "security_controls_bypassed": security_controls_bypassed,
            "network_exposure_score": round(min(10.0, net_exposure), 2)
        }
        return features

    def calculate_graph_metrics(self) -> Dict[str, Any]:
        """Calculates topological graph metrics: centrality, density, critical nodes."""
        if len(self.graph.nodes) == 0:
            return {
                "total_nodes": 0, "total_edges": 0, "density": 0.0,
                "most_central_assets": [], "critical_chokepoints": []
            }
        
        try:
            degree_cent = nx.degree_centrality(self.graph)
            betweenness = nx.betweenness_centrality(self.graph)
            density = float(nx.density(self.graph))
        except Exception:
            degree_cent = {n: 0.1 for n in self.graph.nodes}
            betweenness = {n: 0.1 for n in self.graph.nodes}
            density = 0.1

        sorted_between = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)
        top_chokepoints = [{"node_id": k, "name": self.graph.nodes[k].get("name", k), "score": round(v, 4)} for k, v in sorted_between[:5]]

        return {
            "total_nodes": self.graph.number_of_nodes(),
            "total_edges": self.graph.number_of_edges(),
            "density": round(density, 4),
            "critical_chokepoints": top_chokepoints
        }

    def get_neighbors_for_node(self, node_id: str) -> List[Dict[str, Any]]:
        """Returns outgoing accessible neighbors with edge and vulnerability details."""
        if node_id not in self.graph:
            return []
        
        neighbors = []
        for target_id in self.graph.successors(node_id):
            edge_data = self.graph.get_edge_data(node_id, target_id, default={})
            target_data = self.graph.nodes.get(target_id, {})
            
            traversable = self.is_traversable(node_id, target_id)
            neighbors.append({
                "node_id": target_id,
                "name": target_data.get("name", target_id),
                "type": target_data.get("type", "Server"),
                "criticality": target_data.get("criticality", "Medium"),
                "privilege_level": target_data.get("privilege_level", "User"),
                "vulnerabilities": target_data.get("vulnerabilities", []),
                "edge": edge_data,
                "traversable": traversable
            })
        return neighbors

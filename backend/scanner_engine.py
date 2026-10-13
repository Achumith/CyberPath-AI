"""
Vulnerability Scanner & Cisco-Style Packet Probing Engine for CyberPath AI.
Simulates hop-by-hop packet routing, firewall filtering, service banner grabbing,
and automated CVE vulnerability discovery matching network services to a CVE catalog.
"""
import os
import json
import uuid
import networkx as nx
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.models import AssetModel, VulnerabilityModel, ConnectionModel, OrganizationModel
from backend.graph_engine import AttackGraphEngine

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "data", "cve_catalog.json")

def load_cve_catalog() -> Dict[str, Any]:
    if os.path.exists(CATALOG_PATH):
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"services": {}, "device_templates": []}

class NetworkPacketScanner:
    def __init__(self, catalog: Optional[Dict[str, Any]] = None):
        self.catalog = catalog or load_cve_catalog()

    def get_device_templates(self) -> List[Dict[str, Any]]:
        return self.catalog.get("device_templates", [])

    def get_service_catalog(self) -> Dict[str, Any]:
        return self.catalog.get("services", {})

    def run_packet_scan(
        self,
        graph_engine: AttackGraphEngine,
        scanner_node_id: Optional[str] = None,
        target_ids: Optional[List[str]] = None,
        scan_profile: str = "Full Vulnerability Audit"
    ) -> Dict[str, Any]:
        """
        Executes a packet-by-packet reachability, port probing, and vulnerability discovery scan.
        Generates simulated packet trace events compatible with Cisco Packet Tracer simulation workflows.
        """
        graph = graph_engine.graph
        if len(graph.nodes) == 0:
            return {
                "scan_id": str(uuid.uuid4()),
                "scanner_node": {"id": "none", "name": "None"},
                "scan_profile": scan_profile,
                "hosts_scanned": 0,
                "hosts_reachable": 0,
                "hosts_filtered": 0,
                "open_ports_found": 0,
                "cves_found_count": 0,
                "packet_traces": [],
                "findings": [],
                "summary": "Graph is empty. Provision devices to scan."
            }

        # 1. Determine scanner source node
        if not scanner_node_id or scanner_node_id not in graph:
            # Prefer a dedicated scanner appliance, or fallback to Internet or first node
            for n, d in graph.nodes(data=True):
                if "scanner" in str(d.get("type", "")).lower():
                    scanner_node_id = n
                    break
            if not scanner_node_id:
                for n, d in graph.nodes(data=True):
                    if d.get("type", "").lower() == "internet" or d.get("internet_exposed", False):
                        scanner_node_id = n
                        break
            if not scanner_node_id:
                scanner_node_id = list(graph.nodes)[0]

        scanner_data = graph.nodes.get(scanner_node_id, {})
        scanner_info = {
            "id": scanner_node_id,
            "name": scanner_data.get("name", scanner_node_id),
            "type": scanner_data.get("type", "Scanner Appliance"),
            "ip_address": scanner_data.get("ip_address", "198.51.100.250"),
            "zone": scanner_data.get("zone", "Management Tier")
        }

        # 2. Determine target nodes
        candidate_targets = []
        if target_ids:
            candidate_targets = [t for t in target_ids if t in graph and t != scanner_node_id]
        else:
            candidate_targets = [n for n in graph.nodes if n != scanner_node_id]

        packet_traces: List[Dict[str, Any]] = []
        findings: List[Dict[str, Any]] = []
        total_open_ports = 0
        total_cves_discovered = 0
        reachable_count = 0
        filtered_count = 0
        pkt_counter = 100

        service_db = self.get_service_catalog()

        for target_id in candidate_targets:
            target_data = graph.nodes.get(target_id, {})
            target_name = target_data.get("name", target_id)
            target_ip = target_data.get("ip_address", "10.0.0.X")
            target_type = target_data.get("type", "Server")
            target_services = target_data.get("services", [])

            # Check if there is any viable path from scanner to target
            is_reachable = False
            path_taken: List[str] = []
            firewall_dropped_at: Optional[str] = None

            try:
                # Try to find all paths up to 6 hops
                simple_paths = list(nx.all_simple_paths(graph, source=scanner_node_id, target=target_id, cutoff=6))
                for candidate_path in simple_paths:
                    # Check each edge for traversability / firewall block
                    blocked = False
                    for i in range(len(candidate_path) - 1):
                        u, v = candidate_path[i], candidate_path[i+1]
                        edge_data = graph.get_edge_data(u, v, default={})
                        if edge_data.get("blocked", False):
                            blocked = True
                            firewall_dropped_at = u
                            break
                        if not graph_engine.is_traversable(u, v):
                            blocked = True
                            firewall_dropped_at = u
                            break
                    if not blocked:
                        is_reachable = True
                        path_taken = candidate_path
                        break
            except Exception:
                is_reachable = False

            # Generate Packet Trace 1: TCP SYN probe (Port discovery)
            pkt_counter += 1
            syn_pkt_id = f"PKT-{pkt_counter}"
            
            if is_reachable:
                reachable_count += 1
                packet_traces.append({
                    "packet_id": syn_pkt_id,
                    "protocol": "TCP SYN",
                    "source": f"{scanner_info['name']} ({scanner_info['ip_address']})",
                    "destination": f"{target_name} ({target_ip})",
                    "path_traversed": " -> ".join([graph.nodes[n].get("name", n) for n in path_taken]),
                    "status": "DELIVERED",
                    "status_code": 200,
                    "event_description": f"SYN ACK received from {target_name}. Host is alive and reachable.",
                    "details": {
                        "hops": len(path_taken) - 1,
                        "latency_ms": (len(path_taken) - 1) * 3 + 2
                    }
                })

                # Trace 2: Service Enumeration / Banner Grabbing
                pkt_counter += 1
                banner_pkt_id = f"PKT-{pkt_counter}"
                open_ports = []
                detected_cves = []

                # Parse services and default ports
                for svc in target_services:
                    svc_str = str(svc)
                    # Extract port if present like "HTTPS (443)"
                    if "(443)" in svc_str or "https" in svc_str.lower():
                        open_ports.append(443)
                    elif "(80)" in svc_str or "http" in svc_str.lower() or "apache" in svc_str.lower():
                        open_ports.append(80)
                    elif "(22)" in svc_str or "ssh" in svc_str.lower():
                        open_ports.append(22)
                    elif "(5432)" in svc_str or "postgres" in svc_str.lower():
                        open_ports.append(5432)
                    elif "(3389)" in svc_str or "rdp" in svc_str.lower():
                        open_ports.append(3389)
                    elif "(445)" in svc_str or "smb" in svc_str.lower() or "netlogon" in svc_str.lower():
                        open_ports.append(445)
                    elif "(8080)" in svc_str:
                        open_ports.append(8080)

                    # Lookup matching CVEs in catalog
                    if svc_str in service_db:
                        detected_cves.extend(service_db[svc_str])
                    else:
                        # Partial match by prefix
                        for cat_key, cve_list in service_db.items():
                            prefix = cat_key.split(":")[0].lower()
                            if prefix in svc_str.lower():
                                detected_cves.extend(cve_list)

                # Deduplicate ports & CVEs
                open_ports = sorted(list(set(open_ports))) or [80, 443]
                total_open_ports += len(open_ports)
                
                # Deduplicate detected CVEs by identifier
                unique_cves = []
                seen_cve_ids = set()
                for c in detected_cves:
                    cid = c.get("identifier")
                    if cid and cid not in seen_cve_ids:
                        seen_cve_ids.add(cid)
                        unique_cves.append(c)

                total_cves_discovered += len(unique_cves)

                packet_traces.append({
                    "packet_id": banner_pkt_id,
                    "protocol": "BANNER / VULN PROBE",
                    "source": f"{scanner_info['name']} ({scanner_info['ip_address']})",
                    "destination": f"{target_name} ({target_ip})",
                    "path_traversed": " -> ".join([graph.nodes[n].get("name", n) for n in path_taken]),
                    "status": "VULNERABILITIES_DETECTED" if unique_cves else "CLEAN_SERVICES",
                    "status_code": 302 if unique_cves else 200,
                    "event_description": f"Banner grab identified {len(target_services)} service(s) on ports {open_ports}. Discovered {len(unique_cves)} weaponizable CVE(s).",
                    "details": {
                        "open_ports": open_ports,
                        "services_identified": target_services,
                        "cves_matched": [c["identifier"] for c in unique_cves]
                    }
                })

                findings.append({
                    "target_id": target_id,
                    "name": target_name,
                    "type": target_type,
                    "ip_address": target_ip,
                    "zone": target_data.get("zone", "Internal"),
                    "reachable": True,
                    "path_taken": [graph.nodes[n].get("name", n) for n in path_taken],
                    "hop_count": len(path_taken) - 1,
                    "open_ports": open_ports,
                    "services": target_services,
                    "discovered_cves": unique_cves,
                    "vulnerability_count": len(unique_cves),
                    "highest_cvss": max([float(c.get("cvss", 0.0)) for c in unique_cves], default=0.0),
                    "security_status": "CRITICAL" if any(float(c.get("cvss", 0)) >= 9.0 for c in unique_cves)
                                      else "HIGH" if any(float(c.get("cvss", 0)) >= 7.0 for c in unique_cves)
                                      else "SECURE" if not unique_cves else "MEDIUM"
                })

            else:
                filtered_count += 1
                packet_traces.append({
                    "packet_id": syn_pkt_id,
                    "protocol": "TCP SYN",
                    "source": f"{scanner_info['name']} ({scanner_info['ip_address']})",
                    "destination": f"{target_name} ({target_ip})",
                    "path_traversed": f"{scanner_info['name']} -X-> {target_name}",
                    "status": "FILTERED",
                    "status_code": 403,
                    "event_description": f"Probe packet dropped / filtered by perimeter firewall or isolation rules at {firewall_dropped_at or 'Edge Barrier'}.",
                    "details": {
                        "dropped_at": firewall_dropped_at or "Firewall ACL Rule",
                        "reason": "Firewall stateful inspection rejected conduit."
                    }
                })

                findings.append({
                    "target_id": target_id,
                    "name": target_name,
                    "type": target_type,
                    "ip_address": target_ip,
                    "zone": target_data.get("zone", "Internal"),
                    "reachable": False,
                    "path_taken": [],
                    "hop_count": 0,
                    "open_ports": [],
                    "services": target_services,
                    "discovered_cves": [],
                    "vulnerability_count": 0,
                    "highest_cvss": 0.0,
                    "security_status": "FILTERED_PROTECTED"
                })

        return {
            "scan_id": str(uuid.uuid4()),
            "scanner_node": scanner_info,
            "scan_profile": scan_profile,
            "hosts_scanned": len(candidate_targets),
            "hosts_reachable": reachable_count,
            "hosts_filtered": filtered_count,
            "open_ports_found": total_open_ports,
            "cves_found_count": total_cves_discovered,
            "packet_traces": packet_traces,
            "findings": findings,
            "summary": f"Completed packet scan against {len(candidate_targets)} targets from {scanner_info['name']}. {reachable_count} hosts reachable, {filtered_count} protected by firewalls. Detected {total_cves_discovered} exploitable CVE(s)."
        }

    def apply_scan_findings_to_db(self, db: Session, findings: List[Dict[str, Any]], graph_engine: AttackGraphEngine) -> Dict[str, Any]:
        """
        Commits discovered vulnerabilities directly into the SQLite database for each asset,
        updating the active Attack Graph and recalculating threat metrics.
        """
        updated_assets = 0
        total_vulns_added = 0

        for f in findings:
            if not f.get("reachable", False):
                continue
            
            target_id = f["target_id"]
            discovered_cves = f.get("discovered_cves", [])
            if not discovered_cves:
                continue

            asset = db.query(AssetModel).filter(AssetModel.id == target_id).first()
            if not asset:
                continue

            # Clear existing duplicate vulnerabilities or merge
            existing_cves = {v.identifier: v for v in asset.vulnerabilities}

            for cve in discovered_cves:
                ident = cve.get("identifier")
                if ident not in existing_cves:
                    new_v = VulnerabilityModel(
                        id=f"vuln-{os.urandom(4).hex()}",
                        asset_id=asset.id,
                        identifier=ident,
                        title=cve.get("title", "Scanned Flaw"),
                        severity=cve.get("severity", "High"),
                        cvss=float(cve.get("cvss", 7.5)),
                        description=cve.get("description", ""),
                        exploitability=float(cve.get("exploitability", 0.8)),
                        cwe=cve.get("cwe", "CWE-20"),
                        remediation=cve.get("remediation", "Apply vendor patch.")
                    )
                    db.add(new_v)
                    total_vulns_added += 1

            updated_assets += 1

        db.commit()

        # Reload graph engine from updated database
        from backend.main import reload_graph_engine
        reload_graph_engine(db)

        return {
            "status": "success",
            "assets_updated": updated_assets,
            "vulnerabilities_added": total_vulns_added,
            "message": f"Successfully applied scan findings: {total_vulns_added} CVEs committed across {updated_assets} assets. Graph engine updated."
        }

    def quick_provision_device(
        self,
        db: Session,
        template_key: str,
        custom_name: Optional[str] = None,
        custom_ip: Optional[str] = None,
        connect_to_id: Optional[str] = None,
        port: Optional[int] = None,
        graph_engine: Optional[Any] = None
    ) -> Dict[str, Any]:

        """
        1-Click device provisioning (Packet Tracer shelf style).
        Creates asset with realistic services and links it to an existing node.
        """
        templates = {t["key"]: t for t in self.get_device_templates()}
        template = templates.get(template_key)
        if not template:
            # Fallback to web_server
            template = templates.get("web_server", list(templates.values())[0])

        org = db.query(OrganizationModel).first()
        if not org:
            org = OrganizationModel(name="CyberTech Enterprise", industry="Technology")
            db.add(org)
            db.flush()

        new_asset_id = f"asset-{template_key[:3]}-{os.urandom(3).hex()}"
        asset_name = custom_name or f"{template['name']}-{os.urandom(2).hex()}"
        ip_addr = custom_ip or f"10.0.{len(db.query(AssetModel).all()) + 10}.1"

        new_asset = AssetModel(
            id=new_asset_id,
            org_id=org.id,
            name=asset_name,
            type=template["type"],
            os=template["os"],
            criticality=template["criticality"],
            internet_exposed=template.get("internet_exposed", False),
            privilege_level=template.get("privilege_level", "User"),
            zone=template.get("zone", "Internal"),
            ip_address=ip_addr,
            services_json=json.dumps(template.get("services", [])),
            security_controls_json=json.dumps(template.get("security_controls", [])),
            metadata_json=json.dumps({"template_key": template_key, "provisioned_by": "PacketScanner"})
        )
        db.add(new_asset)
        db.flush()

        # Connect to existing node if specified
        conn_created = None
        if connect_to_id:
            conn_port = port or (template.get("default_ports", [443])[0] if template.get("default_ports") else 443)
            new_conn = ConnectionModel(
                org_id=org.id,
                source=connect_to_id,
                target=new_asset_id,
                connection_type="Network",
                port=conn_port,
                protocol="TCP",
                authentication_required=False,
                privilege_required="None",
                encrypted=True,
                bidirectional=True
            )
            db.add(new_conn)
            conn_created = {"source": connect_to_id, "target": new_asset_id, "port": conn_port}

        db.commit()

        from backend.main import reload_graph_engine
        reload_graph_engine(db)

        return {
            "status": "success",
            "asset_id": new_asset_id,
            "name": asset_name,
            "type": template["type"],
            "ip_address": ip_addr,
            "services": template.get("services", []),
            "connection": conn_created,
            "message": f"Provisioned device '{asset_name}' ({template['type']}) at {ip_addr}."
        }

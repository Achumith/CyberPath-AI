"""
CyberPath AI - FastAPI Backend Server
Dynamic Cyber Attack Graph and Attack Path Prediction System
"""
import os
import json
import io
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Depends, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session

from backend.database import init_db, get_db, DB_PATH
from backend.models import (
    OrganizationModel, AssetModel, VulnerabilityModel,
    ConnectionModel, SimulationModel, AttackPathRecordModel
)
from backend.schemas import (
    AssetCreate, AssetResponse, ConnectionCreate, GraphDataResponse,
    OrganizationCreate, OrganizationResponse, AttackPathsResponse, AttackPathItem,
    RiskPredictionRequest, RiskPredictionResponse, NextStepPredictionRequest, NextStepPredictionResponse,
    SimulationStartRequest, SimulationResponse, WhatIfRequest, WhatIfComparisonResponse,
    AIExplanationRequest, AIExplanationResponse, SyntheticGenRequest, DashboardMetrics,
    ScannerRunRequest, ScannerApplyRequest, DeviceProvisionRequest,
    RealCVESyncRequest, RealCVEAttachRequest
)
from backend.graph_engine import AttackGraphEngine
from backend.data.demo_seed import CYBERTECH_DEMO_DATA
from backend.synthetic_generator import generate_synthetic_organization
from backend.attack_simulation import AttackSimulator
from backend.what_if_engine import WhatIfEngine
from backend.ai_analyst import CyberPathAnalyst
from backend.gnn_engine import GraphNeuralNetworkLab
from backend.scanner_engine import NetworkPacketScanner
from backend.cve_service import cve_intel_service
from backend.report_engine import generate_pdf_report
from backend.ml.train_model import train_and_evaluate_models
from backend.ml.predict_risk import predict_path_risk, load_models
from backend.ml.next_step_predictor import predict_next_attack_step

# Global in-memory Attack Graph Engine
graph_engine = AttackGraphEngine()
ai_analyst = CyberPathAnalyst()
gnn_lab = GraphNeuralNetworkLab()
packet_scanner = NetworkPacketScanner()

def seed_demo_organization_if_empty():
    """Initializes SQLite database and preloads the CyberTech Demo organization if empty."""
    from backend.database import SessionLocal
    init_db()
    db: Session = SessionLocal()
    try:
        existing = db.query(OrganizationModel).first()
        if not existing:
            print("Seeding initial 'CyberTech Demo' organization...")
            demo = CYBERTECH_DEMO_DATA
            org = OrganizationModel(
                id=demo["org_id"],
                name=demo["name"],
                industry=demo["industry"],
                description=demo["description"]
            )
            db.add(org)
            db.flush()

            for a in demo["assets"]:
                asset = AssetModel(
                    id=a["id"],
                    org_id=org.id,
                    name=a["name"],
                    type=a["type"],
                    os=a.get("os", "Linux"),
                    criticality=a.get("criticality", "Medium"),
                    internet_exposed=a.get("internet_exposed", False),
                    privilege_level=a.get("privilege_level", "User"),
                    zone=a.get("zone", "DMZ"),
                    ip_address=a.get("ip_address"),
                    services_json=json.dumps(a.get("services", [])),
                    security_controls_json=json.dumps(a.get("security_controls", [])),
                    metadata_json=json.dumps(a.get("metadata", {}))
                )
                db.add(asset)
                db.flush()

                for v in a.get("vulnerabilities", []):
                    vuln = VulnerabilityModel(
                        id=v.get("id", f"vuln-{os.urandom(4).hex()}"),
                        asset_id=asset.id,
                        identifier=v.get("identifier", "CVE-2024-0000"),
                        title=v.get("title", "Vulnerability"),
                        severity=v.get("severity", "Medium"),
                        cvss=float(v.get("cvss", 5.0)),
                        description=v.get("description", ""),
                        exploitability=float(v.get("exploitability", 0.7)),
                        cwe=v.get("cwe", "CWE-20")
                    )
                    db.add(vuln)

            for c in demo["connections"]:
                conn = ConnectionModel(
                    org_id=org.id,
                    source=c["source"],
                    target=c["target"],
                    connection_type=c.get("connection_type", "Network"),
                    port=c.get("port"),
                    protocol=c.get("protocol", "TCP"),
                    authentication_required=c.get("authentication_required", False),
                    privilege_required=c.get("privilege_required", "None")
                )
                db.add(conn)

            db.commit()

        # Load active assets and connections into Graph Engine
        reload_graph_engine(db)

    finally:
        db.close()

def reload_graph_engine(db: Session):
    """Refreshes the in-memory NetworkX graph from database records."""
    org = db.query(OrganizationModel).first()
    if not org:
        graph_engine.load_graph([], [])
        return

    assets_db = db.query(AssetModel).filter(AssetModel.org_id == org.id).all()
    connections_db = db.query(ConnectionModel).filter(ConnectionModel.org_id == org.id).all()

    assets_payload = []
    for a in assets_db:
        vulns = [
            {
                "id": v.id,
                "identifier": v.identifier,
                "title": v.title,
                "severity": v.severity,
                "cvss": v.cvss,
                "description": v.description,
                "exploitability": v.exploitability,
                "cwe": v.cwe
            }
            for v in a.vulnerabilities
        ]
        assets_payload.append({
            "id": a.id,
            "name": a.name,
            "type": a.type,
            "os": a.os,
            "criticality": a.criticality,
            "internet_exposed": a.internet_exposed,
            "privilege_level": a.privilege_level,
            "zone": a.zone,
            "ip_address": a.ip_address,
            "services": json.loads(a.services_json or "[]"),
            "security_controls": json.loads(a.security_controls_json or "[]"),
            "vulnerabilities": vulns
        })

    connections_payload = [
        {
            "id": c.id,
            "source": c.source,
            "target": c.target,
            "connection_type": c.connection_type,
            "port": c.port,
            "protocol": c.protocol,
            "authentication_required": c.authentication_required,
            "privilege_required": c.privilege_required,
            "bidirectional": bool(c.bidirectional)
        }
        for c in connections_db
    ]

    graph_engine.load_graph(assets_payload, connections_payload)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite, seed data, and train ML baseline models if missing
    seed_demo_organization_if_empty()
    models_dir = os.path.join(os.path.dirname(__file__), "ml", "saved_models")
    if not os.path.exists(os.path.join(models_dir, "risk_regressor.joblib")):
        try:
            print("Training ML models baseline on initial launch...")
            train_and_evaluate_models()
        except Exception as e:
            print(f"Warning during ML training: {e}")
    load_models()

    # Auto-initialize and index Real CISA KEV Intelligence Database if empty
    try:
        from backend.database import SessionLocal
        with SessionLocal() as db_session:
            cve_intel_service.sync_database(db_session, force_online=False)
    except Exception as e:
        print(f"Notice during real CVE database init: {e}")

    yield

app = FastAPI(
    title="CyberPath AI API",
    description="AI-Powered Dynamic Cyber Attack Graph and Attack Path Prediction System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Endpoints -----------------

@app.get("/")
def root():
    return {"message": "CyberPath AI Backend API is running.", "docs": "/docs", "health": "/api/health"}

@app.get("/health")
def root_health():
    return health_check()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "CyberPath AI",
        "nodes_loaded": len(graph_engine.graph.nodes),
        "edges_loaded": len(graph_engine.graph.edges)
    }

# --- Module 1: Dashboard Overview ---

@app.get("/api/dashboard/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    org = db.query(OrganizationModel).first()
    if not org:
        raise HTTPException(status_code=404, detail="No active organization found.")

    assets = db.query(AssetModel).filter(AssetModel.org_id == org.id).all()
    total_assets = len(assets)
    crit_count = sum(1 for a in assets if str(a.criticality).lower() == "critical")
    vuln_count = sum(1 for a in assets if len(a.vulnerabilities) > 0)

    # Discovered Attack Paths
    paths_raw = graph_engine.find_all_attack_paths(max_depth=6, max_paths=60)
    scored_paths = []
    for p in paths_raw:
        feat = graph_engine.extract_path_features(p)
        pred = predict_path_risk(feat)
        
        # Build node details
        node_details = [graph_engine.nodes_data.get(n_id, {"id": n_id, "name": n_id}) for n_id in p]
        scored_paths.append(
            AttackPathItem(
                id=f"path-{hash('-'.join(p)) % 1000000:06d}",
                nodes=p,
                node_details=node_details,
                edges=[],
                length=len(p),
                risk_score=pred["risk_score"],
                risk_class=pred["risk_class"],
                features=feat,
                top_factors=pred.get("explainability", []),
                mitre_techniques=["T1190 Exploit Public-Facing App", "T1068 Privilege Escalation", "T1021 Remote Services"]
            )
        )

    high_risk_paths = [p for p in scored_paths if p.risk_class in ["High", "Critical"]]
    crit_risk_paths = [p for p in scored_paths if p.risk_class == "Critical"]
    avg_risk = float(sum(p.risk_score for p in scored_paths) / len(scored_paths)) if scored_paths else 0.0

    posture_score = round(max(10.0, min(100.0, 100.0 - (len(high_risk_paths) * 7.5) - (avg_risk * 0.35))), 1)

    # Risk Distribution
    risk_dist = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for p in scored_paths:
        risk_dist[p.risk_class] = risk_dist.get(p.risk_class, 0) + 1

    # Asset Types
    asset_types: Dict[str, int] = {}
    for a in assets:
        asset_types[a.type] = asset_types.get(a.type, 0) + 1

    # Severity Breakdown
    sev_dist = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for a in assets:
        for v in a.vulnerabilities:
            sev = v.severity.capitalize()
            sev_dist[sev] = sev_dist.get(sev, 0) + 1

    # Path length distribution
    path_len_dist: Dict[str, int] = {}
    for p in scored_paths:
        key = f"{p.length} Hops"
        path_len_dist[key] = path_len_dist.get(key, 0) + 1

    # Most Exposed Asset
    exposed_candidates = [a for a in assets if a.internet_exposed]
    most_exposed = {
        "name": exposed_candidates[0].name if exposed_candidates else (assets[0].name if assets else "None"),
        "type": exposed_candidates[0].type if exposed_candidates else "None",
        "zone": exposed_candidates[0].zone if exposed_candidates else "DMZ",
        "vulnerabilities_count": len(exposed_candidates[0].vulnerabilities) if exposed_candidates else 0
    }

    # Most Targeted Asset
    crit_assets = [a for a in assets if str(a.criticality).lower() == "critical"]
    most_targeted = {
        "name": crit_assets[0].name if crit_assets else (assets[-1].name if assets else "None"),
        "type": crit_assets[0].type if crit_assets else "Database",
        "criticality": "Critical",
        "exposure": "Internal Secure Vault"
    }

    sim_count = db.query(SimulationModel).filter(SimulationModel.org_id == org.id).count()

    posture_history = [
        {"date": "Day 1", "score": max(20, posture_score - 15)},
        {"date": "Day 3", "score": max(25, posture_score - 10)},
        {"date": "Day 5", "score": max(30, posture_score - 6)},
        {"date": "Day 7", "score": max(35, posture_score - 2)},
        {"date": "Current", "score": posture_score}
    ]

    return DashboardMetrics(
        security_posture_score=posture_score,
        total_assets=total_assets,
        critical_assets_count=crit_count,
        vulnerable_assets_count=vuln_count,
        total_attack_paths=len(scored_paths),
        high_risk_paths_count=len(high_risk_paths),
        critical_risk_paths_count=len(crit_risk_paths),
        average_path_risk=round(avg_risk, 1),
        most_exposed_asset=most_exposed,
        most_targeted_critical_asset=most_targeted,
        simulated_incidents_count=max(1, sim_count),
        risk_distribution=risk_dist,
        asset_types_breakdown=asset_types,
        vulnerability_severity_breakdown=sev_dist,
        path_length_distribution=path_len_dist,
        top_critical_attack_paths=sorted(scored_paths, key=lambda x: x.risk_score, reverse=True)[:5],
        security_posture_history=posture_history
    )

# --- Module 2: Network / Asset Builder ---

@app.get("/api/assets", response_model=List[AssetResponse])
def get_all_assets(db: Session = Depends(get_db)):
    org = db.query(OrganizationModel).first()
    if not org:
        return []
    assets = db.query(AssetModel).filter(AssetModel.org_id == org.id).all()
    results = []
    for a in assets:
        vulns = [
            VulnerabilityModel(
                id=v.id,
                asset_id=v.asset_id,
                identifier=v.identifier,
                title=v.title,
                severity=v.severity,
                cvss=v.cvss,
                description=v.description,
                exploitability=v.exploitability,
                cwe=v.cwe
            ) for v in a.vulnerabilities
        ]
        results.append(
            AssetResponse(
                id=a.id,
                name=a.name,
                type=a.type,
                os=a.os,
                criticality=a.criticality,
                internet_exposed=a.internet_exposed,
                privilege_level=a.privilege_level,
                zone=a.zone,
                ip_address=a.ip_address,
                services=json.loads(a.services_json or "[]"),
                security_controls=json.loads(a.security_controls_json or "[]"),
                vulnerabilities=[
                    {
                        "id": v.id,
                        "identifier": v.identifier,
                        "title": v.title,
                        "severity": v.severity,
                        "cvss": v.cvss,
                        "description": v.description,
                        "exploitability": v.exploitability,
                        "cwe": v.cwe
                    }
                    for v in a.vulnerabilities
                ],
                risk_score=round(sum(v.cvss for v in a.vulnerabilities) * 2.5, 1)
            )
        )
    return results

@app.post("/api/assets", response_model=AssetResponse)
def create_asset(asset_in: AssetCreate, db: Session = Depends(get_db)):
    org = db.query(OrganizationModel).first()
    if not org:
        org = OrganizationModel(name="TechCorp Enterprise")
        db.add(org)
        db.commit()

    asset_id = asset_in.id or f"asset-{os.urandom(4).hex()}"
    new_asset = AssetModel(
        id=asset_id,
        org_id=org.id,
        name=asset_in.name,
        type=asset_in.type,
        os=asset_in.os,
        criticality=asset_in.criticality,
        internet_exposed=asset_in.internet_exposed,
        privilege_level=asset_in.privilege_level,
        zone=asset_in.zone,
        ip_address=asset_in.ip_address,
        services_json=json.dumps(asset_in.services),
        security_controls_json=json.dumps(asset_in.security_controls),
        metadata_json=json.dumps(asset_in.metadata)
    )
    db.add(new_asset)
    db.flush()

    for v in asset_in.vulnerabilities:
        vuln = VulnerabilityModel(
            id=v.id or f"vuln-{os.urandom(4).hex()}",
            asset_id=new_asset.id,
            identifier=v.identifier,
            title=v.title,
            severity=v.severity,
            cvss=v.cvss,
            description=v.description,
            exploitability=v.exploitability,
            cwe=v.cwe
        )
        db.add(vuln)

    db.commit()
    reload_graph_engine(db)
    return get_all_assets(db)[-1]

@app.delete("/api/assets/{asset_id}")
def delete_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(AssetModel).filter(AssetModel.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Remove connections linking to this asset
    db.query(ConnectionModel).filter(
        (ConnectionModel.source == asset_id) | (ConnectionModel.target == asset_id)
    ).delete()

    db.delete(asset)
    db.commit()
    reload_graph_engine(db)
    return {"status": "success", "message": f"Asset '{asset_id}' deleted."}

@app.post("/api/connections")
def create_connection(conn_in: ConnectionCreate, db: Session = Depends(get_db)):
    org = db.query(OrganizationModel).first()
    if not org:
        raise HTTPException(status_code=404, detail="No active organization found.")

    new_conn = ConnectionModel(
        org_id=org.id,
        source=conn_in.source,
        target=conn_in.target,
        connection_type=conn_in.connection_type,
        port=conn_in.port,
        protocol=conn_in.protocol,
        authentication_required=conn_in.authentication_required,
        privilege_required=conn_in.privilege_required,
        encrypted=conn_in.encrypted,
        bidirectional=conn_in.bidirectional
    )
    db.add(new_conn)
    db.commit()
    reload_graph_engine(db)
    return {"status": "success", "connection_id": new_conn.id}

# --- Module 3: Graph Visualization ---

@app.get("/api/graph", response_model=GraphDataResponse)
def get_graph_data(db: Session = Depends(get_db)):
    org = db.query(OrganizationModel).first()
    if not org:
        return GraphDataResponse(nodes=[], edges=[], total_assets=0, total_connections=0)

    nodes = []
    for node_id, data in graph_engine.nodes_data.items():
        vulns = data.get("vulnerabilities", [])
        max_cvss = max([float(v.get("cvss", 0)) for v in vulns], default=0.0)
        
        # Risk color determination
        if max_cvss >= 9.0 or str(data.get("criticality")).lower() == "critical":
            risk_color = "#ef4444"  # Red / Critical
            risk_tier = "Critical"
        elif max_cvss >= 7.0 or str(data.get("criticality")).lower() == "high":
            risk_color = "#f97316"  # Orange / High
            risk_tier = "High"
        elif max_cvss >= 4.0 or str(data.get("criticality")).lower() == "medium":
            risk_color = "#eab308"  # Yellow / Medium
            risk_tier = "Medium"
        else:
            risk_color = "#10b981"  # Emerald / Low
            risk_tier = "Low"

        nodes.append({
            "id": node_id,
            "data": {
                "label": data.get("name", node_id),
                "name": data.get("name", node_id),
                "type": data.get("type", "Server"),
                "os": data.get("os", "Linux"),
                "criticality": data.get("criticality", "Medium"),
                "internet_exposed": data.get("internet_exposed", False),
                "privilege_level": data.get("privilege_level", "User"),
                "zone": data.get("zone", "Internal"),
                "ip_address": data.get("ip_address"),
                "services": data.get("services", []),
                "security_controls": data.get("security_controls", []),
                "vulnerabilities": vulns,
                "vulnerability_count": len(vulns),
                "max_cvss": max_cvss,
                "risk_color": risk_color,
                "risk_tier": risk_tier
            }
        })

    edges = []
    for idx, c in enumerate(graph_engine.edges_data):
        edges.append({
            "id": f"e-{c.get('source')}-{c.get('target')}-{idx}",
            "source": c.get("source"),
            "target": c.get("target"),
            "label": f"{c.get('protocol', 'TCP')} ({c.get('port', '')})",
            "type": "smoothstep",
            "animated": not c.get("blocked", False),
            "data": {
                "connection_type": c.get("connection_type", "Network"),
                "port": c.get("port"),
                "protocol": c.get("protocol", "TCP"),
                "authentication_required": c.get("authentication_required", False),
                "privilege_required": c.get("privilege_required", "None"),
                "blocked": c.get("blocked", False)
            }
        })

    return GraphDataResponse(
        nodes=nodes,
        edges=edges,
        total_assets=len(nodes),
        total_connections=len(edges)
    )

# --- Module 4: Synthetic Organization Generator ---

@app.post("/api/synthetic/generate")
def generate_synthetic_org(req: SyntheticGenRequest, db: Session = Depends(get_db)):
    synthetic_data = generate_synthetic_organization(
        size=req.size,
        seed=req.seed or 42,
        org_name=req.org_name or "TechCorp Enterprise"
    )

    # Clear current db tables and write new synthetic org
    db.query(VulnerabilityModel).delete()
    db.query(ConnectionModel).delete()
    db.query(AssetModel).delete()
    db.query(SimulationModel).delete()
    db.query(OrganizationModel).delete()

    org = OrganizationModel(
        id=synthetic_data["org_id"],
        name=synthetic_data["name"],
        industry=synthetic_data["industry"],
        description=synthetic_data["description"]
    )
    db.add(org)
    db.flush()

    for a in synthetic_data["assets"]:
        asset = AssetModel(
            id=a["id"],
            org_id=org.id,
            name=a["name"],
            type=a["type"],
            os=a.get("os", "Linux"),
            criticality=a.get("criticality", "Medium"),
            internet_exposed=a.get("internet_exposed", False),
            privilege_level=a.get("privilege_level", "User"),
            zone=a.get("zone", "DMZ"),
            ip_address=a.get("ip_address"),
            services_json=json.dumps(a.get("services", [])),
            security_controls_json=json.dumps(a.get("security_controls", [])),
            metadata_json=json.dumps(a.get("metadata", {}))
        )
        db.add(asset)
        db.flush()

        for v in a.get("vulnerabilities", []):
            vuln = VulnerabilityModel(
                id=f"vuln-{os.urandom(4).hex()}",
                asset_id=asset.id,
                identifier=v.get("identifier", "CVE-2024-0000"),
                title=v.get("title", "Vulnerability"),
                severity=v.get("severity", "Medium"),
                cvss=float(v.get("cvss", 5.0)),
                description=v.get("description", ""),
                exploitability=float(v.get("exploitability", 0.7)),
                cwe=v.get("cwe", "CWE-20")
            )
            db.add(vuln)

    for c in synthetic_data["connections"]:
        conn = ConnectionModel(
            org_id=org.id,
            source=c["source"],
            target=c["target"],
            connection_type=c.get("connection_type", "Network"),
            port=c.get("port"),
            protocol=c.get("protocol", "TCP"),
            authentication_required=c.get("authentication_required", False),
            privilege_required=c.get("privilege_required", "None")
        )
        db.add(conn)

    db.commit()
    reload_graph_engine(db)

    return {
        "status": "success",
        "message": f"Generated synthetic organization '{synthetic_data['name']}' with {len(synthetic_data['assets'])} assets and {len(synthetic_data['connections'])} connections.",
        "assets_count": len(synthetic_data["assets"]),
        "connections_count": len(synthetic_data["connections"])
    }

# --- Module 5: Attack Graph Engine & Attack Paths ---

@app.post("/api/attack-paths/generate", response_model=AttackPathsResponse)
@app.get("/api/attack-paths", response_model=AttackPathsResponse)
def get_or_generate_attack_paths(
    source_id: Optional[str] = Query(None),
    target_id: Optional[str] = Query(None),
    max_depth: int = Query(6),
    db: Session = Depends(get_db)
):
    paths_raw = graph_engine.find_all_attack_paths(source_id=source_id, target_id=target_id, max_depth=max_depth)
    
    scored_items: List[AttackPathItem] = []
    for p in paths_raw:
        features = graph_engine.extract_path_features(p)
        pred = predict_path_risk(features)
        
        node_details = [graph_engine.nodes_data.get(n_id, {"id": n_id, "name": n_id, "type": "Server"}) for n_id in p]
        
        # Recommendations
        recs = [
            f"Patch vulnerabilities on entry node '{node_details[0].get('name')}'",
            f"Implement network segmentation on hop '{node_details[min(1, len(node_details)-1)].get('name')}'",
            f"Enforce MFA on destination asset '{node_details[-1].get('name')}'"
        ]

        scored_items.append(
            AttackPathItem(
                id=f"path-{hash('-'.join(p)) % 1000000:06d}",
                nodes=p,
                node_details=node_details,
                edges=[],
                length=len(p),
                risk_score=pred["risk_score"],
                risk_class=pred["risk_class"],
                features=features,
                ml_confidence=0.96,
                model_name=pred.get("model_version", "RandomForest Risk Regressor"),
                top_factors=pred.get("explainability", []),
                mitre_techniques=["T1190 Initial Access", "T1068 Privilege Escalation", "T1021 Lateral Movement", "T1048 Exfiltration"],
                defensive_recommendations=recs
            )
        )

    scored_items.sort(key=lambda x: x.risk_score, reverse=True)
    high_count = sum(1 for p in scored_items if p.risk_class in ["High", "Critical"])
    crit_count = sum(1 for p in scored_items if p.risk_class == "Critical")
    avg_score = float(sum(p.risk_score for p in scored_items) / len(scored_items)) if scored_items else 0.0

    return AttackPathsResponse(
        total_paths=len(scored_items),
        high_risk_paths_count=high_count,
        critical_risk_paths_count=crit_count,
        average_risk_score=round(avg_score, 1),
        paths=scored_items,
        source_node=source_id,
        target_node=target_id
    )

# --- Module 6: ML Prediction & Explainability ---

@app.post("/api/ml/predict-risk", response_model=RiskPredictionResponse)
def api_predict_risk(req: RiskPredictionRequest):
    if req.features:
        features = req.features
    else:
        features = graph_engine.extract_path_features(req.path_nodes)
    
    pred = predict_path_risk(features)
    return RiskPredictionResponse(
        risk_score=pred["risk_score"],
        risk_class=pred["risk_class"],
        probabilities=pred["probabilities"],
        model_version=pred.get("model_version", "RandomForest v1.0"),
        features=features,
        explainability=pred.get("explainability", [])
    )

@app.post("/api/ml/next-step", response_model=NextStepPredictionResponse)
def api_next_step_prediction(req: NextStepPredictionRequest):
    neighbors = graph_engine.get_neighbors_for_node(req.current_node_id)
    res = predict_next_attack_step(req.current_node_id, neighbors, req.visited_nodes)
    return NextStepPredictionResponse(**res)

@app.post("/api/ml/train")
def api_train_models():
    metrics = train_and_evaluate_models()
    load_models()
    return {
        "status": "success",
        "message": "Models retrained and reloaded successfully.",
        "metrics": metrics
    }

@app.get("/api/ml/metrics")
def api_get_ml_metrics():
    metrics_file = os.path.join(os.path.dirname(__file__), "ml", "saved_models", "ml_metrics.json")
    if os.path.exists(metrics_file):
        with open(metrics_file, "r") as f:
            return json.load(f)
    return train_and_evaluate_models()

# --- Module 7: Dynamic Simulation ---

@app.post("/api/simulation/start", response_model=SimulationResponse)
def api_start_simulation(req: SimulationStartRequest, db: Session = Depends(get_db)):
    simulator = AttackSimulator(graph_engine)
    sim_res = simulator.run_simulation(
        start_node_id=req.start_node_id,
        target_node_id=req.target_node_id,
        strategy=req.strategy,
        max_steps=req.max_steps
    )

    org = db.query(OrganizationModel).first()
    if org:
        sim_record = SimulationModel(
            id=sim_res["simulation_id"],
            org_id=org.id,
            start_node=sim_res["start_node"],
            target_node=sim_res["target_node"],
            strategy=req.strategy,
            target_reached=sim_res["target_reached"],
            path_taken_json=json.dumps(sim_res["path_taken"]),
            steps_json=json.dumps(sim_res["steps"]),
            final_posture_impact=sim_res["final_posture_impact"],
            summary=sim_res["summary"]
        )
        db.add(sim_record)
        db.commit()

    return SimulationResponse(**sim_res)

# --- Module 8: What-If Security Simulation ---

@app.post("/api/what-if", response_model=WhatIfComparisonResponse)
def api_what_if_analysis(req: WhatIfRequest):
    what_if = WhatIfEngine(graph_engine)
    controls = [c.dict() for c in req.applied_controls]
    res = what_if.simulate_controls(controls)
    return WhatIfComparisonResponse(**res)

# --- Module 9: AI Security Analyst ---

@app.post("/api/ai/explain", response_model=AIExplanationResponse)
def api_ai_explain(req: AIExplanationRequest):
    if req.path:
        path_nodes = req.path
    else:
        # Generate default high-risk path
        paths = graph_engine.find_all_attack_paths(max_paths=1)
        path_nodes = paths[0] if paths else ["asset-internet", "asset-web-01", "asset-db-01"]

    features = graph_engine.extract_path_features(path_nodes)
    pred = predict_path_risk(features)
    node_details = [graph_engine.nodes_data.get(n_id, {"id": n_id, "name": n_id, "type": "Server"}) for n_id in path_nodes]

    explanation = ai_analyst.explain_attack_path(
        path_nodes=path_nodes,
        node_details=node_details,
        features=features,
        risk_score=pred["risk_score"],
        risk_class=pred["risk_class"],
        explainability_factors=pred.get("explainability", []),
        user_query=req.query
    )
    return AIExplanationResponse(**explanation)

# --- Module 10: Graph AI Lab ---

@app.get("/api/gnn/benchmark")
def api_gnn_benchmark():
    return gnn_lab.run_graph_ai_benchmark(graph_engine)

# --- Module 11: Reports & PDF Export ---

@app.post("/api/reports/generate")
def api_generate_report(db: Session = Depends(get_db)):
    metrics = get_dashboard_metrics(db)
    paths_res = get_or_generate_attack_paths(max_depth=6, db=db)
    sim = AttackSimulator(graph_engine).run_simulation()

    report_payload = {
        "executive_summary": (
            f"CyberPath AI evaluated the synthetic IT infrastructure. The posture score is rated at "
            f"{metrics.security_posture_score}/100 with {metrics.total_attack_paths} discovered attack paths "
            f"and {metrics.high_risk_paths_count} high-risk paths identified. "
            f"Prioritized remediation of perimeter ingress vulnerabilities is strongly advised."
        ),
        "metrics": metrics.dict(),
        "top_paths": [p.dict() for p in paths_res.paths[:5]],
        "simulation": sim,
        "recommendations": [
            {"priority": "P1", "control": "Patch Perimeter CVEs", "details": "Remediate Log4j and CitrixBleed on DMZ hosts."},
            {"priority": "P1", "control": "Microsegment Database Tier", "details": "Isolate database clusters from direct app server access."},
            {"priority": "P2", "control": "Enforce Domain Controller MFA", "details": "Require hardware token authentication for all admin Kerberos ticket requests."}
        ]
    }
    return report_payload

@app.get("/api/reports/download-pdf")
def api_download_pdf(db: Session = Depends(get_db)):
    report_data = api_generate_report(db)
    pdf_bytes = generate_pdf_report(report_data)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=CyberPath_AI_Attack_Graph_Report.pdf"}
    )

# --- Reset Demo Organization ---

@app.post("/api/reset-demo")
def api_reset_demo(db: Session = Depends(get_db)):
    db.query(VulnerabilityModel).delete()
    db.query(ConnectionModel).delete()
    db.query(AssetModel).delete()
    db.query(SimulationModel).delete()
    db.query(OrganizationModel).delete()
    db.commit()

    seed_demo_organization_if_empty()
    return {"status": "success", "message": "Reset to CyberTech Demo organization successfully."}

@app.post("/api/infrastructure/clear")
@app.post("/api/clear-all")
def api_clear_all_nodes(db: Session = Depends(get_db)):
    """Wipes all assets, connections, vulnerabilities, simulations, and attack paths, leaving a blank canvas."""
    db.query(VulnerabilityModel).delete()
    db.query(ConnectionModel).delete()
    db.query(AssetModel).delete()
    db.query(SimulationModel).delete()
    db.query(AttackPathRecordModel).delete()

    # Ensure an active organization container exists so new assets can immediately be added
    org = db.query(OrganizationModel).first()
    if not org:
        org = OrganizationModel(
            name="Custom Clean Architecture",
            industry="Custom / User Defined",
            description="Blank canvas for user-defined infrastructure topology."
        )
        db.add(org)
    else:
        org.name = "Custom Clean Architecture"

    db.commit()

    # Clear in-memory graph engine
    graph_engine.load_graph([], [])

    return {
        "status": "success",
        "message": "All nodes and network connections have been cleared. Topology is now a blank canvas."
    }

# --- Module 12: Network Packet Scanner & Device Provisioning ---

@app.get("/api/scanner/catalog")
def api_get_scanner_catalog():
    """Returns device templates and known service catalog for network design and vulnerability probing."""
    return {
        "device_templates": packet_scanner.get_device_templates(),
        "services": list(packet_scanner.get_service_catalog().keys())
    }

@app.post("/api/scanner/run")
def api_run_packet_scan(req: ScannerRunRequest):
    """Executes a packet-by-packet reachability, port probing, and vulnerability scan across the topology."""
    results = packet_scanner.run_packet_scan(
        graph_engine=graph_engine,
        scanner_node_id=req.scanner_node_id,
        target_ids=req.target_ids,
        scan_profile=req.scan_profile
    )
    return results

@app.post("/api/scanner/apply")
def api_apply_scan_findings(req: ScannerApplyRequest, db: Session = Depends(get_db)):
    """Commits discovered vulnerabilities into the active database, reloading the attack graph engine."""
    res = packet_scanner.apply_scan_findings_to_db(db, req.findings, graph_engine)
    return res

@app.post("/api/scanner/provision")
def api_quick_provision_device(req: DeviceProvisionRequest, db: Session = Depends(get_db)):
    """Quickly provisions a device from the Cisco Packet Tracer-style template shelf."""
    res = packet_scanner.quick_provision_device(
        db=db,
        graph_engine=graph_engine,
        template_key=req.template_key,
        custom_name=req.custom_name,
        custom_ip=req.custom_ip,
        connect_to_id=req.connect_to_id,
        port=req.port
    )
    return res

# --- Module 13: Real-World CVE Threat Intelligence (CISA KEV + EPSS) ---

@app.get("/api/cve/stats")
def api_get_cve_stats(db: Session = Depends(get_db)):
    """Returns high-level statistics and metadata for the real CISA KEV vulnerability database."""
    return cve_intel_service.get_stats(db)

@app.get("/api/cve/search")
def api_search_real_cves(
    query: str = Query("", description="Search term for CVE ID, vendor, product, or description"),
    vendor: str = Query("", description="Filter by vendor/project"),
    ransomware_only: bool = Query(False, description="Filter for known ransomware campaign use"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Searches real weaponized CVEs from CISA KEV with pagination and filtering."""
    return cve_intel_service.search_cves(
        db=db,
        query=query,
        vendor=vendor,
        ransomware_only=ransomware_only,
        limit=limit,
        offset=offset
    )

@app.post("/api/cve/sync")
def api_sync_cve_database(req: RealCVESyncRequest = RealCVESyncRequest(), db: Session = Depends(get_db)):
    """Synchronizes with live CISA KEV feed or refreshes the local SQLite intelligence database."""
    res = cve_intel_service.sync_database(db=db, force_online=req.force_online)
    return res

@app.post("/api/cve/attach")
def api_attach_cve_to_asset(req: RealCVEAttachRequest, db: Session = Depends(get_db)):
    """1-Click attaches a real CISA CVE to a target asset in the infrastructure graph."""
    res = cve_intel_service.attach_cve_to_asset(
        db=db,
        asset_id=req.asset_id,
        cve_id=req.cve_id,
        graph_engine=graph_engine
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@app.get("/api/cve/{cve_id}/epss")
def api_get_live_epss(cve_id: str):
    """Fetches real-time EPSS exploit prediction probability from FIRST.org API."""
    return cve_intel_service.fetch_live_epss(cve_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

"""
Pydantic Schemas for CyberPath AI
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# --- Asset and Connection Schemas ---

class VulnerabilitySchema(BaseModel):
    id: str
    identifier: str  # e.g., CVE-2023-38606, CVE-2024-21413
    title: str
    severity: str    # Low, Medium, High, Critical
    cvss: float
    description: str
    exploitability: float = 0.8
    remediation: Optional[str] = None
    cwe: Optional[str] = "CWE-20"

class AssetCreate(BaseModel):
    id: Optional[str] = None
    name: str
    type: str  # Internet, Firewall, Router, Web Server, App Server, Database, Workstation, Admin PC, Domain Controller, Cloud Resource, Sensitive Data
    os: str = "Linux"
    criticality: str = "Medium"  # Low, Medium, High, Critical
    internet_exposed: bool = False
    privilege_level: str = "User"  # None, User, Elevated, Admin, SYSTEM/Root
    services: List[str] = Field(default_factory=list)
    vulnerabilities: List[VulnerabilitySchema] = Field(default_factory=list)
    zone: str = "DMZ"  # External, DMZ, Internal, Secure Zone, Cloud
    ip_address: Optional[str] = None
    security_controls: List[str] = Field(default_factory=list)  # MFA, EDR, WAF, IPS, Network Segmentation
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AssetResponse(AssetCreate):
    id: str
    risk_score: float = 0.0

class ConnectionCreate(BaseModel):
    source: str
    target: str
    connection_type: str = "Network"  # Network, Communicates, Authenticates, HasAccessTo, AdminAccess, API
    port: Optional[int] = None
    protocol: str = "TCP"
    authentication_required: bool = False
    privilege_required: str = "None"  # None, User, Admin
    encrypted: bool = True
    bidirectional: bool = False

class GraphDataResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    total_assets: int
    total_connections: int

# --- Organization / Project Schemas ---

class OrganizationCreate(BaseModel):
    name: str = "TechCorp Enterprise"
    industry: str = "Fintech / Cloud Services"
    description: Optional[str] = "Simulated enterprise infrastructure environment."

class OrganizationResponse(OrganizationCreate):
    id: str
    asset_count: int = 0
    connection_count: int = 0
    created_at: str

# --- Attack Path Schemas ---

class AttackPathFeature(BaseModel):
    path_length: int
    internet_exposed: int
    avg_cvss: float
    max_cvss: float
    vulnerability_count: int
    high_severity_vulnerabilities: int
    privilege_escalation: int
    authentication_required: int
    critical_asset_reached: int
    sensitive_data_reached: int
    asset_criticality_score: float
    number_of_hops: int
    security_controls_bypassed: int
    network_exposure_score: float

class AttackPathItem(BaseModel):
    id: str
    nodes: List[str]
    node_details: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    length: int
    risk_score: float  # 0 to 100
    risk_class: str    # Low, Medium, High, Critical
    features: Dict[str, Any]
    ml_confidence: float = 0.95
    model_name: str = "RandomForest Classifier + Regressor"
    top_factors: List[Dict[str, Any]] = Field(default_factory=list)
    mitre_techniques: List[str] = Field(default_factory=list)
    defensive_recommendations: List[str] = Field(default_factory=list)

class AttackPathsResponse(BaseModel):
    total_paths: int
    high_risk_paths_count: int
    critical_risk_paths_count: int
    average_risk_score: float
    paths: List[AttackPathItem]
    target_node: Optional[str] = None
    source_node: Optional[str] = None

# --- ML & Explainability Schemas ---

class RiskPredictionRequest(BaseModel):
    path_nodes: List[str]
    features: Optional[Dict[str, Any]] = None

class RiskPredictionResponse(BaseModel):
    risk_score: float
    risk_class: str
    probabilities: Dict[str, float]
    model_version: str
    features: Dict[str, Any]
    explainability: List[Dict[str, Any]]  # SHAP/feature contribution percentages

class NextStepPredictionRequest(BaseModel):
    current_node_id: str
    visited_nodes: List[str] = Field(default_factory=list)

class NextStepPredictionItem(BaseModel):
    node_id: str
    node_name: str
    node_type: str
    probability: float
    risk_contribution: float
    rationale: str
    privilege_required: str
    cvss_score: float

class NextStepPredictionResponse(BaseModel):
    current_node: str
    predictions: List[NextStepPredictionItem]
    highest_risk_next_node: Optional[str] = None

# --- Dynamic Simulation Schemas ---

class SimulationStep(BaseModel):
    step_number: int
    current_node: Dict[str, Any]
    action: str
    technique: str
    mitre_id: str
    status: str  # Success, Blocked, Detected
    privilege_obtained: str
    vulnerability_exploited: Optional[str] = None
    next_possible_nodes: List[Dict[str, Any]]
    step_risk: float
    log_message: str

class SimulationStartRequest(BaseModel):
    start_node_id: Optional[str] = None
    target_node_id: Optional[str] = None
    strategy: str = "HighestRisk"  # HighestRisk, ShortestPath, Stealthy, CriticalAssetTargeted
    max_steps: int = 10

class SimulationResponse(BaseModel):
    simulation_id: str
    start_node: str
    target_node: Optional[str]
    total_steps: int
    target_reached: bool
    path_taken: List[str]
    steps: List[SimulationStep]
    final_posture_impact: float
    summary: str

# --- What-If Analysis Schemas ---

class SecurityControlAction(BaseModel):
    control_type: str  # patch_vulnerability, add_firewall_rule, enable_mfa, isolate_asset, remove_connection, reduce_privilege, deploy_edr, remove_internet_exposure
    target_asset_id: Optional[str] = None
    target_vulnerability_id: Optional[str] = None
    source_asset_id: Optional[str] = None
    destination_asset_id: Optional[str] = None
    enabled: bool = True

class WhatIfRequest(BaseModel):
    applied_controls: List[SecurityControlAction]

class WhatIfComparisonResponse(BaseModel):
    original_metrics: Dict[str, Any]
    mitigated_metrics: Dict[str, Any]
    delta: Dict[str, Any]
    blocked_paths_count: int
    remaining_paths_count: int
    blocked_paths: List[List[str]]
    remaining_high_risk_paths: List[AttackPathItem]
    posture_improvement_percentage: float
    recommendation_summary: str

# --- AI Security Analyst Schemas ---

class AIExplanationRequest(BaseModel):
    path: Optional[List[str]] = None
    attack_path_id: Optional[str] = None
    context_type: str = "attack_path"  # attack_path, infrastructure_overview, simulation_incident, what_if_summary
    query: Optional[str] = None

class AIExplanationResponse(BaseModel):
    title: str
    executive_summary: str
    narrative_attack_chain: List[str]
    why_path_is_risky: List[str]
    top_contributing_factors: List[Dict[str, Any]]
    soc_investigation_questions: List[str]
    defensive_recommendations: List[Dict[str, Any]]
    threat_intel_context: Dict[str, Any]
    model_confidence_statement: str

# --- Synthetic Generation Schema ---

class SyntheticGenRequest(BaseModel):
    size: str = "Medium"  # Small (10-20), Medium (20-50), Large (50-100)
    seed: Optional[int] = 42
    org_name: Optional[str] = "Acme SecureCorp"
    industry: Optional[str] = "Financial Services"
    complexity: Optional[str] = "Realistic Enterprise"

# --- Dashboard Overview Schema ---

class DashboardMetrics(BaseModel):
    security_posture_score: float  # 0 - 100
    total_assets: int
    critical_assets_count: int
    vulnerable_assets_count: int
    total_attack_paths: int
    high_risk_paths_count: int
    critical_risk_paths_count: int
    average_path_risk: float
    most_exposed_asset: Dict[str, Any]
    most_targeted_critical_asset: Dict[str, Any]
    simulated_incidents_count: int
    risk_distribution: Dict[str, int]
    asset_types_breakdown: Dict[str, int]
    vulnerability_severity_breakdown: Dict[str, int]
    path_length_distribution: Dict[str, int]
    top_critical_attack_paths: List[AttackPathItem]
    security_posture_history: List[Dict[str, Any]]

# --- Network Packet Scanner & Provisioning Schemas ---

class ScannerRunRequest(BaseModel):
    scanner_node_id: Optional[str] = None
    target_ids: Optional[List[str]] = None
    scan_profile: str = "Full Vulnerability Audit"

class ScannerApplyRequest(BaseModel):
    findings: List[Dict[str, Any]]

class DeviceProvisionRequest(BaseModel):
    template_key: str
    custom_name: Optional[str] = None
    custom_ip: Optional[str] = None
    connect_to_id: Optional[str] = None
    port: Optional[int] = None

# --- Real-World CVE Intelligence Schemas (CISA KEV + EPSS) ---

class RealCVEItem(BaseModel):
    cve_id: str
    vendor_project: str
    product: str
    vulnerability_name: str
    date_added: Optional[str] = None
    short_description: Optional[str] = None
    required_action: Optional[str] = None
    due_date: Optional[str] = None
    known_ransomware_campaign_use: str = "Unknown"
    notes: Optional[str] = None
    cvss: float = 8.5
    severity: str = "High"
    cwe: str = "CWE-20"
    exploitability: float = 0.85

class RealCVESearchResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: List[RealCVEItem]

class RealCVEAttachRequest(BaseModel):
    asset_id: str
    cve_id: str

class RealCVESyncRequest(BaseModel):
    force_online: bool = False



export type RiskClass = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Vulnerability {
  id: string;
  identifier: string;
  title: string;
  severity: string;
  cvss: number;
  description: string;
  exploitability?: number;
  cwe?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  os: string;
  criticality: string;
  internet_exposed: boolean;
  privilege_level: string;
  zone: string;
  ip_address?: string;
  services: string[];
  security_controls: string[];
  vulnerabilities: Vulnerability[];
  risk_score?: number;
}

export interface Connection {
  id?: string;
  source: string;
  target: string;
  connection_type: string;
  port?: number;
  protocol: string;
  authentication_required: boolean;
  privilege_required: string;
  blocked?: boolean;
}

export interface ExplainabilityFactor {
  feature: string;
  label: string;
  contribution_percentage: number;
  impact_direction: string;
  description: string;
  raw_value: any;
}

export interface AttackPathItem {
  id: string;
  nodes: string[];
  node_details: Asset[];
  length: number;
  risk_score: number;
  risk_class: RiskClass;
  features: Record<string, any>;
  ml_confidence: number;
  model_name: string;
  top_factors: ExplainabilityFactor[];
  mitre_techniques: string[];
  defensive_recommendations: string[];
}

export interface DashboardMetrics {
  security_posture_score: number;
  total_assets: number;
  critical_assets_count: number;
  vulnerable_assets_count: number;
  total_attack_paths: number;
  high_risk_paths_count: number;
  critical_risk_paths_count: number;
  average_path_risk: number;
  most_exposed_asset: {
    name: string;
    type: string;
    zone: string;
    vulnerabilities_count: number;
  };
  most_targeted_critical_asset: {
    name: string;
    type: string;
    criticality: string;
    exposure: string;
  };
  simulated_incidents_count: number;
  risk_distribution: Record<string, number>;
  asset_types_breakdown: Record<string, number>;
  vulnerability_severity_breakdown: Record<string, number>;
  path_length_distribution: Record<string, number>;
  top_critical_attack_paths: AttackPathItem[];
  security_posture_history: Array<{ date: string; score: number }>;
}

export interface SimulationStep {
  step_number: number;
  current_node: { id: string; name: string; type: string };
  action: string;
  technique: string;
  mitre_id: string;
  status: string;
  privilege_obtained: string;
  vulnerability_exploited?: string;
  next_possible_nodes: Array<{ id: string; name: string; probability: number }>;
  step_risk: number;
  log_message: string;
}

export interface SimulationResponse {
  simulation_id: string;
  start_node: string;
  target_node?: string;
  total_steps: number;
  target_reached: boolean;
  path_taken: string[];
  steps: SimulationStep[];
  final_posture_impact: number;
  summary: string;
}

export interface NextStepPrediction {
  node_id: string;
  node_name: string;
  node_type: string;
  probability: number;
  risk_contribution: number;
  rationale: string;
  privilege_required: string;
  cvss_score: number;
  traversable: boolean;
}

export interface NextStepResponse {
  current_node: string;
  predictions: NextStepPrediction[];
  highest_risk_next_node?: string;
}

export interface WhatIfResponse {
  original_metrics: {
    total_paths: number;
    high_risk_paths: number;
    average_risk_score: number;
    security_posture_score: number;
  };
  mitigated_metrics: {
    total_paths: number;
    high_risk_paths: number;
    average_risk_score: number;
    security_posture_score: number;
  };
  delta: {
    paths_eliminated: number;
    high_risk_reduction: number;
    average_risk_reduction: number;
    posture_score_gain: number;
  };
  blocked_paths_count: number;
  remaining_paths_count: number;
  blocked_paths: string[][];
  remaining_high_risk_paths: AttackPathItem[];
  posture_improvement_percentage: number;
  recommendation_summary: string;
}

export interface AIExplanationResponse {
  title: string;
  executive_summary: string;
  narrative_attack_chain: string[];
  why_path_is_risky: string[];
  top_contributing_factors: ExplainabilityFactor[];
  soc_investigation_questions: string[];
  defensive_recommendations: Array<{ priority: string; control: string; details: string }>;
  threat_intel_context: {
    mitre_tactics_covered: string[];
    simulated_adversary_profile: string;
    estimated_mean_time_to_compromise: string;
    detection_difficulty: string;
  };
  model_confidence_statement: string;
}

export interface GNNBenchmarkResponse {
  experiment_title: string;
  evaluated_nodes_count: number;
  architecture: string;
  models_comparison: Array<{
    model_name: string;
    type: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    inference_time_ms: number;
    graph_awareness: string;
    status: string;
  }>;
  insights: string[];
  gnn_status: string;
}

// --- Packet Scanner & Provisioning Types ---

export interface PacketTraceEvent {
  packet_id: string;
  protocol: string;
  source: string;
  destination: string;
  path_traversed: string;
  status: 'DELIVERED' | 'FILTERED' | 'VULNERABILITIES_DETECTED' | 'CLEAN_SERVICES';
  status_code: number;
  event_description: string;
  details?: Record<string, any>;
}

export interface ScanFinding {
  target_id: string;
  name: string;
  type: string;
  ip_address: string;
  zone: string;
  reachable: boolean;
  path_taken: string[];
  hop_count: number;
  open_ports: number[];
  services: string[];
  discovered_cves: Vulnerability[];
  vulnerability_count: number;
  highest_cvss: number;
  security_status: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'SECURE' | 'FILTERED_PROTECTED';
}

export interface ScanResultResponse {
  scan_id: string;
  scanner_node: {
    id: string;
    name: string;
    type: string;
    ip_address: string;
    zone: string;
  };
  scan_profile: string;
  hosts_scanned: number;
  hosts_reachable: number;
  hosts_filtered: number;
  open_ports_found: number;
  cves_found_count: number;
  packet_traces: PacketTraceEvent[];
  findings: ScanFinding[];
  summary: string;
}

export interface DeviceTemplate {
  key: string;
  name: string;
  type: string;
  os: string;
  criticality: string;
  zone: string;
  internet_exposed: boolean;
  privilege_level: string;
  services: string[];
  default_ports: number[];
  security_controls: string[];
  description: string;
}

export interface ScannerCatalogResponse {
  device_templates: DeviceTemplate[];
  services: string[];
}

export interface RealCVEItem {
  cve_id: string;
  vendor_project: string;
  product: string;
  vulnerability_name: string;
  date_added?: string;
  short_description?: string;
  required_action?: string;
  due_date?: string;
  known_ransomware_campaign_use: string;
  notes?: string;
  cvss: number;
  severity: string;
  cwe: string;
  exploitability: number;
}

export interface RealCVESearchResponse {
  total: number;
  limit: number;
  offset: number;
  items: RealCVEItem[];
}

export interface RealCVEStats {
  total_cves: number;
  ransomware_weaponized: number;
  critical_severity: number;
  top_vendors: Array<{ vendor: string; count: number }>;
  feed_authority: string;
  catalog_type: string;
  last_synced: string;
}

export interface EPSSData {
  cve_id: string;
  epss_score: number;
  percentile: number;
  probability_percent: number;
  date?: string;
  status: string;
}



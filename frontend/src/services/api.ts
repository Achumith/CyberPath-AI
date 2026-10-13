import {
  DashboardMetrics, Asset, Connection, AttackPathItem,
  SimulationResponse, NextStepResponse, WhatIfResponse,
  AIExplanationResponse, GNNBenchmarkResponse,
  ScannerCatalogResponse, ScanResultResponse, ScanFinding,
  RealCVESearchResponse, RealCVEStats, EPSSData
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Health
  checkHealth: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse<{ status: string; nodes_loaded: number }>(res);
  },

  // Dashboard Metrics
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const res = await fetch(`${BASE_URL}/dashboard/metrics`);
    return handleResponse<DashboardMetrics>(res);
  },

  // Assets
  getAssets: async (): Promise<Asset[]> => {
    const res = await fetch(`${BASE_URL}/assets`);
    return handleResponse<Asset[]>(res);
  },

  createAsset: async (asset: Partial<Asset>): Promise<Asset> => {
    const res = await fetch(`${BASE_URL}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset)
    });
    return handleResponse<Asset>(res);
  },

  deleteAsset: async (assetId: string) => {
    const res = await fetch(`${BASE_URL}/assets/${assetId}`, { method: 'DELETE' });
    return handleResponse<{ status: string; message: string }>(res);
  },

  // Connections
  createConnection: async (conn: Partial<Connection>) => {
    const res = await fetch(`${BASE_URL}/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conn)
    });
    return handleResponse<{ status: string; connection_id: string }>(res);
  },

  // Graph Visualization Data
  getGraphData: async () => {
    const res = await fetch(`${BASE_URL}/graph`);
    return handleResponse<{ nodes: any[]; edges: any[]; total_assets: number; total_connections: number }>(res);
  },

  // Attack Paths
  getAttackPaths: async (sourceId?: string, targetId?: string): Promise<{
    total_paths: number;
    high_risk_paths_count: number;
    critical_risk_paths_count: number;
    average_risk_score: number;
    paths: AttackPathItem[];
  }> => {
    const params = new URLSearchParams();
    if (sourceId) params.append('source_id', sourceId);
    if (targetId) params.append('target_id', targetId);
    const res = await fetch(`${BASE_URL}/attack-paths?${params.toString()}`);
    return handleResponse(res);
  },

  // Dynamic Simulation
  startSimulation: async (startNodeId?: string, targetNodeId?: string, strategy: string = 'HighestRisk'): Promise<SimulationResponse> => {
    const res = await fetch(`${BASE_URL}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_node_id: startNodeId, target_node_id: targetNodeId, strategy })
    });
    return handleResponse<SimulationResponse>(res);
  },

  // Next-Step Prediction
  predictNextStep: async (currentNodeId: string, visitedNodes: string[] = []): Promise<NextStepResponse> => {
    const res = await fetch(`${BASE_URL}/ml/next-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_node_id: currentNodeId, visited_nodes: visitedNodes })
    });
    return handleResponse<NextStepResponse>(res);
  },

  // What-If Analysis
  runWhatIfAnalysis: async (appliedControls: any[]): Promise<WhatIfResponse> => {
    const res = await fetch(`${BASE_URL}/what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applied_controls: appliedControls })
    });
    return handleResponse<WhatIfResponse>(res);
  },

  // AI Analyst Explanation
  getAIExplanation: async (pathNodes?: string[], query?: string): Promise<AIExplanationResponse> => {
    const res = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathNodes, query })
    });
    return handleResponse<AIExplanationResponse>(res);
  },

  // GNN Benchmark
  getGNNBenchmark: async (): Promise<GNNBenchmarkResponse> => {
    const res = await fetch(`${BASE_URL}/gnn/benchmark`);
    return handleResponse<GNNBenchmarkResponse>(res);
  },

  // ML Metrics
  getMLMetrics: async () => {
    const res = await fetch(`${BASE_URL}/ml/metrics`);
    return handleResponse<any>(res);
  },

  retrainMLModels: async () => {
    const res = await fetch(`${BASE_URL}/ml/train`, { method: 'POST' });
    return handleResponse<any>(res);
  },

  // Synthetic Org Generator
  generateSyntheticOrg: async (size: string = 'Medium', seed: number = 42, orgName: string = 'TechCorp Enterprise') => {
    const res = await fetch(`${BASE_URL}/synthetic/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size, seed, org_name: orgName })
    });
    return handleResponse<{ status: string; message: string; assets_count: number; connections_count: number }>(res);
  },

  // Reset Demo
  resetDemoOrg: async () => {
    const res = await fetch(`${BASE_URL}/reset-demo`, { method: 'POST' });
    return handleResponse<{ status: string; message: string }>(res);
  },

  // Reports
  generateReportJSON: async () => {
    const res = await fetch(`${BASE_URL}/reports/generate`, { method: 'POST' });
    return handleResponse<any>(res);
  },

  downloadPDFUrl: `${BASE_URL}/reports/download-pdf`,

  // Network Packet Scanner & Device Provisioner (Cisco Packet Tracer Mode)
  getScannerCatalog: async (): Promise<ScannerCatalogResponse> => {
    const res = await fetch(`${BASE_URL}/scanner/catalog`);
    return handleResponse<ScannerCatalogResponse>(res);
  },

  runPacketScan: async (
    scannerNodeId?: string,
    targetIds?: string[],
    scanProfile: string = 'Full Vulnerability Audit'
  ): Promise<ScanResultResponse> => {
    const res = await fetch(`${BASE_URL}/scanner/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scanner_node_id: scannerNodeId,
        target_ids: targetIds,
        scan_profile: scanProfile
      })
    });
    return handleResponse<ScanResultResponse>(res);
  },

  applyScanFindings: async (findings: ScanFinding[]) => {
    const res = await fetch(`${BASE_URL}/scanner/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ findings })
    });
    return handleResponse<{ status: string; assets_updated: number; vulnerabilities_added: number; message: string }>(res);
  },

  provisionDevice: async (
    templateKey: string,
    customName?: string,
    customIp?: string,
    connectToId?: string,
    port?: number
  ) => {
    const res = await fetch(`${BASE_URL}/scanner/provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_key: templateKey,
        custom_name: customName,
        custom_ip: customIp,
        connect_to_id: connectToId,
        port
      })
    });
    return handleResponse<any>(res);
  },

  // Real-World CVE Threat Intelligence
  getCVEStats: async () => {
    const res = await fetch(`${BASE_URL}/cve/stats`);
    return handleResponse<RealCVEStats>(res);
  },

  searchRealCVEs: async (
    query: string = '',
    vendor: string = '',
    ransomwareOnly: boolean = false,
    limit: number = 50,
    offset: number = 0
  ) => {
    const params = new URLSearchParams({
      query,
      vendor,
      ransomware_only: String(ransomwareOnly),
      limit: String(limit),
      offset: String(offset)
    });
    const res = await fetch(`${BASE_URL}/cve/search?${params.toString()}`);
    return handleResponse<RealCVESearchResponse>(res);
  },

  syncCVEDatabase: async (forceOnline: boolean = false) => {
    const res = await fetch(`${BASE_URL}/cve/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force_online: forceOnline })
    });
    return handleResponse<{
      status: string;
      source: string;
      total_records: number;
      newly_added: number;
      updated: number;
      message: string;
    }>(res);
  },

  attachCVEToAsset: async (assetId: string, cveId: string) => {
    const res = await fetch(`${BASE_URL}/cve/attach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId, cve_id: cveId })
    });
    return handleResponse<{
      status: string;
      message: string;
      asset_id?: string;
      cve_id?: string;
      cvss?: number;
      severity?: string;
    }>(res);
  },

  getLiveEPSS: async (cveId: string) => {
    const res = await fetch(`${BASE_URL}/cve/${encodeURIComponent(cveId)}/epss`);
    return handleResponse<EPSSData>(res);
  },

  clearAllNodes: async () => {
    const res = await fetch(`${BASE_URL}/infrastructure/clear`, {
      method: 'POST'
    });
    return handleResponse<{ status: string; message: string }>(res);
  }
};



import React, { useEffect, useState } from 'react';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Layers, GitFork,
  Activity, ArrowUpRight, ArrowRight, Zap, Target, Lock, Server,
  BarChart3, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { DashboardMetrics } from '../types';
import { api } from '../services/api';

interface DashboardViewProps {
  onNavigateToPath: (pathNodes: string[]) => void;
  onNavigateToSimulation: (startNode?: string) => void;
  onOpenSyntheticModal: () => void;
}

const RISK_COLORS: Record<string, string> = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444'
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToPath,
  onNavigateToSimulation,
  onOpenSyntheticModal
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-xs font-mono">Aggregating SOC attack graph telemetry...</span>
        </div>
      </div>
    );
  }

  // Format Recharts data
  const riskPieData = Object.entries(metrics.risk_distribution || {}).map(([name, value]) => ({
    name,
    value,
    color: RISK_COLORS[name] || '#94a3b8'
  }));

  const assetTypeData = Object.entries(metrics.asset_types_breakdown || {}).map(([name, count]) => ({
    name,
    count
  }));

  const pathLengthData = Object.entries(metrics.path_length_distribution || {}).map(([name, count]) => ({
    name,
    count
  }));

  const postureScore = metrics.security_posture_score;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Posture Score & Main Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Posture Score Widget */}
        <div className="lg:col-span-4 cyber-card p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Enterprise Security Posture
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
              Simulated Metric
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-3">
            <span
              className={`text-5xl font-black font-mono tracking-tight ${
                postureScore >= 75
                  ? 'text-emerald-400'
                  : postureScore >= 50
                  ? 'text-amber-400'
                  : 'text-rose-500'
              }`}
            >
              {postureScore.toFixed(0)}
            </span>
            <span className="text-xl text-slate-500 font-mono">/100</span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  postureScore >= 75
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : postureScore >= 50
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-rose-600 to-red-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, postureScore))}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {postureScore >= 75
                ? 'Strong segmentation. Few direct unauthenticated attack paths to critical assets.'
                : postureScore >= 50
                ? 'Moderate exposure. External DMZ entry points permit lateral movement to internal databases.'
                : 'Elevated risk! Multiple internet-accessible attack trajectories reach sensitive vaults.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Average Path Risk:</span>
            <span className="font-mono font-bold text-slate-200">
              {metrics.average_path_risk.toFixed(1)}/100
            </span>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="cyber-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Total Assets</span>
              <Server className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-2 text-2xl font-bold font-mono text-slate-100">
              {metrics.total_assets}
            </div>
            <div className="text-[10px] text-slate-500">Modeled Nodes</div>
          </div>

          <div className="cyber-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Critical Assets</span>
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
            <div className="my-2 text-2xl font-bold font-mono text-rose-400">
              {metrics.critical_assets_count}
            </div>
            <div className="text-[10px] text-slate-500">High-Value Repos</div>
          </div>

          <div className="cyber-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Attack Paths</span>
              <GitFork className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-2 text-2xl font-bold font-mono text-cyan-300">
              {metrics.total_attack_paths}
            </div>
            <div className="text-[10px] text-slate-500">Discovered Vectors</div>
          </div>

          <div className="cyber-card p-4 flex flex-col justify-between border-red-500/20 bg-red-950/10">
            <div className="flex items-center justify-between text-red-400">
              <span className="text-xs font-semibold">High-Risk Paths</span>
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <div className="my-2 text-2xl font-bold font-mono text-red-400">
              {metrics.high_risk_paths_count}
            </div>
            <div className="text-[10px] text-red-400/80 font-mono">
              {metrics.critical_risk_paths_count} Critical Tier
            </div>
          </div>

          {/* Focal Target & Exposure Cards */}
          <div className="col-span-2 cyber-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                Most Exposed Asset
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                EXT INGRESS
              </span>
            </div>
            <div className="text-sm font-bold text-slate-100 truncate">
              {metrics.most_exposed_asset?.name || 'DMZ-Web-Server'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>{metrics.most_exposed_asset?.type} ({metrics.most_exposed_asset?.zone})</span>
              <span className="font-mono text-amber-400">
                {metrics.most_exposed_asset?.vulnerabilities_count} CVEs
              </span>
            </div>
          </div>

          <div className="col-span-2 cyber-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                Most Targeted Asset
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-rose-950 text-rose-300 border border-rose-800">
                PRIMARY TARGET
              </span>
            </div>
            <div className="text-sm font-bold text-slate-100 truncate">
              {metrics.most_targeted_critical_asset?.name || 'Production DB Cluster'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>{metrics.most_targeted_critical_asset?.type}</span>
              <span className="font-mono text-rose-400 font-semibold">Critical Criticality</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Pie */}
        <div className="cyber-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Attack Path Risk Distribution
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">ML Classified</span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {riskPieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-1 text-center pt-2 border-t border-slate-800/80 text-[10px]">
            {riskPieData.map((d) => (
              <div key={d.name}>
                <div className="font-bold font-mono" style={{ color: d.color }}>{d.value}</div>
                <div className="text-slate-400">{d.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Types Bar Chart */}
        <div className="cyber-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Asset Topology Breakdown
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Node Types</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Posture History Trend */}
        <div className="cyber-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Security Posture Trajectory
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Temporal Trend</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.security_posture_history || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="postureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="score" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#postureGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Prioritized Critical Attack Trajectories */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Prioritized High-Risk Attack Paths (ML Ranked)
            </h2>
            <p className="text-xs text-slate-400">
              Candidate attack chains identified by graph traversal and scored by Random Forest Risk Model
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {(metrics.top_critical_attack_paths || []).map((path, idx) => (
            <div
              key={path.id || idx}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      path.risk_class === 'Critical'
                        ? 'cyber-badge-critical'
                        : path.risk_class === 'High'
                        ? 'cyber-badge-high'
                        : 'cyber-badge-medium'
                    }`}
                  >
                    {path.risk_class} • Risk {path.risk_score}/100
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {path.length} Hops
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Model: {path.model_name || 'RF Regressor'}
                  </span>
                </div>

                {/* Node Chain Trail */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-200">
                  {path.nodes.map((nodeName, nIdx) => (
                    <React.Fragment key={nIdx}>
                      <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono font-medium text-slate-300">
                        {nodeName}
                      </span>
                      {nIdx < path.nodes.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Explainability factors */}
                {path.top_factors && path.top_factors.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-400">Top Drivers:</span>
                    {path.top_factors.slice(0, 3).map((factor, fIdx) => (
                      <span key={fIdx} className="text-cyan-300 font-mono">
                        {factor.label} ({factor.contribution_percentage}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigateToSimulation(path.nodes[0])}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Simulate
                </button>
                <button
                  onClick={() => onNavigateToPath(path.nodes)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-xs font-medium text-cyan-300 transition-colors flex items-center gap-1"
                >
                  Inspect in Graph
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

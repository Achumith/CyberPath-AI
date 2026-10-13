import React, { useState, useEffect } from 'react';
import {
  GitFork, ArrowRight, ShieldAlert, Cpu, Sparkles, Scale,
  Eye, Zap, Bot, Filter, Search, Check, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { AttackPathItem } from '../types';
import { api } from '../services/api';

interface AttackPathsViewProps {
  onInspectInGraph: (pathNodes: string[]) => void;
  onSimulatePath: (startNode: string, targetNode?: string) => void;
  onExplainWithAI: (pathNodes: string[]) => void;
}

export const AttackPathsView: React.FC<AttackPathsViewProps> = ({
  onInspectInGraph,
  onSimulatePath,
  onExplainWithAI
}) => {
  const [paths, setPaths] = useState<AttackPathItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterClass, setFilterClass] = useState<string>('All');
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);

  // Comparison State
  const [comparePathA, setComparePathA] = useState<string>('');
  const [comparePathB, setComparePathB] = useState<string>('');
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);

  const fetchPaths = async () => {
    try {
      setLoading(true);
      const res = await api.getAttackPaths();
      setPaths(res.paths);
      if (res.paths.length >= 2) {
        setComparePathA(res.paths[0].id);
        setComparePathB(res.paths[1].id);
      }
    } catch (err) {
      console.error('Failed to fetch attack paths:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaths();
  }, []);

  const filteredPaths = paths.filter((p) => {
    if (filterClass === 'All') return true;
    return p.risk_class === filterClass;
  });

  const pathAObj = paths.find((p) => p.id === comparePathA);
  const pathBObj = paths.find((p) => p.id === comparePathB);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
            <GitFork className="w-5 h-5 text-cyan-400" />
            Attack Paths Discovery & Risk Evaluation
          </h2>
          <p className="text-xs text-slate-400">
            Automated graph traversal candidate paths scored by Random Forest Risk Regressor with Explainable AI attribution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComparisonModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:text-cyan-300 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Scale className="w-4 h-4 text-cyan-400" />
            Compare Attack Trajectories
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="cyber-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Filter Risk Tier:</span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterClass(tier)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                filterClass === tier
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-cyan-300 font-bold">{filteredPaths.length}</span> of {paths.length} discovered paths
        </div>
      </div>

      {/* Paths List */}
      {loading ? (
        <div className="flex justify-center p-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      ) : filteredPaths.length === 0 ? (
        <div className="cyber-card p-12 text-center text-slate-400 text-xs">
          No attack paths matched the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPaths.map((path, idx) => {
            const isExpanded = expandedPathId === path.id;
            return (
              <div
                key={path.id || idx}
                className="cyber-card p-5 transition-all border-slate-800 hover:border-slate-700 space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          path.risk_class === 'Critical'
                            ? 'cyber-badge-critical'
                            : path.risk_class === 'High'
                            ? 'cyber-badge-high'
                            : 'cyber-badge-medium'
                        }`}
                      >
                        {path.risk_class} • Risk {path.risk_score}/100
                      </span>

                      <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {path.length} Hops
                      </span>

                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        Confidence: {(path.ml_confidence * 100).toFixed(1)}%
                      </span>

                      <span className="text-[10px] font-mono text-slate-500">
                        {path.id}
                      </span>
                    </div>

                    {/* Nodes Sequence */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                      {path.nodes.map((nodeName, nIdx) => (
                        <React.Fragment key={nIdx}>
                          <span
                            className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                              nIdx === 0
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                                : nIdx === path.nodes.length - 1
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                : 'bg-slate-900 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {nodeName}
                          </span>
                          {nIdx < path.nodes.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onExplainWithAI(path.nodes)}
                      className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-xs font-medium text-purple-300 transition-colors flex items-center gap-1.5"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      AI Explain
                    </button>

                    <button
                      onClick={() => onSimulatePath(path.nodes[0], path.nodes[path.nodes.length - 1])}
                      className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-xs font-medium text-amber-300 transition-colors flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Simulate
                    </button>

                    <button
                      onClick={() => onInspectInGraph(path.nodes)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-xs font-medium text-cyan-300 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Graph
                    </button>

                    <button
                      onClick={() => setExpandedPathId(isExpanded ? null : path.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 transition-colors"
                      title="Toggle Feature Details & Explainability"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section: Features Matrix & Explainability Attributions */}
                {isExpanded && (
                  <div className="pt-4 border-t border-slate-800/80 space-y-4 animate-in fade-in">
                    {/* Explainability Breakdown */}
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        Explainable AI (XAI) Feature Attribution Impact
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {(path.top_factors || []).map((factor, fIdx) => (
                          <div
                            key={fIdx}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-200">{factor.label}</span>
                              <span className="font-mono font-bold text-cyan-400">
                                +{factor.contribution_percentage}%
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              {factor.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Features Table */}
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-300 mb-2">
                        Extracted ML Feature Vector
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[10px] font-mono">
                        {Object.entries(path.features || {}).map(([k, v]) => (
                          <div key={k} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                            <div className="text-slate-500 truncate" title={k}>{k}</div>
                            <div className="text-slate-200 font-bold mt-0.5">{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Modal (Module 16 of prompt) */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-4xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  Attack Trajectory Comparison Matrix
                </h3>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs text-cyan-400 font-mono font-bold mb-1">Path A</label>
                <select
                  value={comparePathA}
                  onChange={(e) => setComparePathA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                >
                  {paths.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.risk_class}] {p.nodes.join(' → ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-purple-400 font-mono font-bold mb-1">Path B</label>
                <select
                  value={comparePathB}
                  onChange={(e) => setComparePathB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                >
                  {paths.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.risk_class}] {p.nodes.join(' → ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Side-by-Side Table */}
            {pathAObj && pathBObj ? (
              <div className="space-y-4">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5 px-3">Metric / Property</th>
                      <th className="py-2.5 px-3 text-cyan-300">Path A</th>
                      <th className="py-2.5 px-3 text-purple-300">Path B</th>
                      <th className="py-2.5 px-3 text-slate-400">Objective Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-300">Risk Score</td>
                      <td className="py-2.5 px-3 font-bold text-red-400">{pathAObj.risk_score}/100</td>
                      <td className="py-2.5 px-3 font-bold text-red-400">{pathBObj.risk_score}/100</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        Δ {Math.abs(pathAObj.risk_score - pathBObj.risk_score).toFixed(1)} pts
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-300">Risk Tier</td>
                      <td className="py-2.5 px-3 text-slate-200">{pathAObj.risk_class}</td>
                      <td className="py-2.5 px-3 text-slate-200">{pathBObj.risk_class}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {pathAObj.risk_class === pathBObj.risk_class ? 'Equivalent Tier' : 'Different Severity'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-300">Path Length</td>
                      <td className="py-2.5 px-3">{pathAObj.length} Hops</td>
                      <td className="py-2.5 px-3">{pathBObj.length} Hops</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {pathAObj.length < pathBObj.length ? 'Path A is shorter & faster' : 'Path B is shorter & faster'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-300">Peak CVSS</td>
                      <td className="py-2.5 px-3 font-bold text-amber-400">{pathAObj.features.max_cvss}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-400">{pathBObj.features.max_cvss}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {pathAObj.features.max_cvss > pathBObj.features.max_cvss ? 'Path A has higher CVSS' : 'Path B has higher CVSS'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-300">External Ingress</td>
                      <td className="py-2.5 px-3">{pathAObj.features.internet_exposed ? 'Yes (Internet)' : 'No (Internal LAN)'}</td>
                      <td className="py-2.5 px-3">{pathBObj.features.internet_exposed ? 'Yes (Internet)' : 'No (Internal LAN)'}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {pathAObj.features.internet_exposed !== pathBObj.features.internet_exposed ? 'Different Threat Surfaces' : 'Same Ingress Vector'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-300">Critical Reached</td>
                      <td className="py-2.5 px-3">{pathAObj.features.critical_asset_reached ? 'Yes' : 'No'}</td>
                      <td className="py-2.5 px-3">{pathBObj.features.critical_asset_reached ? 'Yes' : 'No'}</td>
                      <td className="py-2.5 px-3 text-slate-400">Target Criticality Impact</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

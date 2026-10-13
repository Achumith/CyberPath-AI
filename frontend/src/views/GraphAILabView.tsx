import React, { useState, useEffect } from 'react';
import {
  Cpu, Activity, Zap, CheckCircle2, RefreshCw,
  Layers, GitFork, BarChart3, Clock, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { GNNBenchmarkResponse } from '../types';
import { api } from '../services/api';

export const GraphAILabView: React.FC = () => {
  const [benchmark, setBenchmark] = useState<GNNBenchmarkResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBenchmark = async () => {
    try {
      setLoading(true);
      const data = await api.getGNNBenchmark();
      setBenchmark(data);
    } catch (err) {
      console.error('Failed to run GNN benchmark:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  const chartData = (benchmark?.models_comparison || []).map((m) => ({
    name: m.model_name.split(' (')[0],
    Precision: Math.round(m.precision * 100),
    Recall: Math.round(m.recall * 100),
    F1: Math.round(m.f1_score * 100),
    LatencyMs: m.inference_time_ms
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Graph AI Lab: GNN vs. Traditional ML Benchmark
          </h2>
          <p className="text-xs text-slate-400">
            Evaluating Graph Convolutional Networks (GCN) against Tabular Ensembles for Cyber Attack Graph Threat Modeling
          </p>
        </div>

        <button
          onClick={fetchBenchmark}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-cyan-300 transition-colors flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Rerun Benchmark
        </button>
      </div>

      {/* Main Grid */}
      {loading || !benchmark ? (
        <div className="flex justify-center p-16 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comparison Cards & Architecture Overview */}
          <div className="cyber-card p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/20 border-cyan-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider">
                Graph Deep Learning Architecture
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                {benchmark.evaluated_nodes_count} Nodes Evaluated
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 font-mono mb-2">
              {benchmark.architecture}
            </h3>
            <div className="text-xs text-slate-300 font-mono bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">
              Layer Formula: <span className="text-cyan-400">H^(l+1) = σ( D̃^(-1/2) Ã D̃^(-1/2) H^(l) W^(l) )</span> — Performs normalized spectral message passing across node neighborhoods to learn topological attack representations.
            </div>
          </div>

          {/* Model Comparison Table */}
          <div className="cyber-card p-6 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Empirical Performance Benchmark Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Model Family</th>
                    <th className="py-2.5 px-3">Architecture Type</th>
                    <th className="py-2.5 px-3">Precision</th>
                    <th className="py-2.5 px-3">Recall</th>
                    <th className="py-2.5 px-3">F1-Score</th>
                    <th className="py-2.5 px-3">Inference Latency</th>
                    <th className="py-2.5 px-3">Graph Awareness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {benchmark.models_comparison.map((m, idx) => (
                    <tr key={idx} className={idx === 0 ? 'bg-cyan-950/20' : ''}>
                      <td className="py-3 px-3 font-bold text-slate-100 flex items-center gap-2">
                        {idx === 0 && <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                        {m.model_name}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{m.type}</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{(m.precision * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{(m.recall * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 text-cyan-300 font-bold">{(m.f1_score * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 text-amber-400 font-bold">{m.inference_time_ms} ms</td>
                      <td className="py-3 px-3 text-slate-300 text-[11px]">{m.graph_awareness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar Chart Comparison */}
          <div className="cyber-card p-6">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-4">
              F1-Score and Classification Metrics Comparison (%)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis domain={[80, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Precision" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Recall" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="F1" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Insights */}
          <div className="cyber-card p-6 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Lab Findings & Architectural Insights
            </h4>
            <div className="space-y-2">
              {benchmark.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

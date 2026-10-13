import React, { useState, useEffect } from 'react';
import {
  Compass, Cpu, ArrowRight, ShieldAlert, AlertTriangle,
  Server, Database, Lock, CheckCircle2, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { Asset, NextStepResponse } from '../types';
import { api } from '../services/api';

export const PredictiveNextStepView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [predictionData, setPredictionData] = useState<NextStepResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const data = await api.getAssets();
        setAssets(data);
        if (data.length > 0) {
          const webServer = data.find((a) => a.name.toLowerCase().includes('web') || a.type.toLowerCase().includes('web'));
          const defaultId = webServer ? webServer.id : data[0].id;
          setSelectedNodeId(defaultId);
          fetchPredictions(defaultId);
        }
      } catch (err) {
        console.error('Failed to load assets:', err);
      }
    };
    loadAssets();
  }, []);

  const fetchPredictions = async (nodeId: string) => {
    try {
      setLoading(true);
      const res = await api.predictNextStep(nodeId);
      setPredictionData(res);
    } catch (err) {
      console.error('Failed to predict next step:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedNodeId(id);
    fetchPredictions(id);
  };

  const chartData = (predictionData?.predictions || []).map((p) => ({
    name: p.node_name,
    probability: Math.round(p.probability * 100),
    risk: p.risk_contribution
  }));

  const selectedAsset = assets.find((a) => a.id === selectedNodeId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400" />
          Predictive Next-Step Attacker Movement Model
        </h2>
        <p className="text-xs text-slate-400">
          Machine learning model forecasting the adversary's highest-probability next pivot based on utility, CVEs, and asset criticality
        </p>
      </div>

      {/* Node Selector Bar */}
      <div className="cyber-card p-5">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-96">
            <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
              Current Simulated Attacker Position:
            </label>
            <select
              value={selectedNodeId}
              onChange={handleNodeChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-cyan-400"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type}) • {a.zone}
                </option>
              ))}
            </select>
          </div>

          {selectedAsset && (
            <div className="flex-1 text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500">Asset Type:</span>{' '}
                <span className="text-slate-200 font-semibold">{selectedAsset.type}</span>
              </div>
              <div>
                <span className="text-slate-500">Criticality:</span>{' '}
                <span className="text-slate-200 font-semibold">{selectedAsset.criticality}</span>
              </div>
              <div>
                <span className="text-slate-500">Vulnerabilities:</span>{' '}
                <span className="text-amber-400 font-mono font-bold">{selectedAsset.vulnerabilities.length} CVEs</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Results Workspace */}
      {loading ? (
        <div className="flex justify-center p-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      ) : predictionData && predictionData.predictions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Probability Bar Chart */}
          <div className="lg:col-span-6 cyber-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                Forecasted Softmax Probability Distribution
              </h3>
              <span className="text-[10px] text-cyan-400 font-mono">ML Utility Model</span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-25} textAnchor="end" />
                  <YAxis unit="%" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any) => [`${val}%`, 'Next Move Probability']}
                  />
                  <Bar dataKey="probability" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx === 0 ? '#00f0ff' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
              Probabilities represent the simulated adversary's preference vector calculated from target criticality, vulnerability exploitability, and credential barriers.
            </div>
          </div>

          {/* Predictions Ranked Table & Tactical Rationales */}
          <div className="lg:col-span-6 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Ranked Candidate Next Hops
            </h3>

            {predictionData.predictions.map((pred, idx) => {
              const isHighest = idx === 0;
              return (
                <div
                  key={pred.node_id}
                  className={`p-4 rounded-xl border transition-all ${
                    isHighest
                      ? 'bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-100">
                        {pred.node_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({pred.node_type})
                      </span>
                      {isHighest && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                          TOP RISK ROUTE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-cyan-400 text-sm">
                        {(pred.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                    {pred.rationale}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-800/80">
                    <span>Privilege Required: {pred.privilege_required}</span>
                    <span className="text-amber-400">CVSS: {pred.cvss_score}</span>
                    <span className="text-red-400">Risk Contrib: {pred.risk_contribution}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="cyber-card p-12 text-center text-slate-400 text-xs">
          No downstream adjacent network nodes accessible from this position.
        </div>
      )}
    </div>
  );
};

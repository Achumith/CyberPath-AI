import React, { useState, useEffect } from 'react';
import {
  PlayCircle, Pause, SkipForward, RotateCcw, ShieldAlert,
  Terminal, Zap, CheckCircle2, ArrowRight, AlertTriangle,
  Server, Database, Lock, Globe, Cpu, RefreshCw
} from 'lucide-react';
import { Asset, SimulationResponse, SimulationStep } from '../types';
import { api } from '../services/api';

interface SimulationViewProps {
  initialStartNode?: string;
  onInspectInGraph: (pathNodes: string[]) => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  initialStartNode,
  onInspectInGraph
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [startNode, setStartNode] = useState<string>(initialStartNode || '');
  const [targetNode, setTargetNode] = useState<string>('');
  const [strategy, setStrategy] = useState<string>('HighestRisk');
  
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const data = await api.getAssets();
        setAssets(data);
        if (data.length > 0) {
          if (!startNode) {
            const ext = data.find((a) => a.internet_exposed || a.type.toLowerCase() === 'internet');
            setStartNode(ext ? ext.id : data[0].id);
          }
          if (!targetNode) {
            const crit = data.find((a) => a.criticality === 'Critical');
            setTargetNode(crit ? crit.id : data[data.length - 1].id);
          }
        }
      } catch (err) {
        console.error('Failed to load assets:', err);
      }
    };
    loadAssets();
  }, []);

  // Auto-advance timer when playing
  useEffect(() => {
    let timer: any;
    if (isPlaying && simulation && currentStepIndex < simulation.steps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 1500);
    } else if (isPlaying && simulation && currentStepIndex >= simulation.steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, simulation]);

  const handleStartSimulation = async () => {
    try {
      setLoading(true);
      setIsPlaying(false);
      const res = await api.startSimulation(startNode, targetNode, strategy);
      setSimulation(res);
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to run simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const currentStep: SimulationStep | undefined = simulation?.steps[currentStepIndex];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-amber-400" />
            Dynamic Adversary Attack Simulation
          </h2>
          <p className="text-xs text-slate-400">
            Simulate multi-hop attacker progression through the graph with MITRE ATT&CK technique mapping and privilege escalation
          </p>
        </div>

        {/* Live Controls */}
        {simulation && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 transition-colors"
              title={isPlaying ? 'Pause' : 'Play Auto-Advance'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setCurrentStepIndex((prev) => Math.min(simulation.steps.length - 1, prev + 1))}
              disabled={currentStepIndex >= simulation.steps.length - 1}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30"
              title="Step Forward"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="Reset to Step 1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono text-slate-400 px-3">
              Step <span className="text-cyan-300 font-bold">{currentStepIndex + 1}</span> of {simulation.steps.length}
            </span>
          </div>
        )}
      </div>

      {/* Configuration Bar */}
      <div className="cyber-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
              1. Simulated Entry Ingress
            </label>
            <select
              value={startNode}
              onChange={(e) => setStartNode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type}) {a.internet_exposed ? '🌐' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
              2. Objective Target
            </label>
            <select
              value={targetNode}
              onChange={(e) => setTargetNode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
            >
              <option value="">Any High-Criticality Asset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.criticality})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
              3. Adversary Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
            >
              <option value="HighestRisk">Highest Threat Impact (Greedy Risk)</option>
              <option value="ShortestPath">Shortest Path to Objective</option>
              <option value="Stealthy">Stealthy (Low Noise Pivot)</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleStartSimulation}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Launch Attack Simulation
            </button>
          </div>
        </div>
      </div>

      {/* Main Simulation Workspace */}
      {simulation && currentStep ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Current Step Telemetry Card */}
          <div className="lg:col-span-7 cyber-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold">
                  STEP {currentStep.step_number} OF {simulation.steps.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Status: <span className="text-emerald-400 font-bold">{currentStep.status}</span>
                </span>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                Step Risk: {currentStep.step_risk}/100
              </span>
            </div>

            {/* Current Position */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                Current Attacker Position
              </div>
              <div className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-400" />
                {currentStep.current_node.name}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Asset Type: {currentStep.current_node.type} • Privilege Level: <span className="text-amber-300 font-bold">{currentStep.privilege_obtained}</span>
              </div>
            </div>

            {/* Action & MITRE ATT&CK Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase">
                  MITRE ATT&CK Technique
                </div>
                <div className="text-xs font-bold text-cyan-300 font-mono">
                  {currentStep.mitre_id}
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {currentStep.technique}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase">
                  Exploited Vulnerability
                </div>
                {currentStep.vulnerability_exploited ? (
                  <div className="text-xs font-bold text-red-400 font-mono">
                    {currentStep.vulnerability_exploited}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 font-mono">
                    Direct Trust / Credential Conduit
                  </div>
                )}
              </div>
            </div>

            {/* Path Breadcrumbs */}
            <div>
              <div className="text-xs font-mono font-bold text-slate-300 mb-2">
                Attack Progression Chain
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {simulation.path_taken.map((nodeId, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isPassed = idx < currentStepIndex;
                  return (
                    <React.Fragment key={idx}>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                          isCurrent
                            ? 'bg-red-950 text-red-300 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] font-bold animate-pulse'
                            : isPassed
                            ? 'bg-slate-900 text-slate-400 border border-slate-800 line-through opacity-70'
                            : 'bg-slate-950 text-slate-500 border border-slate-900'
                        }`}
                      >
                        {nodeId}
                      </span>
                      {idx < simulation.path_taken.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Inspect Button */}
            <div className="pt-2">
              <button
                onClick={() => onInspectInGraph(simulation.path_taken)}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-cyan-300 transition-colors flex items-center justify-center gap-2"
              >
                Inspect Simulated Trajectory in Attack Graph Canvas
              </button>
            </div>
          </div>

          {/* Terminal Logs & Next Pivots */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Terminal Telemetry Log */}
            <div className="cyber-card p-4 space-y-3 bg-slate-950/90 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Live SOC Telemetry Stream
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>

              <div className="space-y-2 text-[11px] max-h-52 overflow-y-auto pr-1">
                {simulation.steps.slice(0, currentStepIndex + 1).map((step, sIdx) => (
                  <div key={sIdx} className="text-slate-300 leading-relaxed">
                    <span className="text-slate-500 font-bold">[{sIdx + 1}]</span>{' '}
                    <span className="text-cyan-400">{step.log_message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Possible Pivots */}
            <div className="cyber-card p-4 space-y-3">
              <div className="text-xs font-mono font-bold text-slate-300">
                Available Downstream Move Options
              </div>

              {currentStep.next_possible_nodes && currentStep.next_possible_nodes.length > 0 ? (
                <div className="space-y-2">
                  {currentStep.next_possible_nodes.map((next, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-slate-200">{next.name}</span>
                      <span className="font-mono font-bold text-amber-400">
                        {(next.probability * 100).toFixed(0)}% Probability
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-mono p-3 bg-slate-950 rounded-lg border border-slate-800">
                  Target reached or terminal pivot path.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="cyber-card p-16 text-center text-slate-400 space-y-3">
          <PlayCircle className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
          <p className="text-sm font-semibold text-slate-300">
            Select ingress point and target above to execute an interactive attack simulation
          </p>
        </div>
      )}
    </div>
  );
};

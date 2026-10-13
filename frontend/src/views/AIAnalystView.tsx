import React, { useState, useEffect } from 'react';
import {
  Bot, Sparkles, ShieldAlert, CheckCircle2, HelpCircle,
  ArrowRight, Shield, Terminal, Send, RefreshCw, Layers
} from 'lucide-react';
import { AttackPathItem, AIExplanationResponse } from '../types';
import { api } from '../services/api';

interface AIAnalystViewProps {
  selectedPathNodes?: string[];
}

export const AIAnalystView: React.FC<AIAnalystViewProps> = ({ selectedPathNodes }) => {
  const [paths, setPaths] = useState<AttackPathItem[]>([]);
  const [selectedPathIndex, setSelectedPathIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState<AIExplanationResponse | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await api.getAttackPaths();
        setPaths(res.paths);
        
        let pathNodesToExplain = selectedPathNodes;
        if (!pathNodesToExplain || pathNodesToExplain.length === 0) {
          if (res.paths.length > 0) {
            pathNodesToExplain = res.paths[0].nodes;
          }
        }

        if (pathNodesToExplain && pathNodesToExplain.length > 0) {
          const exp = await api.getAIExplanation(pathNodesToExplain);
          setExplanation(exp);
        }
      } catch (err) {
        console.error('Failed to generate AI explanation:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedPathNodes]);

  const handleSelectPath = async (idx: number) => {
    setSelectedPathIndex(idx);
    const chosen = paths[idx];
    if (chosen) {
      try {
        setLoading(true);
        const exp = await api.getAIExplanation(chosen.nodes, userPrompt);
        setExplanation(exp);
      } catch (err) {
        console.error('Failed to fetch explanation:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) return;
    try {
      setLoading(true);
      const chosen = paths[selectedPathIndex] || paths[0];
      const exp = await api.getAIExplanation(chosen ? chosen.nodes : undefined, userPrompt);
      setExplanation(exp);
    } catch (err) {
      console.error('Failed to query analyst:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          CyberPath AI Security Analyst
        </h2>
        <p className="text-xs text-slate-400">
          Contextual security reasoning engine providing structured attack chain explanations, SOC investigation guides, and defensive playbooks
        </p>
      </div>

      {/* Path Selector */}
      {paths.length > 0 && (
        <div className="cyber-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="text-slate-500">Selected Path:</span>
            <select
              value={selectedPathIndex}
              onChange={(e) => handleSelectPath(parseInt(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
            >
              {paths.map((p, idx) => (
                <option key={p.id} value={idx}>
                  Path #{idx + 1} [{p.risk_class}] ({p.risk_score}/100) — {p.nodes.join(' → ')}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-purple-400 font-mono">
            Reasoning Grounded in Graph Telemetry & MITRE ATT&CK
          </div>
        </div>
      )}

      {/* Main Analysis Workspace */}
      {loading ? (
        <div className="flex justify-center p-16 text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
            <span className="text-xs font-mono">Synthesizing threat intelligence reasoning...</span>
          </div>
        </div>
      ) : explanation ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Executive Summary & Narrative Attack Chain */}
          <div className="lg:col-span-8 space-y-6">
            {/* Executive Summary Card */}
            <div className="cyber-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-purple-400 uppercase font-bold tracking-wider">
                  Executive Security Assessment
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {explanation.model_confidence_statement}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">{explanation.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {explanation.executive_summary}
              </p>
            </div>

            {/* Narrative Attack Progression */}
            <div className="cyber-card p-6 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Multi-Phase Adversary Movement Narrative
              </h4>

              <div className="space-y-3">
                {explanation.narrative_attack_chain.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3"
                  >
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-xs font-bold shrink-0">
                      Phase {idx + 1}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Why This Path is Risky */}
            <div className="cyber-card p-6 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Critical Risk Drivers
              </h4>
              <div className="space-y-2">
                {explanation.why_path_is_risky.map((risk, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Question Input */}
            <div className="cyber-card p-4">
              <form onSubmit={handleSendPrompt} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Ask CyberPath AI Analyst a specific question about this attack path..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Ask
                </button>
              </form>
            </div>
          </div>

          {/* Right Sidebar: SOC Questions & Defensive Playbook */}
          <div className="lg:col-span-4 space-y-6">
            {/* SOC Analyst Investigation Guide */}
            <div className="cyber-card p-5 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                SOC Analyst Investigation Guide
              </h4>
              <p className="text-[11px] text-slate-400">
                Key questions for incident responders investigating this threat pattern:
              </p>
              <div className="space-y-2.5">
                {explanation.soc_investigation_questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed"
                  >
                    <span className="text-amber-400 font-mono font-bold mr-1.5">Q{idx + 1}:</span>
                    {q}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Defensive Playbook */}
            <div className="cyber-card p-5 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Prioritized Defensive Playbook
              </h4>
              <div className="space-y-2.5">
                {explanation.defensive_recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{rec.control}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                          rec.priority.includes('P1')
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{rec.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Threat Intel Card */}
            <div className="cyber-card p-5 space-y-2.5 text-xs text-slate-300 font-mono">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">
                Simulated Threat Context
              </div>
              <div>
                <span className="text-slate-500">Adversary Profile:</span>{' '}
                <span className="text-slate-200">{explanation.threat_intel_context.simulated_adversary_profile}</span>
              </div>
              <div>
                <span className="text-slate-500">Est. Time to Compromise:</span>{' '}
                <span className="text-cyan-400">{explanation.threat_intel_context.estimated_mean_time_to_compromise}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

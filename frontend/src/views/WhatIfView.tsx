import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal, ShieldCheck, ShieldAlert, ArrowRight,
  CheckCircle2, XCircle, RefreshCw, Sparkles, AlertTriangle,
  Lock, Key, Zap
} from 'lucide-react';
import { Asset, WhatIfResponse } from '../types';
import { api } from '../services/api';

export const WhatIfView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [controls, setControls] = useState<{
    patchWebCVEs: boolean;
    blockDMZToDB: boolean;
    enableMFAOnDB: boolean;
    isolateWorkstation: boolean;
    removeInternetExposure: boolean;
    enableEDROnAll: boolean;
  }>({
    patchWebCVEs: true,
    blockDMZToDB: true,
    enableMFAOnDB: true,
    isolateWorkstation: false,
    removeInternetExposure: false,
    enableEDROnAll: true
  });

  const [comparison, setComparison] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await api.getAssets();
        setAssets(data);
        runSimulation(controls, data);
      } catch (err) {
        console.error('Failed to init What-If view:', err);
      }
    };
    init();
  }, []);

  const runSimulation = async (activeControls = controls, assetList = assets) => {
    try {
      setLoading(true);
      const payload: any[] = [];

      // Find relevant assets
      const webAsset = assetList.find((a) => a.type.toLowerCase().includes('web'));
      const dbAsset = assetList.find((a) => a.type.toLowerCase().includes('database'));
      const wsAsset = assetList.find((a) => a.type.toLowerCase().includes('workstation'));

      if (activeControls.patchWebCVEs && webAsset) {
        payload.push({
          control_type: 'patch_vulnerability',
          target_asset_id: webAsset.id,
          enabled: true
        });
      }

      if (activeControls.blockDMZToDB && webAsset && dbAsset) {
        payload.push({
          control_type: 'add_firewall_rule',
          source_asset_id: webAsset.id,
          destination_asset_id: dbAsset.id,
          enabled: true
        });
      }

      if (activeControls.enableMFAOnDB && dbAsset) {
        payload.push({
          control_type: 'enable_mfa',
          target_asset_id: dbAsset.id,
          enabled: true
        });
      }

      if (activeControls.isolateWorkstation && wsAsset) {
        payload.push({
          control_type: 'isolate_asset',
          target_asset_id: wsAsset.id,
          enabled: true
        });
      }

      if (activeControls.removeInternetExposure && webAsset) {
        payload.push({
          control_type: 'remove_internet_exposure',
          target_asset_id: webAsset.id,
          enabled: true
        });
      }

      const res = await api.runWhatIfAnalysis(payload);
      setComparison(res);
    } catch (err) {
      console.error('Failed to run What-If evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof controls) => {
    const updated = { ...controls, [key]: !controls[key] };
    setControls(updated);
    runSimulation(updated);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
          What-If Security Control Simulation
        </h2>
        <p className="text-xs text-slate-400">
          Dynamically test defensive interventions (patching, microsegmentation, MFA, isolation) and evaluate real-time attack graph reduction
        </p>
      </div>

      {/* Main Grid: Controls Toggle Panel & Before/After Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Toggles */}
        <div className="lg:col-span-5 cyber-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Hypothetical Security Mitigations
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">Dynamic Evaluation</span>
          </div>

          <div className="space-y-3">
            {[
              {
                key: 'patchWebCVEs' as const,
                title: 'Patch Ingress Vulnerabilities',
                desc: 'Remediate critical CVEs (e.g. Log4j / CitrixBleed) on external web servers',
                icon: ShieldCheck,
                color: 'text-emerald-400'
              },
              {
                key: 'blockDMZToDB' as const,
                title: 'Firewall Microsegmentation',
                desc: 'Enforce strict network ACL blocking direct DMZ-to-database lateral conduits',
                icon: Lock,
                color: 'text-cyan-400'
              },
              {
                key: 'enableMFAOnDB' as const,
                title: 'Enforce MFA Authentication',
                desc: 'Require multi-factor cryptographic tokens for all administrative database access',
                icon: Key,
                color: 'text-purple-400'
              },
              {
                key: 'isolateWorkstation' as const,
                title: 'Isolate High-Risk Workstation',
                desc: 'Sever lateral SMB and RDP conduits from suspect employee machines',
                icon: Zap,
                color: 'text-amber-400'
              },
              {
                key: 'removeInternetExposure' as const,
                title: 'De-Expose Ingress Boundary',
                desc: 'Place external services behind private VPN / zero-trust perimeter',
                icon: ShieldAlert,
                color: 'text-rose-400'
              }
            ].map((item) => {
              const active = controls[item.key];
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  onClick={() => handleToggle(item.key)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    active
                      ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 mt-0.5 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <div
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                        active ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                          active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Before / After Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          {loading ? (
            <div className="cyber-card p-16 flex items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : comparison ? (
            <>
              {/* Summary Banner */}
              <div className="cyber-card p-5 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  Posture Optimization Impact
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {comparison.recommendation_summary}
                </p>
              </div>

              {/* Before vs After Metric Cards */}
              <div className="grid grid-cols-3 gap-4 font-mono">
                {/* Posture Score */}
                <div className="cyber-card p-4 text-center space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Security Posture</div>
                  <div className="flex items-center justify-center gap-2 text-base font-black">
                    <span className="text-slate-400">{comparison.original_metrics.security_posture_score}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-emerald-400 text-lg">
                      {comparison.mitigated_metrics.security_posture_score}
                    </span>
                  </div>
                  <div className="text-[9px] text-emerald-400 font-bold">
                    +{comparison.delta.posture_score_gain} pts Improvement
                  </div>
                </div>

                {/* High-Risk Paths */}
                <div className="cyber-card p-4 text-center space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">High-Risk Paths</div>
                  <div className="flex items-center justify-center gap-2 text-base font-black">
                    <span className="text-red-400">{comparison.original_metrics.high_risk_paths}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-amber-400 text-lg">
                      {comparison.mitigated_metrics.high_risk_paths}
                    </span>
                  </div>
                  <div className="text-[9px] text-emerald-400 font-bold">
                    -{comparison.delta.high_risk_reduction} Eliminated
                  </div>
                </div>

                {/* Avg Path Risk */}
                <div className="cyber-card p-4 text-center space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Average Risk</div>
                  <div className="flex items-center justify-center gap-2 text-base font-black">
                    <span className="text-slate-400">{comparison.original_metrics.average_risk_score}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-200 text-lg">
                      {comparison.mitigated_metrics.average_risk_score}
                    </span>
                  </div>
                  <div className="text-[9px] text-emerald-400 font-bold">
                    -{comparison.delta.average_risk_reduction} pts Lower
                  </div>
                </div>
              </div>

              {/* Blocked Attack Vectors List */}
              <div className="cyber-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Blocked / Eliminated Attack Vectors ({comparison.blocked_paths_count})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Simulated Control Barrier</span>
                </div>

                {comparison.blocked_paths.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {comparison.blocked_paths.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-xs font-mono text-slate-400 line-through opacity-75"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{p.join(' → ')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-mono p-4 bg-slate-950 rounded-xl text-center">
                    Toggle additional defensive controls on the left to block candidate attack vectors.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  ShieldAlert, Sparkles, RotateCcw, FileDown, Activity,
  Database, Network, Cpu, Terminal, Trash2
} from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  onOpenSyntheticModal: () => void;
  onRefreshData: () => void;
  postureScore?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSyntheticModal,
  onRefreshData,
  postureScore = 78
}) => {
  const [resetting, setResetting] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      await api.resetDemoOrg();
      onRefreshData();
    } catch (err) {
      console.error('Failed to reset demo:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setClearing(true);
      await api.clearAllNodes();
      setShowClearConfirm(false);
      onRefreshData();
    } catch (err) {
      console.error('Failed to clear all nodes:', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & System Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/30 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
          <ShieldAlert className="w-5 h-5 text-cyan-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-wider text-slate-100 uppercase font-mono">
              CyberPath <span className="text-cyan-400">AI</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              SOC DEFENSIVE ENGINE v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-md hidden md:block">
            AI-Powered Dynamic Attack Graph & Predictive Lateral Movement Simulator
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden lg:flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-slate-400">Simulated Posture:</span>
          <span
            className={`font-mono font-bold ${
              postureScore >= 75
                ? 'text-emerald-400'
                : postureScore >= 50
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {postureScore.toFixed(0)}/100
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          <span className="font-mono text-[11px]">XGB/RF ML Model Loaded</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSyntheticModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 hover:border-cyan-400 text-xs font-medium text-cyan-300 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          title="Generate a Small, Medium, or Large Synthetic Infrastructure"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Synthetic Org Generator</span>
        </button>

        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors disabled:opacity-50"
          title="Reset environment to default CyberTech Demo"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>

        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={clearing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 hover:border-red-700 text-xs text-red-300 transition-colors disabled:opacity-50"
          title="Clear all nodes and start with a blank canvas"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">Clear All Nodes</span>
        </button>

        <a
          href={api.downloadPDFUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
          title="Download Comprehensive Executive PDF Audit Report"
        >
          <FileDown className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">PDF Report</span>
        </a>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Clear All Nodes?</h3>
                <p className="text-[11px] text-slate-400">Wipe the infrastructure canvas clean</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will remove all devices, servers, and network connections from the topology, leaving you with a clean blank canvas. You can restore the default CyberTech Demo anytime with "Reset Demo".
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-red-500/20"
              >
                {clearing ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{clearing ? 'Clearing...' : 'Yes, Clear All Nodes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

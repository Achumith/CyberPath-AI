import React from 'react';
import {
  LayoutDashboard, Server, GitFork, Network, PlayCircle,
  Compass, Bot, SlidersHorizontal, Cpu, FileText, Settings, ShieldCheck, Radar, Database
} from 'lucide-react';

export type TabKey =
  | 'dashboard'
  | 'infrastructure'
  | 'packet-scanner'
  | 'cve-intel'
  | 'attack-graph'
  | 'attack-paths'
  | 'simulation'
  | 'predictive-hop'
  | 'ai-analyst'
  | 'what-if'
  | 'gnn-lab'
  | 'reports';

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  highRiskCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  highRiskCount = 0
}) => {
  const navItems = [
    { key: 'dashboard' as TabKey, label: 'SOC Dashboard', icon: LayoutDashboard, badge: null },
    { key: 'infrastructure' as TabKey, label: 'Asset Builder', icon: Server, badge: null },
    { key: 'packet-scanner' as TabKey, label: 'Packet Scanner', icon: Radar, badge: 'Cisco', badgeColor: 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40' },
    { key: 'cve-intel' as TabKey, label: 'CVE Intelligence', icon: Database, badge: 'CISA KEV', badgeColor: 'bg-red-950/80 text-red-300 border border-red-800/60' },
    { key: 'attack-graph' as TabKey, label: 'Attack Graph', icon: Network, badge: null },
    { key: 'attack-paths' as TabKey, label: 'Attack Paths', icon: GitFork, badge: highRiskCount > 0 ? `${highRiskCount} High` : null, badgeColor: 'bg-red-950/80 text-red-400 border border-red-800/60' },
    { key: 'simulation' as TabKey, label: 'Attack Simulation', icon: PlayCircle, badge: 'Live' },
    { key: 'predictive-hop' as TabKey, label: 'Predictive Next-Step', icon: Compass, badge: 'ML' },
    { key: 'ai-analyst' as TabKey, label: 'AI Analyst', icon: Bot, badge: 'AI' },
    { key: 'what-if' as TabKey, label: 'What-If Analysis', icon: SlidersHorizontal, badge: null },
    { key: 'gnn-lab' as TabKey, label: 'Graph AI Lab', icon: Cpu, badge: 'GNN' },
    { key: 'reports' as TabKey, label: 'Executive Report', icon: FileText, badge: null },
  ];


  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/90 flex flex-col justify-between select-none shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono tracking-wider text-slate-500 uppercase font-semibold">
          Core Threat Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-cyan-300 border-l-2 border-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-mono rounded-md ${
                    item.badgeColor ||
                    (item.badge === 'AI' || item.badge === 'GNN' || item.badge === 'ML'
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400')
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Defensive Simulation Notice */}
      <div className="p-4 m-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 text-cyan-400 mb-1 font-semibold text-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Defensive Simulation</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Synthetic topological modeling for educational and posture evaluation only.
        </p>
      </div>
    </aside>
  );
};

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Globe, Server, Database, Shield, Monitor, Key, HardDrive,
  Cpu, Lock, AlertTriangle, CheckCircle, Terminal
} from 'lucide-react';

const getNodeIcon = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t === 'internet') return <Globe className="w-4 h-4 text-cyan-400" />;
  if (t === 'firewall' || t === 'router') return <Shield className="w-4 h-4 text-amber-400" />;
  if (t.includes('web')) return <Server className="w-4 h-4 text-emerald-400" />;
  if (t.includes('app') || t.includes('server')) return <Cpu className="w-4 h-4 text-blue-400" />;
  if (t.includes('database')) return <Database className="w-4 h-4 text-rose-400" />;
  if (t.includes('workstation') || t.includes('pc')) return <Monitor className="w-4 h-4 text-slate-300" />;
  if (t.includes('domain controller') || t.includes('admin')) return <Key className="w-4 h-4 text-purple-400" />;
  if (t.includes('sensitive') || t.includes('vault')) return <Lock className="w-4 h-4 text-red-400" />;
  return <HardDrive className="w-4 h-4 text-slate-400" />;
};

export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as any;
  const isInternet = (nodeData.type || '').toLowerCase() === 'internet';
  const riskColor = nodeData.risk_color || '#38bdf8';
  const maxCvss = nodeData.max_cvss || 0;
  const isSimulationActive = Boolean(nodeData.isSimulationActive);
  const isPathHighlighted = Boolean(nodeData.isPathHighlighted);

  return (
    <div
      className={`relative min-w-[210px] max-w-[260px] rounded-xl px-3.5 py-3 transition-all duration-200 ${
        isSimulationActive
          ? 'ring-2 ring-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)] scale-105 bg-slate-900/95 border-red-500'
          : isPathHighlighted
          ? 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.5)] bg-slate-900/95 border-cyan-400'
          : selected
          ? 'ring-2 ring-cyan-400 border-cyan-400 bg-slate-900/95'
          : 'bg-slate-900/90 border border-slate-700/60 hover:border-slate-500'
      }`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: riskColor
      }}
    >
      {/* React Flow Source & Target Handles */}
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-2 !h-2" />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <div className="p-1 rounded-md bg-slate-800/80 border border-slate-700/50">
            {getNodeIcon(nodeData.type)}
          </div>
          <span className="text-xs font-semibold text-slate-200 truncate" title={nodeData.name || nodeData.label}>
            {nodeData.name || nodeData.label}
          </span>
        </div>
        {nodeData.internet_exposed && (
          <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            EXT
          </span>
        )}
      </div>

      {/* Subtitle / Type & Zone */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
        <span>{nodeData.type || 'Asset'}</span>
        <span className="text-slate-400 font-mono text-[9px]">{nodeData.zone || 'Internal'}</span>
      </div>

      {/* Badges / Metrics Row */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px]">
        <div className="flex items-center gap-1">
          {maxCvss > 0 ? (
            <span
              className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                maxCvss >= 9
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : maxCvss >= 7
                  ? 'bg-orange-950 text-orange-300 border border-orange-800'
                  : 'bg-yellow-950 text-yellow-300 border border-yellow-800'
              }`}
            >
              CVSS {maxCvss.toFixed(1)}
            </span>
          ) : (
            <span className="text-emerald-400 text-[9px] font-mono">0 CVE</span>
          )}
        </div>

        <span
          className={`px-1.5 py-0.5 rounded text-[9px] font-medium capitalize ${
            nodeData.criticality === 'Critical'
              ? 'text-red-400 bg-red-950/40'
              : nodeData.criticality === 'High'
              ? 'text-orange-400 bg-orange-950/40'
              : 'text-slate-400 bg-slate-800/40'
          }`}
        >
          {nodeData.criticality || 'Medium'}
        </span>
      </div>

      {isSimulationActive && (
        <div className="absolute -top-2 -right-2 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[8px] font-bold text-white items-center justify-center">
            !
          </span>
        </div>
      )}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

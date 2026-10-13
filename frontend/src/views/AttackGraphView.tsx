import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Node, Edge, MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Network, Search, Filter, Shield, AlertTriangle, Layers,
  Server, Database, Lock, Key, ArrowRight, Eye, RefreshCw, X, RotateCcw, Trash2
} from 'lucide-react';
import { CustomNode } from '../components/CustomNode';
import { api } from '../services/api';
import { Asset } from '../types';

const nodeTypes = {
  custom: CustomNode,
};

interface AttackGraphViewProps {
  highlightedPathNodes?: string[];
  onClearHighlight?: () => void;
  onSimulateFromNode?: (nodeId: string) => void;
}

export const AttackGraphView: React.FC<AttackGraphViewProps> = ({
  highlightedPathNodes = [],
  onClearHighlight,
  onSimulateFromNode
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedRiskTier, setSelectedRiskTier] = useState<string>('All');
  
  // Selected Node Inspector
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [clearing, setClearing] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const data = await api.getGraphData();
      
      // Compute automatic layout coordinates for nodes
      // Zone ordering: External -> DMZ -> Internal -> Management -> Secure Zone
      const zoneColumns: Record<string, number> = {
        'External': 50,
        'DMZ': 320,
        'Internal': 620,
        'Internal LAN': 620,
        'Management': 920,
        'Management Zone': 920,
        'Secure Zone': 1220,
        'Cloud': 620
      };

      const zoneCounters: Record<string, number> = {};

      const flowNodes: Node[] = data.nodes.map((n: any) => {
        const zone = n.data.zone || 'Internal';
        const colX = zoneColumns[zone] || 620;
        const rowIndex = zoneCounters[zone] || 0;
        zoneCounters[zone] = rowIndex + 1;
        const posY = 80 + (rowIndex * 130);

        const isHighlighted = highlightedPathNodes.includes(n.id);

        return {
          id: n.id,
          type: 'custom',
          position: { x: colX, y: posY },
          data: {
            ...n.data,
            isPathHighlighted: isHighlighted
          }
        };
      });

      const flowEdges: Edge[] = data.edges.map((e: any, idx: number) => {
        const isPathEdge =
          highlightedPathNodes.length > 1 &&
          highlightedPathNodes.includes(e.source) &&
          highlightedPathNodes.includes(e.target) &&
          highlightedPathNodes.indexOf(e.target) === highlightedPathNodes.indexOf(e.source) + 1;

        return {
          id: e.id || `edge-${idx}`,
          source: e.source,
          target: e.target,
          type: 'smoothstep',
          animated: isPathEdge || !e.data?.blocked,
          style: {
            stroke: isPathEdge ? '#00f0ff' : e.data?.blocked ? '#64748b' : '#38bdf8',
            strokeWidth: isPathEdge ? 3 : 1.5,
            strokeDasharray: e.data?.blocked ? '4,4' : undefined
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isPathEdge ? '#00f0ff' : '#38bdf8',
            width: 14,
            height: 14
          },
          data: e.data
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setClearing(true);
      await api.clearAllNodes();
      setShowClearConfirm(false);
      setSelectedNodeData(null);
      await fetchGraph();
    } catch (err) {
      console.error('Failed to clear graph nodes:', err);
    } finally {
      setClearing(false);
    }
  };

  const handleRestoreDemo = async () => {
    try {
      setLoading(true);
      await api.resetDemoOrg();
      await fetchGraph();
    } catch (err) {
      console.error('Failed to restore demo org:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [highlightedPathNodes]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeData(node.data);
  }, []);

  // Filtered nodes based on search & zones
  const displayedNodes = useMemo(() => {
    return nodes.map((n) => {
      const data = n.data as any;
      const matchesSearch =
        data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.type?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesZone = selectedZone === 'All' || data.zone === selectedZone;
      const matchesRisk = selectedRiskTier === 'All' || data.risk_tier === selectedRiskTier;

      const isHidden = !matchesSearch || !matchesZone || !matchesRisk;
      return {
        ...n,
        hidden: isHidden
      };
    });
  }, [nodes, searchTerm, selectedZone, selectedRiskTier]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col relative overflow-hidden bg-slate-950">
      {/* Top Filter and Controls Bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200 uppercase">
            <Network className="w-4 h-4 text-cyan-400" />
            Attack Graph Topology
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Zone Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-mono text-[11px]">Zone:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
            >
              <option value="All">All Zones</option>
              <option value="External">External</option>
              <option value="DMZ">DMZ</option>
              <option value="Internal">Internal</option>
              <option value="Management">Management</option>
              <option value="Secure Zone">Secure Zone</option>
            </select>
          </div>

          {/* Risk Tier Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-mono text-[11px]">Risk:</span>
            <select
              value={selectedRiskTier}
              onChange={(e) => setSelectedRiskTier(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
            >
              <option value="All">All Tiers</option>
              <option value="Critical">Critical Only</option>
              <option value="High">High Only</option>
              <option value="Medium">Medium Only</option>
              <option value="Low">Low Only</option>
            </select>
          </div>
        </div>

        {/* Highlight Banner / Action */}
        <div className="flex items-center gap-3">
          {highlightedPathNodes.length > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
              <span>Path: {highlightedPathNodes.length} nodes highlighted</span>
              {onClearHighlight && (
                <button onClick={onClearHighlight} className="hover:text-cyan-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {nodes.length > 0 ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-xs font-medium text-red-300 transition-colors"
              title="Clear all nodes from the attack graph"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Clear Canvas</span>
            </button>
          ) : (
            <button
              onClick={handleRestoreDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 text-xs font-medium text-cyan-300 transition-colors"
              title="Restore CyberTech Demo"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Restore Demo</span>
            </button>
          )}

          <button
            onClick={fetchGraph}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Graph Layout"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <ReactFlow
            nodes={displayedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            className="bg-slate-950"
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(node: any) => node.data?.risk_color || '#38bdf8'}
              maskColor="rgba(15, 23, 42, 0.7)"
              className="!bg-slate-900 !border-slate-800 rounded-xl"
            />
          </ReactFlow>
        )}

        {/* Empty Canvas Overlay */}
        {!loading && nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 z-20 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Network className="w-8 h-8 opacity-70" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Attack Graph Canvas is Empty</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              All infrastructure nodes have been cleared. Build a custom network topology in the <strong>Asset Builder</strong>, 1-click provision nodes in the <strong>Packet Scanner</strong>, or restore the pre-configured enterprise demo.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleRestoreDemo}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Restore CyberTech Demo
              </button>
            </div>
          </div>
        )}

        {/* Zone Column Legend Labels (Overlay) */}
        {nodes.length > 0 && (
          <div className="absolute top-4 left-6 pointer-events-none flex gap-32 text-[10px] font-mono text-slate-400/80 uppercase font-semibold">
            <span className="px-2 py-1 bg-slate-900/60 rounded border border-slate-800">External Threat Surface</span>
            <span className="px-2 py-1 bg-slate-900/60 rounded border border-slate-800">DMZ Perimeter</span>
            <span className="px-2 py-1 bg-slate-900/60 rounded border border-slate-800">Internal Core Tier</span>
            <span className="px-2 py-1 bg-slate-900/60 rounded border border-slate-800">Privileged AD Tier</span>
            <span className="px-2 py-1 bg-slate-900/60 rounded border border-slate-800">Secure Data Vault</span>
          </div>
        )}

        {/* Selected Node Inspector Drawer */}
        {selectedNodeData && (
          <div className="absolute top-4 right-4 w-96 cyber-card p-5 z-30 shadow-2xl animate-in slide-in-from-right max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                  Asset Telemetry Inspector
                </span>
                <h3 className="text-sm font-bold text-slate-100">{selectedNodeData.name}</h3>
                <div className="text-xs text-slate-400 font-mono">
                  {selectedNodeData.type} • {selectedNodeData.zone}
                </div>
              </div>
              <button
                onClick={() => setSelectedNodeData(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
              <div>
                <span className="text-slate-500">Criticality:</span>{' '}
                <span
                  className={`font-semibold ${
                    selectedNodeData.criticality === 'Critical'
                      ? 'text-red-400'
                      : selectedNodeData.criticality === 'High'
                      ? 'text-orange-400'
                      : 'text-slate-300'
                  }`}
                >
                  {selectedNodeData.criticality}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Privilege:</span>{' '}
                <span className="text-slate-300">{selectedNodeData.privilege_level}</span>
              </div>
              <div>
                <span className="text-slate-500">OS:</span>{' '}
                <span className="text-slate-300 truncate">{selectedNodeData.os}</span>
              </div>
              <div>
                <span className="text-slate-500">Exposure:</span>{' '}
                <span className={selectedNodeData.internet_exposed ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
                  {selectedNodeData.internet_exposed ? 'Direct External' : 'Internal Only'}
                </span>
              </div>
            </div>

            {/* Vulnerabilities Section */}
            <div className="mb-4">
              <div className="text-xs font-mono font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>Vulnerabilities ({selectedNodeData.vulnerabilities?.length || 0})</span>
                {selectedNodeData.max_cvss > 0 && (
                  <span className="text-red-400 font-mono text-[11px]">
                    Peak CVSS {selectedNodeData.max_cvss}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {selectedNodeData.vulnerabilities && selectedNodeData.vulnerabilities.length > 0 ? (
                  selectedNodeData.vulnerabilities.map((v: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-cyan-300">{v.identifier}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                          CVSS {v.cvss}
                        </span>
                      </div>
                      <div className="text-slate-200 font-medium text-[11px]">{v.title}</div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{v.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-emerald-400/80 font-mono p-2 bg-emerald-950/20 rounded-lg border border-emerald-900/40">
                    No weaponizable CVEs detected on this asset.
                  </div>
                )}
              </div>
            </div>

            {/* Security Controls */}
            {selectedNodeData.security_controls && selectedNodeData.security_controls.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-mono font-bold text-slate-300 mb-1.5">Active Defenses</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNodeData.security_controls.map((c: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-950 border border-slate-700 text-slate-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {onSimulateFromNode && (
              <button
                onClick={() => onSimulateFromNode(selectedNodeData.id)}
                className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Launch Attack Simulation from this Node
              </button>
            )}
          </div>
        )}
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
                <h3 className="text-sm font-bold text-slate-100">Clear Attack Graph?</h3>
                <p className="text-[11px] text-slate-400">Wipe the infrastructure canvas clean</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will remove all {nodes.length} devices, servers, and network conduits from the graph. You can restore the default CyberTech Demo anytime with "Restore Demo".
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
    </div>
  );
};

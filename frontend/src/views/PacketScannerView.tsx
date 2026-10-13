import React, { useState, useEffect } from 'react';
import {
  Radar, Play, ShieldAlert, CheckCircle2, XCircle, AlertTriangle,
  Server, Cpu, Database, Network, Globe, Plus, ArrowRight,
  Filter, RefreshCw, Send, Layers, HelpCircle, HardDrive, Shield
} from 'lucide-react';
import { api } from '../services/api';
import { Asset, ScanResultResponse, ScanFinding, PacketTraceEvent, DeviceTemplate } from '../types';

export const PacketScannerView: React.FC<{
  onInspectInGraph?: (nodes: string[]) => void;
  onRefreshGlobal?: () => void;
}> = ({ onInspectInGraph, onRefreshGlobal }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [deviceTemplates, setDeviceTemplates] = useState<DeviceTemplate[]>([]);
  const [selectedScannerId, setSelectedScannerId] = useState<string>('');
  const [scanProfile, setScanProfile] = useState<string>('Full Vulnerability Audit');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResultResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  // Quick Provision Modal State
  const [showProvisionModal, setShowProvisionModal] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DeviceTemplate | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [customIp, setCustomIp] = useState<string>('');
  const [connectToId, setConnectToId] = useState<string>('');
  const [provisionPort, setProvisionPort] = useState<number>(443);
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [assetsData, catalogData] = await Promise.all([
        api.getAssets(),
        api.getScannerCatalog()
      ]);
      setAssets(assetsData);
      setDeviceTemplates(catalogData.device_templates);

      // Default scanner candidate: prefer internet or firewall or first
      if (!selectedScannerId && assetsData.length > 0) {
        const preferred = assetsData.find(a => a.type.toLowerCase().includes('scanner') || a.type.toLowerCase() === 'internet' || a.internet_exposed);
        setSelectedScannerId(preferred ? preferred.id : assetsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load assets or scanner catalog:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunScan = async () => {
    try {
      setIsScanning(true);
      setApplyMessage(null);
      const res = await api.runPacketScan(selectedScannerId, undefined, scanProfile);
      setScanResult(res);
    } catch (err) {
      console.error('Packet scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyFindings = async () => {
    if (!scanResult || scanResult.findings.length === 0) return;
    try {
      setIsApplying(true);
      const res = await api.applyScanFindings(scanResult.findings);
      setApplyMessage(res.message);
      if (onRefreshGlobal) onRefreshGlobal();
      fetchData();
    } catch (err) {
      console.error('Failed to apply scan findings:', err);
      setApplyMessage('Failed to commit scan findings.');
    } finally {
      setIsApplying(false);
    }
  };

  const openProvisionModal = (template: DeviceTemplate) => {
    setSelectedTemplate(template);
    setCustomName(`${template.name}-${Math.floor(10 + Math.random() * 90)}`);
    setCustomIp(`10.0.${assets.length + 15}.${Math.floor(2 + Math.random() * 250)}`);
    setConnectToId(assets.length > 0 ? assets[0].id : '');
    setProvisionPort(template.default_ports ? template.default_ports[0] : 443);
    setShowProvisionModal(true);
  };

  const handleProvisionDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    try {
      setIsProvisioning(true);
      await api.provisionDevice(
        selectedTemplate.key,
        customName,
        customIp,
        connectToId || undefined,
        provisionPort
      );
      setShowProvisionModal(false);
      await fetchData();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      console.error('Device provisioning failed:', err);
    } finally {
      setIsProvisioning(false);
    }
  };

  // Filtered findings
  const filteredFindings = scanResult
    ? scanResult.findings.filter((f) => {
        if (filterStatus === 'All') return true;
        if (filterStatus === 'Reachable') return f.reachable;
        if (filterStatus === 'Filtered') return !f.reachable;
        if (filterStatus === 'Vulnerable') return f.vulnerability_count > 0;
        return true;
      })
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Radar className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Network Packet Scanner & Cisco Packet Tracer Prober
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  Cisco Mode
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Simulate hop-by-hop packet routing, firewall stateful drops, service banner discovery, and automated CVE correlation.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRunScan()}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{isScanning ? 'Probing Infrastructure...' : 'Run Packet Scan'}</span>
          </button>

          {scanResult && scanResult.cves_found_count > 0 && (
            <button
              onClick={handleApplyFindings}
              disabled={isApplying}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isApplying ? 'Applying...' : 'Sync Findings to Attack Graph'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {applyMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{applyMessage} Attack graph models and ML paths have been dynamically updated!</span>
        </div>
      )}

      {/* Control Bar & Device Shelf (Packet Tracer Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scan Configuration Controls */}
        <div className="lg:col-span-1 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            Scanner & Packet Parameters
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Originating Scanner Node</label>
              <select
                value={selectedScannerId}
                onChange={(e) => setSelectedScannerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type} - {a.zone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Scan Profile</label>
              <select
                value={scanProfile}
                onChange={(e) => setScanProfile(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Full Vulnerability Audit">Full Multi-Hop SYN & Service Audit</option>
                <option value="Quick TCP Port Sweep">Quick TCP SYN Port Sweep</option>
                <option value="Perimeter Penetration Probe">Perimeter Penetration Probe</option>
              </select>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 space-y-1">
              <p>• <strong>Packet Routing:</strong> Evaluates firewalls & ACLs hop-by-hop.</p>
              <p>• <strong>Port Discovery:</strong> Probes TCP 80, 443, 22, 5432, 3389, 445.</p>
              <p>• <strong>CVE Catalog:</strong> Matches running software versions against known CVEs.</p>
            </div>
          </div>
        </div>

        {/* Right: Cisco Device Template Shelf */}
        <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Quick-Add Systems & Servers (Packet Tracer Shelf)
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">1-Click Provision & Wire</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {deviceTemplates.map((tmpl) => (
              <button
                key={tmpl.key}
                onClick={() => openProvisionModal(tmpl)}
                className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-2 group-hover:bg-cyan-500/20 group-hover:scale-105 transition-all">
                    {tmpl.type.includes('Server') && <Server className="w-4 h-4" />}
                    {tmpl.type.includes('Database') && <Database className="w-4 h-4" />}
                    {tmpl.type.includes('Firewall') && <Shield className="w-4 h-4" />}
                    {tmpl.type.includes('Workstation') && <HardDrive className="w-4 h-4" />}
                    {tmpl.type.includes('Controller') && <Cpu className="w-4 h-4" />}
                    {tmpl.type.includes('Scanner') && <Radar className="w-4 h-4" />}
                  </div>
                  <div className="font-semibold text-xs text-slate-200 truncate">{tmpl.name.split('-')[0]}</div>
                  <div className="text-[10px] text-slate-400 truncate">{tmpl.type}</div>
                </div>
                <div className="mt-2 text-[9px] text-cyan-400 flex items-center gap-1 font-mono">
                  <Plus className="w-3 h-3" /> Add Device
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Scorecards if scan ran */}
      {scanResult && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Hosts Scanned</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{scanResult.hosts_scanned}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Total targets probed</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Reachable Hosts</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{scanResult.hosts_reachable}</div>
            <div className="text-[11px] text-emerald-500/80 mt-0.5">SYN-ACK verified</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Filtered by Firewalls</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{scanResult.hosts_filtered}</div>
            <div className="text-[11px] text-blue-500/80 mt-0.5">Dropped at perimeter</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Open Ports Found</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">{scanResult.open_ports_found}</div>
            <div className="text-[11px] text-yellow-500/80 mt-0.5">Services exposed</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Weaponizable CVEs</div>
            <div className="text-2xl font-bold text-red-400 mt-1">{scanResult.cves_found_count}</div>
            <div className="text-[11px] text-red-500/80 mt-0.5">Matched from catalog</div>
          </div>
        </div>
      )}

      {/* Packet Tracer Simulation Event Table */}
      {scanResult && scanResult.packet_traces.length > 0 && (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Cisco Simulation Mode: Packet Trace Events
              </h2>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {scanResult.packet_traces.length} Probes Executed
            </div>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Packet ID</th>
                  <th className="py-2.5 px-4">Protocol</th>
                  <th className="py-2.5 px-4">Source Host</th>
                  <th className="py-2.5 px-4">Destination Target</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Event Diagnostic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scanResult.packet_traces.map((pkt) => (
                  <tr key={pkt.packet_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-4 text-cyan-400 font-bold">{pkt.packet_id}</td>
                    <td className="py-2 px-4 text-slate-300">{pkt.protocol}</td>
                    <td className="py-2 px-4 text-slate-400 truncate max-w-[150px]">{pkt.source}</td>
                    <td className="py-2 px-4 text-slate-200 truncate max-w-[150px]">{pkt.destination}</td>
                    <td className="py-2 px-4">
                      {pkt.status === 'DELIVERED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Delivered
                        </span>
                      )}
                      {pkt.status === 'FILTERED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950/80 text-blue-400 border border-blue-800/80 flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> Filtered Drop
                        </span>
                      )}
                      {pkt.status === 'VULNERABILITIES_DETECTED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-950/80 text-red-400 border border-red-800/80 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> Vulnerable
                        </span>
                      )}
                      {pkt.status === 'CLEAN_SERVICES' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 w-fit">
                          Clean Banner
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-slate-400 text-[11px] truncate max-w-[320px]">
                      {pkt.event_description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discovered Vulnerability Inspection Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Target Vulnerability Audit & Service Findings
            </h2>
            <p className="text-xs text-slate-400">
              Correlated vulnerability findings discovered on reachable devices through packet probing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {['All', 'Vulnerable', 'Reachable', 'Filtered'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === tab
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/20 rounded-2xl border border-slate-800/80 text-slate-500 text-xs">
            {scanResult ? 'No hosts match current filter criteria.' : 'Click "Run Packet Scan" above to probe the network.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFindings.map((finding) => (
              <div
                key={finding.target_id}
                className={`p-5 rounded-2xl border transition-all ${
                  finding.security_status === 'CRITICAL'
                    ? 'bg-red-950/20 border-red-900/60'
                    : finding.security_status === 'HIGH'
                    ? 'bg-orange-950/20 border-orange-900/60'
                    : finding.reachable
                    ? 'bg-slate-900/40 border-slate-800'
                    : 'bg-blue-950/15 border-blue-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-200">{finding.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {finding.ip_address}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {finding.type} • Zone: <span className="text-slate-300">{finding.zone}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider ${
                      finding.security_status === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : finding.security_status === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : finding.reachable
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {finding.security_status}
                  </span>
                </div>

                {/* Packet Path */}
                <div className="mt-3 text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
                  <Network className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-slate-500">Route:</span>
                  <span className="truncate text-slate-300">
                    {finding.reachable ? finding.path_taken.join(' → ') : 'Packet dropped at firewall boundary'}
                  </span>
                </div>

                {/* Open Ports & Services */}
                {finding.reachable && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono mr-1">Open Ports:</span>
                    {finding.open_ports.map((port) => (
                      <span
                        key={port}
                        className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-[10px] font-mono"
                      >
                        TCP {port}
                      </span>
                    ))}
                  </div>
                )}

                {/* Discovered CVEs */}
                <div className="mt-4 space-y-2">
                  {finding.discovered_cves.length > 0 ? (
                    finding.discovered_cves.map((cve) => (
                      <div
                        key={cve.identifier}
                        className="p-3 rounded-xl bg-slate-950/80 border border-red-900/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-red-400">
                            {cve.identifier}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-800">
                            CVSS {cve.cvss} ({cve.severity})
                          </span>
                        </div>
                        <div className="text-xs text-slate-200 font-medium">{cve.title}</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{cve.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>No known unpatched CVEs found on open services.</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Provision Device Modal */}
      {showProvisionModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Provision {selectedTemplate.name}
              </h3>
              <button
                onClick={() => setShowProvisionModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionDevice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Device Hostname</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">IP Address</label>
                <input
                  type="text"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Connect / Wire to Existing Host</label>
                <select
                  value={connectToId}
                  onChange={(e) => setConnectToId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Standalone (Unconnected) --</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Connection Port</label>
                <input
                  type="number"
                  value={provisionPort}
                  onChange={(e) => setProvisionPort(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div><strong>Default Services:</strong> {selectedTemplate.services.join(', ') || 'None'}</div>
                <div><strong>Zone:</strong> {selectedTemplate.zone}</div>
                <div><strong>Criticality:</strong> {selectedTemplate.criticality}</div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 disabled:opacity-50"
                >
                  {isProvisioning ? 'Deploying...' : 'Deploy to Network'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

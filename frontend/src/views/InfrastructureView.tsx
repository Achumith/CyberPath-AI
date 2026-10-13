import React, { useState, useEffect } from 'react';
import {
  Server, Plus, Trash2, Link as LinkIcon, Search, Shield,
  Database, Monitor, Lock, AlertTriangle, Key, Cpu, Globe,
  CheckCircle2, RefreshCw
} from 'lucide-react';
import { Asset, Vulnerability } from '../types';
import { api } from '../services/api';

const ASSET_TYPES = [
  'Web Server',
  'Application Server',
  'Database',
  'Workstation',
  'Admin PC',
  'Domain Controller',
  'Firewall',
  'Router',
  'Sensitive Data',
  'Cloud Resource'
];

const PRESET_CVES = [
  { identifier: 'CVE-2021-44228', title: 'Apache Log4j RCE (Log4Shell)', severity: 'Critical', cvss: 10.0, description: 'Remote code execution via JNDI injection.' },
  { identifier: 'CVE-2022-22965', title: 'Spring Framework RCE (Spring4Shell)', severity: 'Critical', cvss: 9.8, description: 'Class loader manipulation via DataBinder.' },
  { identifier: 'CVE-2020-1472', title: 'Zerologon Netlogon Privilege Escalation', severity: 'Critical', cvss: 10.0, description: 'Netlogon authentication bypass.' },
  { identifier: 'CVE-2023-38606', title: 'OpenSSH Privilege Escalation', severity: 'High', cvss: 8.1, description: 'Local privilege escalation vulnerability.' },
  { identifier: 'CVE-2024-21413', title: 'Microsoft Outlook Moniker RCE', severity: 'Critical', cvss: 9.8, description: 'NTLM hash leak and remote code execution.' },
  { identifier: 'CVE-2023-4966', title: 'Citrix Bleed Buffer Overflow', severity: 'Critical', cvss: 9.4, description: 'Session token exposure leading to auth bypass.' }
];

export const InfrastructureView: React.FC<{ onDataChanged: () => void }> = ({ onDataChanged }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  
  // Create Asset Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    os: string;
    criticality: string;
    internet_exposed: boolean;
    privilege_level: string;
    zone: string;
    ip_address: string;
    services: string;
    security_controls: string[];
    selectedCVEs: string[];
  }>({
    name: '',
    type: 'Web Server',
    os: 'Ubuntu Linux 22.04',
    criticality: 'Medium',
    internet_exposed: false,
    privilege_level: 'User',
    zone: 'Internal',
    ip_address: '10.0.10.15',
    services: 'HTTPS (443), SSH (22)',
    security_controls: ['EDR Agent'],
    selectedCVEs: []
  });

  // Connect Form State
  const [connectData, setConnectData] = useState({
    source: '',
    target: '',
    connection_type: 'Network',
    port: 443,
    protocol: 'TCP',
    authentication_required: false,
    privilege_required: 'None'
  });

  const [clearing, setClearing] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await api.getAssets();
      setAssets(data);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setClearing(true);
      await api.clearAllNodes();
      setShowClearConfirm(false);
      await fetchAssets();
      onDataChanged();
    } catch (err) {
      console.error('Failed to clear nodes:', err);
    } finally {
      setClearing(false);
    }
  };

  const handleRestoreDemo = async () => {
    try {
      setLoading(true);
      await api.resetDemoOrg();
      await fetchAssets();
      onDataChanged();
    } catch (err) {
      console.error('Failed to restore demo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vulns: Vulnerability[] = formData.selectedCVEs.map((cveId) => {
        const preset = PRESET_CVES.find((p) => p.identifier === cveId);
        return {
          id: `vuln-${Math.random().toString(36).substring(7)}`,
          identifier: preset ? preset.identifier : cveId,
          title: preset ? preset.title : 'Custom Vulnerability',
          severity: preset ? preset.severity : 'High',
          cvss: preset ? preset.cvss : 7.5,
          description: preset ? preset.description : 'Simulated flaw'
        };
      });

      const servicesArray = formData.services.split(',').map((s) => s.trim()).filter(Boolean);

      await api.createAsset({
        name: formData.name || `Asset-${Math.floor(Math.random() * 900) + 100}`,
        type: formData.type,
        os: formData.os,
        criticality: formData.criticality,
        internet_exposed: formData.internet_exposed,
        privilege_level: formData.privilege_level,
        zone: formData.zone,
        ip_address: formData.ip_address,
        services: servicesArray,
        security_controls: formData.security_controls,
        vulnerabilities: vulns
      });

      setShowAddModal(false);
      fetchAssets();
      onDataChanged();
    } catch (err) {
      console.error('Failed to create asset:', err);
    }
  };

  const handleConnectAssets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectData.source || !connectData.target || connectData.source === connectData.target) {
      alert('Please select valid distinct source and target nodes.');
      return;
    }
    try {
      await api.createConnection({
        source: connectData.source,
        target: connectData.target,
        connection_type: connectData.connection_type,
        port: connectData.port,
        protocol: connectData.protocol,
        authentication_required: connectData.authentication_required,
        privilege_required: connectData.privilege_required
      });
      setShowConnectModal(false);
      onDataChanged();
      alert('Assets connected successfully!');
    } catch (err) {
      console.error('Failed to connect assets:', err);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await api.deleteAsset(assetId);
      fetchAssets();
      onDataChanged();
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  };

  // Filter assets
  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.ip_address && a.ip_address.includes(searchTerm));
    const matchesZone = selectedZone === 'All' || a.zone === selectedZone;
    return matchesSearch && matchesZone;
  });

  const zones = ['All', ...Array.from(new Set(assets.map((a) => a.zone).filter(Boolean)))];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with Search and Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Infrastructure & Asset Builder
          </h2>
          <p className="text-xs text-slate-400">
            Define simulated hosts, enterprise servers, security controls, and network trust relationships
          </p>
        </div>

        <div className="flex items-center gap-3">
          {assets.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-800/60 hover:border-red-700 text-xs font-medium text-red-300 transition-colors flex items-center gap-2"
              title="Clear all nodes and start with a blank canvas"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              Clear All Nodes
            </button>
          )}

          <button
            onClick={() => setShowConnectModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:text-cyan-300 transition-colors flex items-center gap-2"
          >
            <LinkIcon className="w-4 h-4 text-cyan-400" />
            Connect Assets
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Asset
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by asset name, type, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Zone Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-mono">Filter Zone:</span>
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                selectedZone === zone
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)] font-semibold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid / Table */}
      {loading ? (
        <div className="flex justify-center p-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      ) : assets.length === 0 ? (
        <div className="cyber-card p-12 text-center space-y-4 border border-dashed border-slate-800 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <Server className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-slate-200">Infrastructure Canvas is Empty</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            All nodes have been cleared. You now have a clean blank canvas to build your own custom network topology, or you can restore the pre-configured CyberTech Demo anytime.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" /> Add First Asset
            </button>
            <button
              onClick={handleRestoreDemo}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" /> Restore CyberTech Demo
            </button>
          </div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="cyber-card p-8 text-center text-slate-500 text-xs">
          No assets match your search or filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const maxCvss = Math.max(...asset.vulnerabilities.map((v) => v.cvss), 0);
            return (
              <div
                key={asset.id}
                className="cyber-card p-4 flex flex-col justify-between hover:border-slate-600 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                        {asset.type.includes('Database') ? (
                          <Database className="w-4 h-4 text-rose-400" />
                        ) : asset.type.includes('Workstation') ? (
                          <Monitor className="w-4 h-4 text-slate-300" />
                        ) : asset.type.includes('Domain') ? (
                          <Key className="w-4 h-4 text-purple-400" />
                        ) : asset.type.includes('Firewall') ? (
                          <Shield className="w-4 h-4 text-amber-400" />
                        ) : asset.type.includes('Sensitive') ? (
                          <Lock className="w-4 h-4 text-red-400" />
                        ) : asset.internet_exposed ? (
                          <Globe className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Server className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {asset.name}
                        </h4>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {asset.type} • {asset.zone}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Attributes */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                    <div>
                      <span className="text-slate-500">OS:</span>{' '}
                      <span className="text-slate-300 truncate">{asset.os}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">IP:</span>{' '}
                      <span className="text-slate-300 font-mono">{asset.ip_address || '10.0.0.x'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Privilege:</span>{' '}
                      <span className="text-slate-300">{asset.privilege_level}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Criticality:</span>{' '}
                      <span
                        className={`font-semibold ${
                          asset.criticality === 'Critical'
                            ? 'text-red-400'
                            : asset.criticality === 'High'
                            ? 'text-orange-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {asset.criticality}
                      </span>
                    </div>
                  </div>

                  {/* Vulnerabilities List */}
                  <div className="space-y-1 mb-2">
                    <div className="text-[10px] text-slate-400 font-mono font-semibold flex items-center justify-between">
                      <span>Simulated Vulnerabilities:</span>
                      <span className="text-slate-400">{asset.vulnerabilities.length} CVEs</span>
                    </div>
                    {asset.vulnerabilities.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {asset.vulnerabilities.map((v, i) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                              v.cvss >= 9
                                ? 'bg-red-950/90 text-red-300 border border-red-800'
                                : v.cvss >= 7
                                ? 'bg-orange-950/90 text-orange-300 border border-orange-800'
                                : 'bg-yellow-950/90 text-yellow-300 border border-yellow-800'
                            }`}
                            title={v.description}
                          >
                            {v.identifier} ({v.cvss})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> No vulnerabilities detected
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer status */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{asset.services?.length || 0} active services</span>
                  {asset.internet_exposed && (
                    <span className="text-cyan-400 font-bold">INTERNET EXPOSED</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-100 mb-4 font-mono">
              Add New Infrastructure Asset
            </h3>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Asset Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DMZ-Web-Server-02"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Asset Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    {ASSET_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Operating System</label>
                  <input
                    type="text"
                    value={formData.os}
                    onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">IP Address</label>
                  <input
                    type="text"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Network Zone</label>
                  <select
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="DMZ">DMZ</option>
                    <option value="Internal">Internal LAN</option>
                    <option value="Management">Management Zone</option>
                    <option value="Secure Zone">Secure Data Zone</option>
                    <option value="Cloud">Cloud Enclave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Criticality</label>
                  <select
                    value={formData.criticality}
                    onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Open Services (comma separated)</label>
                <input
                  type="text"
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              {/* Internet Exposed Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="internet_exposed"
                  checked={formData.internet_exposed}
                  onChange={(e) => setFormData({ ...formData, internet_exposed: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="internet_exposed" className="text-xs text-slate-300">
                  Direct Internet Exposure (External Attack Surface)
                </label>
              </div>

              {/* Select CVEs */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Attach Simulated CVEs</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {PRESET_CVES.map((cve) => {
                    const isChecked = formData.selectedCVEs.includes(cve.identifier);
                    return (
                      <label
                        key={cve.identifier}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, selectedCVEs: [...formData.selectedCVEs, cve.identifier] });
                              } else {
                                setFormData({
                                  ...formData,
                                  selectedCVEs: formData.selectedCVEs.filter((id) => id !== cve.identifier)
                                });
                              }
                            }}
                            className="hidden"
                          />
                          <span className="font-mono font-bold">{cve.identifier}</span>
                          <span className="text-[11px] truncate max-w-xs">{cve.title}</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-red-400">
                          CVSS {cve.cvss}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-xs shadow-lg"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Assets Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-100 mb-4 font-mono flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-cyan-400" />
              Connect Network Assets
            </h3>

            <form onSubmit={handleConnectAssets} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Source Asset</label>
                <select
                  required
                  value={connectData.source}
                  onChange={(e) => setConnectData({ ...connectData, source: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  <option value="">Select source asset...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Asset</label>
                <select
                  required
                  value={connectData.target}
                  onChange={(e) => setConnectData({ ...connectData, target: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  <option value="">Select target asset...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Protocol / Port</label>
                  <input
                    type="number"
                    value={connectData.port}
                    onChange={(e) => setConnectData({ ...connectData, port: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Connection Type</label>
                  <select
                    value={connectData.connection_type}
                    onChange={(e) => setConnectData({ ...connectData, connection_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="Network">Network Pivot</option>
                    <option value="API">API REST / gRPC</option>
                    <option value="HasAccessTo">Has Access To DB</option>
                    <option value="AdminAccess">Admin / Kerberos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auth_req"
                  checked={connectData.authentication_required}
                  onChange={(e) => setConnectData({ ...connectData, authentication_required: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="auth_req" className="text-xs text-slate-300">
                  Authentication Required (e.g. Kerberos / DB credentials)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-xs shadow-lg"
                >
                  Establish Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              This will remove all {assets.length} current devices, servers, and network connections from the topology, leaving you with a clean blank canvas. You can restore the default CyberTech Demo anytime with "Reset Demo".
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
                {clearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{clearing ? 'Clearing...' : 'Yes, Clear All Nodes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

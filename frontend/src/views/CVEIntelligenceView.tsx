import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Database, Search, Filter, RefreshCw, ExternalLink,
  Flame, Skull, CheckCircle2, AlertTriangle, ArrowRight, Server,
  ChevronLeft, ChevronRight, Activity, Zap, Info, Plus
} from 'lucide-react';
import { api } from '../services/api';
import { RealCVEItem, RealCVEStats, Asset, EPSSData } from '../types';

export const CVEIntelligenceView: React.FC<{
  onInspectInGraph?: (nodes: string[]) => void;
  onRefreshGlobal?: () => void;
}> = ({ onInspectInGraph, onRefreshGlobal }) => {
  const [stats, setStats] = useState<RealCVEStats | null>(null);
  const [cves, setCves] = useState<RealCVEItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [ransomwareOnly, setRansomwareOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const pageSize = 25;

  // Assets for "Deploy to Asset" feature
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [deployModalCve, setDeployModalCve] = useState<RealCVEItem | null>(null);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployMessage, setDeployMessage] = useState<string | null>(null);

  // Live EPSS lookup state
  const [epssLoading, setEpssLoading] = useState<string | null>(null);
  const [epssData, setEpssData] = useState<Record<string, EPSSData>>({});

  // Initial load
  useEffect(() => {
    fetchStats();
    loadAssets();
  }, []);

  // Fetch CVEs whenever filters or page change
  useEffect(() => {
    fetchCVEs();
  }, [searchQuery, selectedVendor, ransomwareOnly, page]);

  const fetchStats = async () => {
    try {
      const data = await api.getCVEStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load CVE stats:', err);
    }
  };

  const loadAssets = async () => {
    try {
      const assetList = await api.getAssets();
      setAssets(assetList);
      if (assetList.length > 0) {
        setSelectedAssetId(assetList[0].id);
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  };

  const fetchCVEs = async () => {
    try {
      setIsLoading(true);
      const res = await api.searchRealCVEs(
        searchQuery,
        selectedVendor,
        ransomwareOnly,
        pageSize,
        page * pageSize
      );
      setCves(res.items);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Failed to fetch real CVEs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncFeed = async (forceOnline: boolean = true) => {
    try {
      setIsSyncing(true);
      setSyncMessage(null);
      const res = await api.syncCVEDatabase(forceOnline);
      setSyncMessage(res.message);
      await fetchStats();
      await fetchCVEs();
    } catch (err) {
      console.error('Failed to sync CISA feed:', err);
      setSyncMessage('Sync failed. Please check internet connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFetchEPSS = async (cveId: string) => {
    try {
      setEpssLoading(cveId);
      const data = await api.getLiveEPSS(cveId);
      setEpssData(prev => ({ ...prev, [cveId]: data }));
    } catch (err) {
      console.error('Failed to query EPSS:', err);
    } finally {
      setEpssLoading(null);
    }
  };

  const handleDeployToAsset = async () => {
    if (!deployModalCve || !selectedAssetId) return;
    try {
      setIsDeploying(true);
      setDeployMessage(null);
      const res = await api.attachCVEToAsset(selectedAssetId, deployModalCve.cve_id);
      setDeployMessage(res.message);
      if (onRefreshGlobal) onRefreshGlobal();
      setTimeout(() => {
        setDeployModalCve(null);
        setDeployMessage(null);
      }, 2200);
    } catch (err: any) {
      console.error('Failed to deploy CVE:', err);
      setDeployMessage(err.message || 'Failed to attach CVE to asset.');
    } finally {
      setIsDeploying(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Real-World CVE Threat Intelligence
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono border border-red-500/30 font-semibold">
                  Official CISA KEV
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  EPSS Integrated
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Official repository of actively weaponized vulnerabilities in the wild from the US Cybersecurity and Infrastructure Security Agency (CISA).
              </p>
            </div>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSyncFeed(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Feed...' : 'Sync CISA Feed'}</span>
          </button>
        </div>
      </div>

      {/* Sync Toast Notification */}
      {syncMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Real-World Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>TOTAL WEAPONIZED CVES</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            {stats ? stats.total_cves.toLocaleString() : '1,734'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Actively exploited in the wild</div>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>RANSOMWARE WEAPONS</span>
            <Skull className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-1">
            {stats ? stats.ransomware_weaponized.toLocaleString() : '361'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Known ransomware campaign usage</div>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>CRITICAL SEVERITY</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400 mt-1">
            {stats ? stats.critical_severity.toLocaleString() : '940'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">CVSS &ge; 9.0 RCE & auth bypass</div>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>FEED AUTHORITY</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-emerald-300 mt-1">
            CISA KEV Catalog
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">No API Key Required (Zero Setup)</div>
        </div>
      </div>

      {/* Top Vendors Banner */}
      {stats && stats.top_vendors && stats.top_vendors.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px] mr-1">Top Targets:</span>
          {stats.top_vendors.slice(0, 8).map((v) => (
            <button
              key={v.vendor}
              onClick={() => {
                setSelectedVendor(v.vendor);
                setPage(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                selectedVendor.toLowerCase() === v.vendor.toLowerCase()
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950/60 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {v.vendor} <span className="text-slate-500">({v.count})</span>
            </button>
          ))}
          {selectedVendor && (
            <button
              onClick={() => {
                setSelectedVendor('');
                setPage(0);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300 underline ml-2"
            >
              Clear vendor filter
            </button>
          )}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search CVE ID (e.g. CVE-2023-), vendor, product (Log4j, Exchange), or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700">
            <input
              type="checkbox"
              checked={ransomwareOnly}
              onChange={(e) => {
                setRansomwareOnly(e.target.checked);
                setPage(0);
              }}
              className="rounded border-slate-700 text-red-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
            />
            <Skull className="w-3.5 h-3.5 text-red-400" />
            <span>Ransomware Vectors Only</span>
          </label>
        </div>
      </div>

      {/* CVE Table */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <span>Showing {cves.length} of {totalCount.toLocaleString()} Exploited CVEs</span>
          </div>
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isLoading}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span>Querying Real CVE Intelligence Catalog...</span>
          </div>
        ) : cves.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No real CVEs found matching your search criteria. Try clearing filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">CVE ID & Target</th>
                  <th className="p-3.5">Severity / CVSS</th>
                  <th className="p-3.5">Threat Status</th>
                  <th className="p-3.5">Vulnerability Description & CISA Remediation</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {cves.map((cve) => {
                  const epss = epssData[cve.cve_id];
                  const isRansomware = cve.known_ransomware_campaign_use.toLowerCase() === 'known';
                  return (
                    <tr key={cve.cve_id} className="hover:bg-slate-800/20 transition-colors group">
                      {/* CVE ID & Target */}
                      <td className="p-3.5 align-top w-56">
                        <div className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
                          <a
                            href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                          >
                            {cve.cve_id}
                            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                          </a>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono">
                            {cve.vendor_project}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 font-mono">
                            {cve.product}
                          </span>
                        </div>
                        {cve.date_added && (
                          <div className="text-[10px] text-slate-500 font-mono mt-1">
                            Added: {cve.date_added}
                          </div>
                        )}
                      </td>

                      {/* Severity & CVSS */}
                      <td className="p-3.5 align-top w-36">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                              cve.severity === 'Critical'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                            }`}
                          >
                            {cve.cvss.toFixed(1)} {cve.severity}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          {cve.cwe}
                        </div>
                      </td>

                      {/* Threat Status */}
                      <td className="p-3.5 align-top w-44">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            <Flame className="w-3 h-3 text-amber-400" />
                            Actively Exploited
                          </span>
                          {isRansomware && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-700/60 font-semibold">
                              <Skull className="w-3 h-3 text-red-400" />
                              Ransomware Weapon
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Description & Action */}
                      <td className="p-3.5 align-top max-w-lg">
                        <div className="font-semibold text-slate-200 text-xs mb-1">
                          {cve.vulnerability_name}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                          {cve.short_description}
                        </p>
                        {cve.required_action && (
                          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[10px] text-slate-300">
                            <span className="text-cyan-400 font-semibold uppercase">CISA Directive: </span>
                            <span className="line-clamp-2">{cve.required_action}</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 align-top text-right w-44">
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => {
                              setDeployModalCve(cve);
                              setDeployMessage(null);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Deploy to Asset</span>
                          </button>

                          {epss ? (
                            <div className="text-[10px] font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 text-right">
                              EPSS: <strong className="text-orange-400">{epss.probability_percent}%</strong> (Top {(100 - epss.percentile * 100).toFixed(1)}%)
                            </div>
                          ) : (
                            <button
                              onClick={() => handleFetchEPSS(cve.cve_id)}
                              disabled={epssLoading === cve.cve_id}
                              className="text-[10px] text-slate-500 hover:text-cyan-400 underline flex items-center gap-1"
                            >
                              <Activity className="w-3 h-3" />
                              <span>{epssLoading === cve.cve_id ? 'Checking EPSS...' : 'Live EPSS Score'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deploy to Asset Modal */}
      {deployModalCve && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                Deploy Real CVE to Graph Architecture
              </h3>
              <button
                onClick={() => setDeployModalCve(null)}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-mono font-bold text-cyan-400">{deployModalCve.cve_id}</div>
                <div className="font-semibold text-slate-200">{deployModalCve.vulnerability_name}</div>
                <div className="text-[11px] text-slate-400">
                  Target: {deployModalCve.vendor_project} - {deployModalCve.product} (CVSS {deployModalCve.cvss})
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Infrastructure Asset</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type} - {a.zone})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Injecting this real CVE will instantly recalculate attack paths, MITRE tactics, and ML risk scores.
                </p>
              </div>

              {deployMessage && (
                <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{deployMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeployModalCve(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              >
                Cancel
              </button>
              <button
                onClick={handleDeployToAsset}
                disabled={isDeploying || !selectedAssetId}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isDeploying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isDeploying ? 'Deploying...' : 'Deploy to Node'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

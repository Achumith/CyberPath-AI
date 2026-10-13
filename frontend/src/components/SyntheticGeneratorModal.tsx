import React, { useState } from 'react';
import { Sparkles, X, Server, Shield, Layers, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

export const SyntheticGeneratorModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onGenerated
}) => {
  const [size, setSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [seed, setSeed] = useState<number>(42);
  const [orgName, setOrgName] = useState<string>('TechCorp Global Enterprise');
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      await api.generateSyntheticOrg(size, seed, orgName);
      onGenerated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to generate synthetic organization');
    } finally {
      setGenerating(false);
    }
  };

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 9000) + 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-lg rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Synthetic Organization Generator</h2>
            <p className="text-xs text-slate-400">
              Instantly scaffold realistic enterprise network graphs with synthetic CVEs & trust zones
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800/80 text-red-300 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Org Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Simulated Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Size Cards */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Infrastructure Scale
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { key: 'Small', label: 'Small', range: '10–15 assets', desc: 'Lightweight DMZ + DB' },
                { key: 'Medium', label: 'Medium', range: '25–35 assets', desc: 'Standard Enterprise Tier' },
                { key: 'Large', label: 'Large', range: '60–80 assets', desc: 'Complex Multi-Segment Grid' }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSize(item.key as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    size === item.key
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`text-xs font-bold ${size === item.key ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.range}</div>
                  <div className="text-[9px] text-slate-500 mt-1">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Seed Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Random Seed (Reproducible Graph)
              </label>
              <button
                type="button"
                onClick={handleRandomSeed}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Randomize
              </button>
            </div>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Synthesizing Graph...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate Infrastructure
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

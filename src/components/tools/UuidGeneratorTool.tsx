import React, { useState } from 'react';
import { CryptoTools } from '../../services/cryptoTools';
import { CopyButton } from '../common/CopyButton';
import { ErrorAlert } from '../common/ErrorAlert';
import { KeyRound, RefreshCw, CheckCircle2, AlertCircle, Shield, Check } from 'lucide-react';

export const UuidGeneratorTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'validate'>('generate');

  // Generator state
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [uuids, setUuids] = useState<string[]>(() => CryptoTools.generateUuids(5));

  // Validator state
  const [validateInput, setValidateInput] = useState('6ba7b810-9dad-11d1-80b4-00c04fd430c8');

  const handleGenerate = () => {
    const raw = CryptoTools.generateUuids(count);
    const formatted = raw.map((u) => {
      let val = hyphens ? u : u.replace(/-/g, '');
      return uppercase ? val.toUpperCase() : val.toLowerCase();
    });
    setUuids(formatted);
  };

  const validationResult = CryptoTools.validateUuid(validateInput);

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-3">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong>CSPRNG Client-Side Entropy:</strong> UUIDs are generated with cryptographically strong pseudo-random numbers via <code>crypto.randomUUID()</code> or <code>crypto.getRandomValues()</code> directly in your browser.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'generate'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            UUID Generator (v4)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('validate')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'validate'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            UUID Validator &amp; Parser
          </button>
        </div>
      </div>

      {activeTab === 'generate' ? (
        <div className="glass-panel rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <span>Web Crypto UUID v4 Generator</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                RFC 4122 compliant version 4 UUIDs using browser Web Crypto CSPRNG.
              </p>
            </div>

            <button
              type="button"
              id="generate-uuid-btn"
              onClick={handleGenerate}
              className="px-5 py-2.5 rounded-xl aqua-glow-button text-white text-xs font-semibold flex items-center gap-2 shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate Fresh UUIDs</span>
            </button>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Quantity (1 - 100)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hyphens}
                  onChange={(e) => setHyphens(e.target.checked)}
                  className="accent-cyan-400 rounded"
                />
                <span>Include Hyphens (Standard 8-4-4-4-12)</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="accent-cyan-400 rounded"
                />
                <span>Uppercase Characters</span>
              </label>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400">Generated Identifiers ({uuids.length})</span>
              <CopyButton textToCopy={uuids.join('\n')} label="Copy All UUIDs" />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-auto">
              {uuids.map((id, idx) => (
                <div
                  key={`${id}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300"
                >
                  <span>{id}</span>
                  <CopyButton textToCopy={id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Validator tab */
        <div className="glass-panel rounded-2xl p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Enter UUID String to Inspect
            </label>
            <input
              type="text"
              value={validateInput}
              onChange={(e) => setValidateInput(e.target.value)}
              placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:ring-2 focus:ring-cyan-400 focus:outline-none"
            />
          </div>

          {validationResult.isValid ? (
            <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/30 space-y-3">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Valid RFC 4122 UUID Format</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">UUID Version</span>
                  <p className="font-semibold text-slate-200 mt-0.5">Version {validationResult.version}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">UUID Variant</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{validationResult.variant}</p>
                </div>
              </div>
            </div>
          ) : (
            <ErrorAlert message={validationResult.error || 'Malformed UUID structure.'} />
          )}
        </div>
      )}
    </div>
  );
};

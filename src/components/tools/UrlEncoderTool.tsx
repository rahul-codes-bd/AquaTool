import React, { useState, useMemo } from 'react';
import { OutputCard } from '../common/OutputCard';
import { ErrorAlert } from '../common/ErrorAlert';
import { TextTools } from '../../services/textTools';
import { Link, Shield, AlertCircle, Info, Table } from 'lucide-react';
import { CopyButton } from '../common/CopyButton';

export const UrlEncoderTool: React.FC = () => {
  const [inputText, setInputText] = useState('https://aquatools.local/search?query=browser utilities&filter=local-only&category=file tools');
  const [componentMode, setComponentMode] = useState(true);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEncode = () => {
    setError(null);
    try {
      setResult(TextTools.urlEncode(inputText, componentMode));
    } catch (err: any) {
      setError(err.message || 'URL encoding failed.');
    }
  };

  const handleDecode = () => {
    setError(null);
    try {
      setResult(TextTools.urlDecode(inputText, componentMode));
    } catch (err: any) {
      setError(err.message || 'Malformed URI sequence. Input contains invalid percent-encoded bytes.');
    }
  };

  // Extract query parameters if the input looks like a URL
  const queryParams = useMemo(() => {
    try {
      const qIndex = inputText.indexOf('?');
      if (qIndex === -1) return [];
      const queryString = inputText.slice(qIndex + 1).split('#')[0];
      const params = new URLSearchParams(queryString);
      const list: { key: string; value: string }[] = [];
      params.forEach((value, key) => {
        list.push({ key, value });
      });
      return list;
    } catch {
      return [];
    }
  }, [inputText]);

  return (
    <div className="space-y-6">
      {/* Privacy & Encoding vs Encryption Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-3">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong>Local Browser Execution:</strong> All string transformations use standard JavaScript <code>encodeURIComponent</code> / <code>decodeURIComponent</code> without any network calls.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-0.5">Encoding vs. Encryption:</strong>
            <span className="text-indigo-300/90">
              <strong>URL Percent-Encoding</strong> replaces reserved or non-ASCII characters with <code>%XX</code> hex bytes for HTTP protocol compatibility. It is <em>not</em> an encryption mechanism and provides no secrecy.
            </span>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-300 uppercase">URL / URI Input</span>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={componentMode}
                onChange={(e) => setComponentMode(e.target.checked)}
                className="accent-cyan-400 rounded"
              />
              <span>Encode Component Mode (handles &amp;, =, ?, /)</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setInputText('');
                setResult('');
                setError(null);
              }}
              className="text-xs text-slate-400 hover:text-rose-400"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
          className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-200 font-mono text-xs focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          placeholder="Enter a URL, path, or query string..."
        />

        <div className="flex gap-3">
          <button
            type="button"
            id="url-encode-btn"
            onClick={handleEncode}
            className="flex-1 py-2.5 rounded-xl aqua-glow-button text-white text-xs font-semibold shadow-lg"
          >
            URL Percent Encode
          </button>
          <button
            type="button"
            id="url-decode-btn"
            onClick={handleDecode}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            URL Percent Decode
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {result && (
        <OutputCard
          title="URL Processed Output"
          resultText={result}
          onReset={() => setResult('')}
        />
      )}

      {/* Query parameters breakdown table */}
      {queryParams.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Table className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Detected Query Parameters ({queryParams.length})
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3">Parameter Key</th>
                  <th className="py-2 px-3">Value</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {queryParams.map((param, index) => (
                  <tr key={index} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-cyan-300 font-semibold">{param.key}</td>
                    <td className="py-2 px-3 text-slate-300 break-all">{param.value}</td>
                    <td className="py-2 px-3 text-right">
                      <CopyButton textToCopy={param.value} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

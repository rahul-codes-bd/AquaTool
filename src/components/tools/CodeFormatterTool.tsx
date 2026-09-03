import React, { useState } from 'react';
import { OutputCard } from '../common/OutputCard';
import { ErrorAlert } from '../common/ErrorAlert';
import { TextTools } from '../../services/textTools';
import { Braces, Minimize2, Sparkles, Check } from 'lucide-react';

type Lang = 'json' | 'xml' | 'html' | 'css' | 'javascript';

export const CodeFormatterTool: React.FC = () => {
  const [lang, setLang] = useState<Lang>('json');
  const [code, setCode] = useState(`{
  "project": "AquaTools",
  "privacy": "100% Local",
  "features": ["JSON", "XML", "HTML", "CSS", "JS"],
  "stats": {"users": 0, "uploadedBytes": 0}
}`);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFormat = () => {
    setError(null);
    try {
      let out = '';
      if (lang === 'json') out = TextTools.formatJson(code);
      else if (lang === 'xml') out = TextTools.formatXml(code);
      else if (lang === 'html') out = TextTools.formatHtml(code);
      else if (lang === 'css') out = TextTools.formatCss(code);
      else if (lang === 'javascript') out = code; // Safe identity formatted
      setResult(out);
    } catch (err: any) {
      setError(err.message || 'Formatting failed. Syntax error detected.');
    }
  };

  const handleMinify = () => {
    setError(null);
    try {
      let out = '';
      if (lang === 'json') out = TextTools.minifyJson(code);
      else if (lang === 'xml') out = TextTools.minifyXml(code);
      else if (lang === 'html') out = TextTools.minifyHtml(code);
      else if (lang === 'css') out = TextTools.minifyCss(code);
      else if (lang === 'javascript') out = TextTools.minifyJs(code);
      setResult(out);
    } catch (err: any) {
      setError(err.message || 'Minification failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Language Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {(['json', 'xml', 'html', 'css', 'javascript'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLang(l);
                setResult('');
                setError(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                lang === l
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFormat}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Format / Beautify</span>
          </button>
          <button
            type="button"
            onClick={handleMinify}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Minify</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Code */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase">
              Input {lang.toUpperCase()} Source
            </span>
            <button
              type="button"
              onClick={() => setCode('')}
              className="text-xs text-slate-400 hover:text-rose-400"
            >
              Clear
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={14}
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:ring-2 focus:ring-cyan-400 focus:outline-none resize-y"
            placeholder={`Paste raw ${lang} here...`}
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          {error && <ErrorAlert message={error} />}

          {result ? (
            <OutputCard
              title={`Formatted / Minified ${lang.toUpperCase()}`}
              resultText={result}
              fileName={`formatted.${lang === 'javascript' ? 'js' : lang}`}
              blob={new Blob([result], { type: 'text/plain' })}
              onReset={() => setResult('')}
            />
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center min-h-[350px]">
              <Braces className="w-8 h-8 text-slate-600 mb-2" />
              <span>Click "Format" or "Minify" to process code locally.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

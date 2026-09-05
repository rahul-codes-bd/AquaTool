import React, { useState, useMemo } from 'react';
import { CopyButton } from '../common/CopyButton';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const RegexTesterTool: React.FC = () => {
  const [pattern, setPattern] = useState('(\\w+)@([\\w\\.]+)');
  const [flags, setFlags] = useState({ g: true, i: true, m: false, s: false });
  const [testText, setTestText] = useState(
    'Contact team@aquatools.local or support@example.com for privacy questions.'
  );

  const flagString = useMemo(() => {
    return Object.entries(flags)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join('');
  }, [flags]);

  const { matches, error } = useMemo(() => {
    if (!pattern) return { matches: [], error: null };
    try {
      const re = new RegExp(pattern, flagString);
      const results: { match: string; index: number; groups: string[] }[] = [];

      if (flags.g) {
        let m: RegExpExecArray | null;
        let count = 0;
        while ((m = re.exec(testText)) !== null && count < 500) {
          results.push({
            match: m[0],
            index: m.index,
            groups: m.slice(1),
          });
          count++;
          if (m[0].length === 0) re.lastIndex++;
        }
      } else {
        const m = re.exec(testText);
        if (m) {
          results.push({
            match: m[0],
            index: m.index,
            groups: m.slice(1),
          });
        }
      }

      return { matches: results, error: null };
    } catch (err: any) {
      return { matches: [], error: err.message };
    }
  }, [pattern, flagString, testText, flags.g]);

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        {/* Pattern & Flags */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider">
              Regular Expression Pattern
            </span>
            <div className="flex items-center gap-3">
              {(['g', 'i', 'm', 's'] as const).map((flag) => (
                <label
                  key={flag}
                  className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={flags[flag]}
                    onChange={(e) => setFlags({ ...flags, [flag]: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span>/{flag}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 px-3 py-1 focus-within:ring-2 focus-within:ring-cyan-400">
            <span className="text-slate-500 font-mono text-base font-bold">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full bg-transparent border-none text-cyan-300 font-mono text-sm px-2 py-1.5 focus:outline-none"
              placeholder="e.g. [a-z0-9]+"
            />
            <span className="text-slate-500 font-mono text-base font-bold">/{flagString}</span>
          </div>

          {error && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Regex syntax error: {error}</span>
            </p>
          )}
        </div>

        {/* Test Text */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Test String
          </span>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            rows={5}
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:ring-2 focus:ring-cyan-400 focus:outline-none"
            placeholder="Type text to match against..."
          />
        </div>

        {/* Results Overview */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Matches Found ({matches.length})</span>
            </span>
          </div>

          {matches.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {matches.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs font-mono"
                >
                  <div className="flex justify-between items-center text-cyan-300">
                    <span className="font-bold">Match #{idx + 1}: "{m.match}"</span>
                    <span className="text-[10px] text-slate-400">index: {m.index}</span>
                  </div>
                  {m.groups.length > 0 && (
                    <div className="pt-1 text-[11px] text-slate-400 space-y-0.5">
                      {m.groups.map((grp, gIdx) => (
                        <div key={gIdx}>
                          Group {gIdx + 1}: <span className="text-slate-200">"{grp}"</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">
              No matching pattern instances in test string.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

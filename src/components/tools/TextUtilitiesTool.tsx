import React, { useState } from 'react';
import { TextTools } from '../../services/textTools';
import { CopyButton } from '../common/CopyButton';
import { AlignLeft, GitCompare, Sparkles, Trash2, ArrowUpDown, Layers } from 'lucide-react';

export const TextUtilitiesTool: React.FC = () => {
  const [tab, setTab] = useState<'transform' | 'diff'>('transform');
  const [text, setText] = useState(`AquaTools is a completely private web utility platform.
All processing happens directly in your browser.
No server uploads ever take place.
No server uploads ever take place.
Enjoy fast, reliable, offline-ready file converters!`);

  // Diff inputs
  const [diffOriginal, setDiffOriginal] = useState(`function calculateTotal(items) {
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += items[i].price;
  }
  return sum;
}`);
  const [diffModified, setDiffModified] = useState(`function calculateTotal(items) {
  // Use modern reduce method
  return items.reduce((sum, item) => sum + item.price, 0);
}`);

  const stats = TextTools.getTextStats(text);

  const applyCase = (type: any) => {
    setText(TextTools.convertCase(text, type));
  };

  const applyClean = () => {
    setText(
      TextTools.cleanWhitespace(text, {
        collapseSpaces: true,
        trimLines: true,
        removeEmptyLines: true,
      })
    );
  };

  const applySort = (order: 'asc' | 'desc' | 'random') => {
    setText(TextTools.sortLines(text, order));
  };

  const applyDedup = () => {
    setText(TextTools.removeDuplicateLines(text));
  };

  const diffResult = TextTools.computeDiff(diffOriginal, diffModified);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('transform')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === 'transform'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Text Transforms & Stats
          </button>
          <button
            type="button"
            onClick={() => setTab('diff')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === 'diff'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Text Diff Inspector
          </button>
        </div>
      </div>

      {tab === 'transform' ? (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl glass-panel text-center">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Words</span>
              <p className="text-xl font-bold text-cyan-300 font-mono">{stats.words}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Characters</span>
              <p className="text-xl font-bold text-cyan-300 font-mono">{stats.characters}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Sentences</span>
              <p className="text-xl font-bold text-cyan-300 font-mono">{stats.sentences}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Lines</span>
              <p className="text-xl font-bold text-cyan-300 font-mono">{stats.lines}</p>
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Reading Time</span>
              <p className="text-xl font-bold text-teal-300 font-mono">~{stats.readingTimeMinutes} min</p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-2">Case:</span>
            <button
              type="button"
              onClick={() => applyCase('upper')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
            >
              UPPERCASE
            </button>
            <button
              type="button"
              onClick={() => applyCase('lower')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
            >
              lowercase
            </button>
            <button
              type="button"
              onClick={() => applyCase('title')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
            >
              Title Case
            </button>
            <button
              type="button"
              onClick={() => applyCase('camel')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
            >
              camelCase
            </button>
            <button
              type="button"
              onClick={() => applyCase('kebab')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
            >
              kebab-case
            </button>
            <button
              type="button"
              onClick={() => applyCase('snake')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
            >
              snake_case
            </button>

            <span className="text-xs font-semibold text-slate-400 ml-4 mr-2">Clean:</span>
            <button
              type="button"
              onClick={applyClean}
              className="px-2.5 py-1 rounded-lg text-xs bg-cyan-950 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900"
            >
              Trim & Collapse Spaces
            </button>
            <button
              type="button"
              onClick={applyDedup}
              className="px-2.5 py-1 rounded-lg text-xs bg-cyan-950 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900"
            >
              Remove Duplicates
            </button>
            <button
              type="button"
              onClick={() => applySort('asc')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
            >
              Sort A → Z
            </button>
          </div>

          {/* Text Area */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Editor</span>
              <CopyButton textToCopy={text} />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-200 font-mono text-xs focus:ring-2 focus:ring-cyan-400 focus:outline-none resize-y"
              placeholder="Type or paste text..."
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel rounded-2xl p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-300">Original Text</span>
              <textarea
                value={diffOriginal}
                onChange={(e) => setDiffOriginal(e.target.value)}
                rows={10}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-200 font-mono text-xs focus:outline-none"
              />
            </div>
            <div className="glass-panel rounded-2xl p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-300">Modified Text</span>
              <textarea
                value={diffModified}
                onChange={(e) => setDiffModified(e.target.value)}
                rows={10}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-200 font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Diff Output */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-cyan-400" />
                <span>Line-by-Line Diff Result</span>
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500 inline-block" />
                  Added
                </span>
                <span className="flex items-center gap-1 text-rose-400 font-mono">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500 inline-block" />
                  Removed
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-0.5 max-h-[350px] overflow-auto">
              {diffResult.map((part, index) => {
                const color = part.added
                  ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-400'
                  : part.removed
                  ? 'bg-rose-950/60 text-rose-300 line-through border-l-2 border-rose-400'
                  : 'text-slate-300';
                return (
                  <div key={index} className={`p-1 whitespace-pre-wrap ${color}`}>
                    {part.added ? '+ ' : part.removed ? '- ' : '  '}
                    {part.value}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Compass, Home, Search, ArrowLeft, Wrench, Sparkles, FileText, Image as ImageIcon, Shield } from 'lucide-react';
import { ALL_TOOLS } from '../../registry/toolsRegistry';
import { ToolCategory } from '../../types';

interface NotFoundPageProps {
  attemptedRoute?: string;
  onNavigate: (view: string, category?: ToolCategory, toolSlug?: string) => void;
  onSelectTool: (slug: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  attemptedRoute,
  onNavigate,
  onSelectTool,
}) => {
  const popularTools = ALL_TOOLS.filter((t) => t.isPopular).slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* 404 Hero Banner */}
      <div className="glass-panel rounded-3xl p-8 sm:p-12 space-y-6 border-cyan-500/20 text-center relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-3xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_40px_rgba(6,182,212,0.25)]">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            ERROR 404
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tool or Page Not Found
          </h1>
          <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
            {attemptedRoute ? (
              <>
                The path <code className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs">{attemptedRoute}</code> does not exist or may have been relocated.
              </>
            ) : (
              'The requested page or offline utility could not be located.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="frosted-glow-button px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('all-tools')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center gap-2 transition-colors"
          >
            <Wrench className="w-4 h-4" />
            <span>Browse All {ALL_TOOLS.length} Tools</span>
          </button>
        </div>
      </div>

      {/* Suggested Popular Tools */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Popular Offline Utilities</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('all-tools')}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View all &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {popularTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.slug)}
              className="glass-panel glass-panel-hover rounded-2xl p-4 text-left space-y-2 border-slate-800/80 group transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {tool.name}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {tool.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {tool.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Categories quick jump */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border-slate-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Explore by Category
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: 'converters', name: 'Converters', count: ALL_TOOLS.filter((t) => t.category === 'converters').length },
            { id: 'documents', name: 'Documents', count: ALL_TOOLS.filter((t) => t.category === 'documents').length },
            { id: 'developer', name: 'Developer', count: ALL_TOOLS.filter((t) => t.category === 'developer').length },
            { id: 'generators', name: 'Generators', count: ALL_TOOLS.filter((t) => t.category === 'generators').length },
            { id: 'utilities', name: 'Utilities', count: ALL_TOOLS.filter((t) => t.category === 'utilities').length },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onNavigate('all-tools', cat.id as ToolCategory)}
              className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 text-left transition-colors group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                {cat.name}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {cat.count} tools
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

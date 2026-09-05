import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  Layers,
  Zap,
  Filter,
  ArrowRight,
  Droplet,
  CheckCircle2,
  Clock,
  Lock,
} from 'lucide-react';
import { PDF_CATEGORIES, PDF_TOOLS } from '../../registry/pdfRegistry';
import { PdfToolCategory, PdfSupportLevel, PdfToolDefinition } from '../../types/pdf';
import { DynamicIcon } from '../common/DynamicIcon';
import { PdfCapabilityBadge } from '../pdf/PdfCapabilityBadge';

interface PdfHubPageProps {
  activeCategory?: PdfToolCategory | 'all';
  onSelectCategory: (category: PdfToolCategory | 'all') => void;
  onSelectPdfTool: (slug: string) => void;
  onNavigateHome: () => void;
}

export const PdfHubPage: React.FC<PdfHubPageProps> = ({
  activeCategory = 'all',
  onSelectCategory,
  onSelectPdfTool,
  onNavigateHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [supportFilter, setSupportFilter] = useState<PdfSupportLevel | 'all'>('all');

  // Filter tools by category, search query, and capability support level
  const filteredTools = useMemo(() => {
    return PDF_TOOLS.filter((tool) => {
      // Category filter
      if (activeCategory !== 'all' && tool.category !== activeCategory) {
        return false;
      }

      // Support level filter
      if (supportFilter !== 'all' && tool.browserSupportLevel !== supportFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim().replace(/^[#\s]+/, '');
        const matchesTitle = tool.title.toLowerCase().includes(q);
        const matchesDesc = tool.shortDescription.toLowerCase().includes(q);
        const matchesTags = tool.tags.some((t) => t.toLowerCase().replace(/^#/, '').includes(q));
        const matchesCat = tool.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTags && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [activeCategory, supportFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = PDF_TOOLS.length;
    const readyCount = PDF_TOOLS.filter((t) => t.browserSupportLevel === 'ready').length;
    const betaCount = PDF_TOOLS.filter((t) => t.browserSupportLevel === 'beta').length;
    const comingSoonCount = PDF_TOOLS.filter((t) => t.browserSupportLevel === 'coming-soon').length;
    return { total, readyCount, betaCount, comingSoonCount };
  }, []);

  return (
    <div className="space-y-8 py-2">
      {/* Hero Header */}
      <div className="relative bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl overflow-hidden shadow-2xl space-y-6">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
              <Droplet className="w-3.5 h-3.5 text-cyan-400" />
              <span>AquaTools PDF Architecture Suite</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Privacy-First PDF Tools, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-teal-400">100% In-Browser</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Complete client-side document workstation. Inspect, merge, split, watermark, paginate, and convert documents locally in memory without transmitting any file data to a remote server.
            </p>
          </div>

          {/* Quick Privacy Box */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 shrink-0 space-y-3 shadow-xl backdrop-blur-2xl md:w-72">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Lock className="w-4 h-4" />
              <span>Local Memory Guarantee</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero server telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Automatic object URL cleanup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>No file size storage quotas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Capability Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center">
            <div className="text-xl sm:text-2xl font-black text-white font-mono">{stats.total}</div>
            <div className="text-[11px] text-slate-400 font-medium">Cataloged Tools</div>
          </div>
          <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-2xl p-3 text-center">
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{stats.readyCount}</div>
            <div className="text-[11px] text-emerald-300/80 font-medium">In-Browser Ready</div>
          </div>
          <div className="bg-cyan-500/[0.04] border border-cyan-500/20 rounded-2xl p-3 text-center">
            <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">{stats.betaCount}</div>
            <div className="text-[11px] text-cyan-300/80 font-medium">Beta / Parsing</div>
          </div>
          <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-2xl p-3 text-center">
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{stats.comingSoonCount}</div>
            <div className="text-[11px] text-amber-300/80 font-medium">WASM Roadmap</div>
          </div>
        </div>
      </div>

      {/* Search & Capability Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Box */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="pdf-tools-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all 80+ PDF tools by name, action, or format (e.g., merge, watermark, docx, ocr)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/[0.08] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-white/5"
            >
              Clear
            </button>
          )}
        </div>

        {/* Capability Tier Dropdown/Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl text-xs w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setSupportFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium whitespace-nowrap ${
              supportFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Tiers ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setSupportFilter('ready')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium whitespace-nowrap flex items-center gap-1.5 ${
              supportFilter === 'ready'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Ready ({stats.readyCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSupportFilter('coming-soon')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium whitespace-nowrap flex items-center gap-1.5 ${
              supportFilter === 'coming-soon'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Roadmap ({stats.comingSoonCount})</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="PDF Categories">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
            activeCategory === 'all'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          All Categories ({PDF_TOOLS.length})
        </button>

        {PDF_CATEGORIES.map((cat) => {
          const count = PDF_TOOLS.filter((t) => t.category === cat.id).length;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isActive
                  ? 'bg-white/15 text-cyan-300 border-cyan-400/50 shadow-md shadow-cyan-500/10'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <DynamicIcon name={cat.iconName} size={14} />
              <span>{cat.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tool Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div>
            Showing <span className="text-white font-bold font-mono">{filteredTools.length}</span> tools
            {activeCategory !== 'all' && (
              <span> in <span className="text-cyan-300 font-medium">{PDF_CATEGORIES.find((c) => c.id === activeCategory)?.name}</span></span>
            )}
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-cyan-400 hover:underline"
            >
              Reset Search
            </button>
          )}
        </div>

        {filteredTools.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-3 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No PDF Tools Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No utilities matched your current search and filter criteria. Try clearing the query or selecting another category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSupportFilter('all');
                onSelectCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs mt-2"
            >
              Show All Tools
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredTools.map((tool) => {
              const catMeta = PDF_CATEGORIES.find((c) => c.id === tool.category);

              return (
                <div
                  key={tool.slug}
                  id={`pdf-tool-card-${tool.slug}`}
                  onClick={() => onSelectPdfTool(tool.slug)}
                  className="group relative bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 rounded-3xl p-5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 backdrop-blur-xl hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5 select-none"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open tool: ${tool.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectPdfTool(tool.slug);
                    }
                  }}
                >
                  <div className="space-y-3">
                    {/* Header with Icon & Capability Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-cyan-500/20 transition-all shadow-md">
                        <DynamicIcon name={tool.iconName} size={22} />
                      </div>
                      <PdfCapabilityBadge level={tool.browserSupportLevel} size="sm" />
                    </div>

                    {/* Titles */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                        <span>{tool.title}</span>
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {tool.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="space-y-2.5 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-300">
                        {catMeta?.shortName || tool.category}
                      </span>
                      <span className="flex items-center gap-1 text-cyan-400 group-hover:translate-x-0.5 transition-transform font-sans font-medium">
                        <span>Launch</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>

                    {/* Tag Chips */}
                    {tool.tags && tool.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tool.tags.slice(0, 3).map((tag, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery(tag);
                              onSelectCategory('all');
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-cyan-500/15 hover:text-cyan-300 text-slate-400 border border-white/5 transition-colors cursor-pointer"
                            title={`Search by tag #${tag}`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

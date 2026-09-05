import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Droplet,
  CheckCircle2,
  Lock,
  Cpu,
  RefreshCw,
  Crop,
  Sliders,
  Palette,
  Boxes,
  Code2,
} from 'lucide-react';
import { IMAGE_CATEGORIES, IMAGE_TOOLS } from '../../registry/imageRegistry';
import { ImageToolCategory, ImageToolDefinition } from '../../types/image';
import { DynamicIcon } from '../common/DynamicIcon';
import { ImageDropzone } from '../image/ImageDropzone';
import { ImageCapabilityNotice } from '../image/ImageCapabilityNotice';

interface ImageHubPageProps {
  activeCategory?: ImageToolCategory | 'all';
  onSelectCategory: (category: ImageToolCategory | 'all') => void;
  onSelectImageTool: (slug: string, initialFiles?: File[]) => void;
  onNavigateHome: () => void;
}

export const ImageHubPage: React.FC<ImageHubPageProps> = ({
  activeCategory = 'all',
  onSelectCategory,
  onSelectImageTool,
  onNavigateHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'beta'>('all');

  // Filter tools by category, search query, and status
  const filteredTools = useMemo(() => {
    return IMAGE_TOOLS.filter((tool) => {
      // Category filter
      if (activeCategory !== 'all' && tool.category !== activeCategory) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && tool.status !== statusFilter) {
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
  }, [activeCategory, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = IMAGE_TOOLS.length;
    const readyCount = IMAGE_TOOLS.filter((t) => t.status === 'ready').length;
    const betaCount = IMAGE_TOOLS.filter((t) => t.status === 'beta').length;
    return { total, readyCount, betaCount };
  }, []);

  const handleQuickDrop = (files: File[]) => {
    if (files.length > 0) {
      onSelectImageTool('convert-image', files);
    }
  };

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
              <span>AquaTools Image Studio Suite</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Client-Side Image Studio,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-teal-400">
                100% In-Browser
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Transform, compress, resize, crop, redact, strip EXIF metadata, and export web assets in high fidelity with zero server uploads, zero accounts, and zero tracking.
            </p>
          </div>

          {/* Quick Privacy Box */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 shrink-0 space-y-3 shadow-xl backdrop-blur-2xl md:w-72">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Lock className="w-4 h-4" />
              <span>Water-Glass Privacy Promise</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero cloud pixel uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Strict RAM memory recycling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>No signups or email required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick File Drop Area */}
        <div className="pt-2">
          <ImageDropzone
            onFilesSelected={handleQuickDrop}
            compact
            title="Drop images here to launch Universal Converter & Optimizer"
            subtitle="Auto-detects format • Select tool below or drop a file to begin"
          />
        </div>

        {/* Capability Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center">
            <div className="text-xl sm:text-2xl font-black text-white font-mono">{stats.total}</div>
            <div className="text-[11px] text-slate-400 font-medium">Image Tools & Utilities</div>
          </div>
          <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-2xl p-3 text-center">
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{stats.readyCount}</div>
            <div className="text-[11px] text-emerald-300/80 font-medium">In-Browser Ready</div>
          </div>
          <div className="bg-cyan-500/[0.04] border border-cyan-500/20 rounded-2xl p-3 text-center">
            <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">{stats.betaCount}</div>
            <div className="text-[11px] text-cyan-300/80 font-medium">Beta / Local WASM</div>
          </div>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Box */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="image-tools-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all image tools (e.g., convert, compress, crop, exif, watermark, ocr, palette)..."
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

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl text-xs w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ready')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'ready'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Ready ({stats.readyCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('beta')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'beta'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-cyan-400 hover:text-cyan-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Beta ({stats.betaCount})</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Image Categories">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
            activeCategory === 'all'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          All Categories ({IMAGE_TOOLS.length})
        </button>

        {IMAGE_CATEGORIES.map((cat) => {
          const count = IMAGE_TOOLS.filter((t) => t.category === cat.id).length;
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
              <span>
                {' '}
                in{' '}
                <span className="text-cyan-300 font-medium">
                  {IMAGE_CATEGORIES.find((c) => c.id === activeCategory)?.name}
                </span>
              </span>
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
            <h3 className="text-base font-bold text-white">No Image Tools Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No utilities matched your current search and filter criteria. Try clearing the query or selecting another category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
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
              const catMeta = IMAGE_CATEGORIES.find((c) => c.id === tool.category);

              return (
                <div
                  key={tool.slug}
                  id={`image-tool-card-${tool.slug}`}
                  onClick={() => onSelectImageTool(tool.slug)}
                  className="group relative bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 rounded-3xl p-5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 backdrop-blur-xl hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5 select-none"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open tool: ${tool.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectImageTool(tool.slug);
                    }
                  }}
                >
                  <div className="space-y-3">
                    {/* Header with Icon & Status Tag */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-cyan-500/20 transition-all shadow-md">
                        <DynamicIcon name={tool.iconName} size={22} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {tool.isPopular && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Popular
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tool.status === 'ready'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {tool.status}
                        </span>
                      </div>
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
                        <span>Open Tool</span>
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

      {/* Privacy Guarantee Footer */}
      <ImageCapabilityNotice />
    </div>
  );
};

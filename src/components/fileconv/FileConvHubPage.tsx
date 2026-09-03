import React, { useState } from 'react';
import {
  Layers,
  FileText,
  Table,
  Presentation,
  Image as ImageIcon,
  Music,
  Video,
  BookOpen,
  Archive,
  Type,
  Code,
  Globe,
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { FILE_CONV_CATEGORIES, FILE_CONVERSION_TOOLS } from '../../registry/fileConvRegistry';
import { ConversionCategory, FileConversionTool } from '../../types/fileConv';
import { PrivacyBadge } from './PrivacyBadge';
import { ConversionMatrix } from './ConversionMatrix';
import { AdSlotPlaceholder } from './AdSlotPlaceholder';

interface FileConvHubPageProps {
  onSelectTool: (slug: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Layers: <Layers className="w-5 h-5 text-cyan-400" />,
  FileText: <FileText className="w-5 h-5 text-cyan-400" />,
  Table: <Table className="w-5 h-5 text-cyan-400" />,
  Presentation: <Presentation className="w-5 h-5 text-cyan-400" />,
  Image: <ImageIcon className="w-5 h-5 text-cyan-400" />,
  Music: <Music className="w-5 h-5 text-cyan-400" />,
  Video: <Video className="w-5 h-5 text-cyan-400" />,
  BookOpen: <BookOpen className="w-5 h-5 text-cyan-400" />,
  Archive: <Archive className="w-5 h-5 text-cyan-400" />,
  Type: <Type className="w-5 h-5 text-cyan-400" />,
  Code: <Code className="w-5 h-5 text-cyan-400" />,
  Globe: <Globe className="w-5 h-5 text-cyan-400" />,
  Sparkles: <Sparkles className="w-5 h-5 text-cyan-400" />,
};

export const FileConvHubPage: React.FC<FileConvHubPageProps> = ({ onSelectTool }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ConversionCategory | 'all'>('all');

  const filteredTools = FILE_CONVERSION_TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.outputFormats.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AquaTools Advanced File Conversion Suite</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Convert Any File, 100% Locally in Your Browser
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Lightning-fast browser processing, zero server uploads, privacy-first sandboxing across 13 format categories.
        </p>
        <div className="pt-2 flex justify-center">
          <PrivacyBadge />
        </div>
      </div>

      {/* Search & Category Tabs */}
      <div className="space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search formats (e.g. PDF, JSON, WebP, EPUB)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-400 transition-all shadow-lg"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            All Categories ({FILE_CONVERSION_TOOLS.length})
          </button>
          {FILE_CONV_CATEGORIES.map((cat) => {
            const count = FILE_CONVERSION_TOOLS.filter((t) => t.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span>{cat.name}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px] font-mono">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => {
          const categoryObj = FILE_CONV_CATEGORIES.find((c) => c.id === tool.category);
          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.slug)}
              className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                    {iconMap[categoryObj?.icon || 'Layers']}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        tool.status === 'ready'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : tool.status === 'beta'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {tool.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{tool.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {tool.outputFormats.slice(0, 3).map((fmt, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-cyan-200">
                      .{fmt}
                    </span>
                  ))}
                  {tool.outputFormats.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-slate-400">
                      +{tool.outputFormats.length - 3}
                    </span>
                  )}
                </div>

                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConversionMatrix />
      <AdSlotPlaceholder />
    </div>
  );
};

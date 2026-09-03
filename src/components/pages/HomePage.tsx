import React, { useState, useMemo, useEffect } from 'react';
import { ALL_TOOLS, CATEGORIES, searchTools, getToolsByCategory, getPopularTools } from '../../registry/toolsRegistry';
import { ToolCard } from '../common/ToolCard';
import { SearchBox } from '../common/SearchBox';
import { AdSlotPlaceholder } from '../common/AdSlotPlaceholder';
import { ToolCategory, ToolDefinition } from '../../types';
import { APP_CONFIG } from '../../config/appConfig';
import {
  Sparkles,
  Star,
  History,
  ShieldCheck,
  Grid,
  Layers,
  ArrowRight,
  Trash2,
  SearchX,
  Compass,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Clock,
  Flame,
} from 'lucide-react';
import { DynamicIcon } from '../common/DynamicIcon';

interface HomePageProps {
  currentView?: string;
  onSelectTool: (slug: string) => void;
  favorites: string[];
  recentTools: string[];
  onToggleFavorite: (slug: string) => void;
  onClearRecentTools?: () => void;
  onClearFavorites?: () => void;
  onNavigate?: (view: string) => void;
}

const QUICK_SEARCH_TAGS = [
  'Image',
  'PDF',
  'JWT',
  'QR Code',
  'Password',
  'JSON',
  'Base64',
  'File Inspector',
];

export const HomePage: React.FC<HomePageProps> = ({
  currentView = 'home',
  onSelectTool,
  favorites,
  recentTools,
  onToggleFavorite,
  onClearRecentTools,
  onClearFavorites,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');

  // If user navigates specifically to 'favorites' or 'all-tools', adjust state accordingly
  useEffect(() => {
    if (currentView === 'favorites') {
      setSelectedCategory('all');
      setSearchQuery('');
    }
  }, [currentView]);

  const popularTools = useMemo(() => getPopularTools(), []);

  const favoriteToolsList = useMemo(() => {
    return ALL_TOOLS.filter((t) => favorites.includes(t.slug));
  }, [favorites]);

  const recentToolsList = useMemo(() => {
    return recentTools
      .map((slug) => ALL_TOOLS.find((t) => t.slug === slug))
      .filter((t): t is ToolDefinition => !!t);
  }, [recentTools]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALL_TOOLS.length };
    CATEGORIES.forEach((cat) => {
      counts[cat.id] = ALL_TOOLS.filter((t) => t.category === cat.id).length;
    });
    return counts;
  }, []);

  const filteredTools = useMemo(() => {
    if (searchQuery.trim()) {
      return searchTools(searchQuery);
    }
    if (selectedCategory === 'all') {
      return ALL_TOOLS;
    }
    return getToolsByCategory(selectedCategory);
  }, [searchQuery, selectedCategory]);

  // Dedicated Favorites View
  if (currentView === 'favorites') {
    return (
      <div className="space-y-8 py-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Star className="w-5 h-5 fill-amber-400" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Favorite Utilities
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Locally bookmarked tools saved in browser metadata for fast access.
            </p>
          </div>

          {favoriteToolsList.length > 0 && onClearFavorites && (
            <button
              type="button"
              id="clear-all-favorites-btn"
              onClick={onClearFavorites}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 transition-all active:scale-95"
              aria-label="Clear all bookmarked utilities"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Bookmarks</span>
            </button>
          )}
        </div>

        {/* If Favorites exist */}
        {favoriteToolsList.length > 0 ? (
          <div className="space-y-4">
            <div className="text-xs font-mono text-slate-400">
              Showing {favoriteToolsList.length} bookmarked utility{favoriteToolsList.length > 1 ? 'ies' : ''}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteToolsList.map((t) => (
                <ToolCard
                  key={t.slug}
                  tool={t}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  onSelectTool={onSelectTool}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty Favorites State */
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 sm:p-14 text-center space-y-5 backdrop-blur-xl max-w-xl mx-auto shadow-2xl shadow-black/20">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_25px_rgba(245,158,11,0.2)]">
              <Star className="w-8 h-8 fill-amber-400/30" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                No Bookmarked Utilities Yet
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Click the star icon on any tool card to bookmark it here for instant, zero-latency access across sessions.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                id="browse-tools-from-empty-favorites"
                onClick={() => (onNavigate ? onNavigate('all-tools') : setSelectedCategory('all'))}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 hover:from-cyan-400 hover:to-sky-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95"
              >
                Browse All Utilities
              </button>
              <button
                type="button"
                onClick={() => (onNavigate ? onNavigate('home') : setSelectedCategory('all'))}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                Return Home
              </button>
            </div>

            {/* Suggestions for popular tools */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Popular utilities to try bookmarking:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {popularTools.slice(0, 4).map((tool) => (
                  <button
                    key={tool.slug}
                    type="button"
                    onClick={() => onSelectTool(tool.slug)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-cyan-500/15 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 border border-white/10 transition-all flex items-center gap-1.5"
                  >
                    <DynamicIcon name={tool.iconName} size={13} />
                    <span>{tool.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 py-2">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-2 sm:pt-4">
        {/* Zero Upload Guarantee Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-medium shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Zero Server Uploads • 100% In-Browser Execution</span>
        </div>

        {/* Dynamic Display Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Private, Fast & Client-Side <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-teal-300">
              Browser Utilities
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Compress photos, decode tokens, inspect magic headers, and generate cryptographically secure keys directly inside your browser memory with zero tracking.
          </p>
        </div>

        {/* Global Search Bar with Keyboard Hotkeys */}
        <div className="pt-1 max-w-xl mx-auto space-y-3">
          <SearchBox
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search 10+ offline utilities (press '/' to focus)..."
          />

          {/* Quick Search Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-400 pt-0.5">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Quick picks:</span>
            {QUICK_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/15 hover:text-cyan-300 hover:border-cyan-500/30 text-slate-300 border border-white/10 text-[11px] transition-all active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Category Navigation Tabs with dynamic tool counts */}
        <div
          className="flex flex-wrap items-center justify-center gap-2 pt-2"
          role="tablist"
          aria-label="Filter utilities by category"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all' && !searchQuery
                ? 'bg-gradient-to-r from-cyan-500/20 to-sky-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-md'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 backdrop-blur-md'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Utilities</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
              {categoryCounts.all}
            </span>
          </button>

          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategory === cat.id && !searchQuery;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearchQuery('');
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/20 to-sky-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-md'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 backdrop-blur-md'
                }`}
              >
                <DynamicIcon name={cat.iconName} size={14} />
                <span>{cat.name}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-400">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SEARCH RESULTS VIEW */}
      {searchQuery.trim() ? (
        <section className="space-y-6 animate-in fade-in duration-200" aria-live="polite">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <span>Search Results for</span>
              <span className="text-cyan-300 font-bold font-mono">"{searchQuery}"</span>
              <span className="text-xs font-mono text-slate-400 font-normal">
                ({filteredTools.length} found)
              </span>
            </h2>
            <button
              type="button"
              id="clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors self-start sm:self-auto"
            >
              Clear Search (Esc)
            </button>
          </div>

          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((t) => (
                <ToolCard
                  key={t.slug}
                  tool={t}
                  isFavorite={favorites.includes(t.slug)}
                  onToggleFavorite={onToggleFavorite}
                  onSelectTool={onSelectTool}
                />
              ))}
            </div>
          ) : (
            /* Empty / No-Results Search State */
            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 sm:p-14 text-center space-y-5 backdrop-blur-xl max-w-xl mx-auto shadow-2xl shadow-black/20">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_25px_rgba(6,182,212,0.15)]">
                <SearchX className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  No Utilities Match "{searchQuery}"
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  We couldn't find any tool with that name or keyword. Try a broader term like "image", "pdf", "crypto", or pick one of the suggestions below.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                {['Image WebP', 'Merge PDF', 'Password', 'QR Code', 'JWT'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setSearchQuery(term)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-white/10 transition-all"
                  >
                    Try "{term}"
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  id="reset-search-empty-state-btn"
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all active:scale-95"
                >
                  View All Utilities
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        /* STANDARD HOMEPAGE DASHBOARD */
        <>
          {/* Favorites (Metadata-only bookmarks) */}
          {favoriteToolsList.length > 0 && (
            <section className="space-y-4" aria-labelledby="favorites-section-heading">
              <div className="flex items-center justify-between">
                <h2
                  id="favorites-section-heading"
                  className="text-base font-semibold text-amber-300 flex items-center gap-2"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>My Bookmarked Utilities</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {favoriteToolsList.length}
                  </span>
                </h2>

                {onClearFavorites && (
                  <button
                    type="button"
                    onClick={onClearFavorites}
                    className="text-xs text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                    title="Clear bookmarks"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear Bookmarks</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteToolsList.map((t) => (
                  <ToolCard
                    key={t.slug}
                    tool={t}
                    isFavorite={true}
                    onToggleFavorite={onToggleFavorite}
                    onSelectTool={onSelectTool}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recently Used (Metadata-only local session history) */}
          {recentToolsList.length > 0 && (
            <section className="space-y-4" aria-labelledby="recents-section-heading">
              <div className="flex items-center justify-between">
                <h2
                  id="recents-section-heading"
                  className="text-base font-semibold text-slate-200 flex items-center gap-2"
                >
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>Recently Used Utilities</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Metadata stored locally)
                  </span>
                </h2>

                {onClearRecentTools && (
                  <button
                    type="button"
                    id="clear-recent-history-btn"
                    onClick={onClearRecentTools}
                    className="text-xs text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                    title="Clear recent tool history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear History</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentToolsList.slice(0, 3).map((t) => (
                  <ToolCard
                    key={t.slug}
                    tool={t}
                    isFavorite={favorites.includes(t.slug)}
                    onToggleFavorite={onToggleFavorite}
                    onSelectTool={onSelectTool}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Popular Tools Highlight (When viewing all categories) */}
          {selectedCategory === 'all' && (
            <section className="space-y-4" aria-labelledby="popular-tools-heading">
              <div className="flex items-center justify-between">
                <h2
                  id="popular-tools-heading"
                  className="text-base font-semibold text-white flex items-center gap-2"
                >
                  <Flame className="w-4 h-4 text-cyan-400" />
                  <span>Popular Utilities</span>
                  <span className="text-xs font-mono text-cyan-400/80 font-normal">
                    (Most Used)
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularTools.map((t) => (
                  <ToolCard
                    key={t.slug}
                    tool={t}
                    isFavorite={favorites.includes(t.slug)}
                    onToggleFavorite={onToggleFavorite}
                    onSelectTool={onSelectTool}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Category Catalog Grid */}
          <section className="space-y-4 pt-2" aria-labelledby="catalog-heading">
            <div className="flex justify-between items-center pb-1">
              <h2
                id="catalog-heading"
                className="text-base font-semibold text-white flex items-center gap-2"
              >
                <Grid className="w-4 h-4 text-cyan-400" />
                <span>
                  {selectedCategory === 'all'
                    ? 'Complete Utility Catalog'
                    : CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                </span>
                <span className="text-xs font-mono text-slate-400 font-normal">
                  ({filteredTools.length})
                </span>
              </h2>

              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <span>Show All Categories</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map((t) => (
                  <ToolCard
                    key={t.slug}
                    tool={t}
                    isFavorite={favorites.includes(t.slug)}
                    onToggleFavorite={onToggleFavorite}
                    onSelectTool={onSelectTool}
                  />
                ))}
              </div>
            ) : (
              /* Empty Category State */
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center space-y-3 backdrop-blur-md">
                <p className="text-sm text-slate-300 font-medium">
                  No tools found in this category.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="px-4 py-2 rounded-xl text-xs bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors"
                >
                  View All Tools
                </button>
              </div>
            )}
          </section>

          {/* In-feed Non-Intrusive Ad Slot (Feature Flag controlled, 0 CLS, outside actions & search) */}
          <AdSlotPlaceholder
            slotId="home-catalog-feed-slot"
            format="in-feed"
            positionLabel="Home Feed Mid-Section"
            className="my-8"
          />

          {/* Privacy Guarantee Frosted Banner Card */}
          <section className="mt-8 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl shadow-black/20">
            <div className="flex items-start sm:items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">Client-Side Security Guarantee</p>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    Audited Offline
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  AquaTools operates with zero backend compute for user data. Every byte stays contained within your browser's private V8/JavaScript execution context.
                </p>
              </div>
            </div>

            <a
              href="#privacy"
              className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 shrink-0 flex items-center gap-1.5 transition-all"
            >
              <span>Read Full Privacy Notice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </section>
        </>
      )}
    </div>
  );
};

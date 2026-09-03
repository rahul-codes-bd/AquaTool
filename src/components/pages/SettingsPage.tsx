import React, { useState, useEffect } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Clock,
  Bookmark,
  Eye,
  Activity,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Sliders,
  ExternalLink,
  X,
} from 'lucide-react';
import { StorageService, StorageAuditReport } from '../../services/storage';
import { FeatureFlagService, useFeatureFlags } from '../../services/featureFlags';
import { ALL_TOOLS, getToolBySlug } from '../../registry/toolsRegistry';
import { APP_CONFIG } from '../../config/appConfig';
import { t } from '../../i18n';

interface SettingsPageProps {
  theme: 'dark' | 'light' | 'system';
  onThemeChange: (theme: 'dark' | 'light' | 'system') => void;
  onClearAllData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  theme,
  onThemeChange,
  onClearAllData,
}) => {
  const flags = useFeatureFlags();
  const [preferences, setPreferences] = useState(() => StorageService.getPreferences());
  const [storageReport, setStorageReport] = useState<StorageAuditReport>(() =>
    StorageService.getStorageReport()
  );
  const [showConfirmClearModal, setShowConfirmClearModal] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const refreshState = () => {
    setPreferences(StorageService.getPreferences());
    setStorageReport(StorageService.getStorageReport());
  };

  const showTempToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Feature Flag handlers
  const handleToggleAds = () => {
    const nextVal = !flags.enableAds;
    FeatureFlagService.setFlag('enableAds', nextVal);
    showTempToast(nextVal ? 'Ad slots enabled (Zero external scripts)' : 'Ad slots disabled');
  };

  const handleToggleAdPreview = () => {
    const nextVal = !flags.adPreviewMode;
    FeatureFlagService.setFlag('adPreviewMode', nextVal);
    showTempToast(nextVal ? 'Ad slot layout preview mode ON (CLS verification)' : 'Ad slot layout preview mode OFF');
  };

  const handleToggleExperimental = () => {
    const nextVal = !flags.enableExperimentalFeatures;
    FeatureFlagService.setFlag('enableExperimentalFeatures', nextVal);
    showTempToast(nextVal ? 'Experimental features enabled' : 'Experimental features disabled');
  };

  const handleResetFlags = () => {
    FeatureFlagService.resetToDefaults();
    showTempToast('Feature flags reset to strict defaults');
  };

  // Motion Preference Change
  const handleReducedMotionChange = (mode: 'system' | 'reduce' | 'no-preference') => {
    StorageService.setReducedMotion(mode);
    refreshState();
    showTempToast(`Motion preference updated to "${mode}"`);
  };

  // History Toggle
  const handleToggleHistory = () => {
    const nextState = !preferences.enableHistory;
    StorageService.setHistoryEnabled(nextState);
    refreshState();
    showTempToast(nextState ? 'Recent tools history enabled' : 'Recent tools history disabled & cleared');
  };

  // Clear Recents
  const handleClearRecents = () => {
    StorageService.clearRecentTools();
    refreshState();
    showTempToast('Recent tool history cleared');
  };

  // Remove individual recent
  const handleRemoveRecent = (slug: string) => {
    StorageService.removeRecentTool(slug);
    refreshState();
  };

  // Clear Favorites
  const handleClearFavorites = () => {
    StorageService.clearFavorites();
    refreshState();
    showTempToast('Bookmarks cleared');
  };

  // Remove individual favorite
  const handleRemoveFavorite = (slug: string) => {
    StorageService.removeFavorite(slug);
    refreshState();
  };

  // Perform Full Reset
  const executeFullReset = () => {
    FeatureFlagService.resetToDefaults();
    onClearAllData();
    refreshState();
    setShowConfirmClearModal(false);
    showTempToast('All local application storage has been purged');
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-8 space-y-4 border-cyan-500/20 text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_30px_rgba(6,182,212,0.25)]">
          <Settings className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Application Preferences & Storage
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
          Manage your visual display, accessibility animations, local metadata, and inspect browser memory.
        </p>

        {toastNotification && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-medium animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{toastNotification}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Appearance & Display */}
        <div className="glass-panel rounded-2xl p-6 space-y-5 border-slate-800">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Sun className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-100">Visual Theme</h2>
          </div>
          <p className="text-xs text-slate-400">
            Choose your preferred water-glass color scheme for high contrast or ambient twilight mode.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'dark', label: 'Dark Mode', icon: Moon },
              { id: 'light', label: 'Light Mode', icon: Sun },
              { id: 'system', label: 'System Auto', icon: Sliders },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onThemeChange(item.id as 'dark' | 'light' | 'system')}
                className={`py-3 px-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-2 border transition-all ${
                  theme === item.id
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Reduced Motion & Accessibility */}
        <div className="glass-panel rounded-2xl p-6 space-y-5 border-slate-800">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Activity className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-slate-100">Motion & Animations</h2>
          </div>
          <p className="text-xs text-slate-400">
            Control dynamic fluid water caustics, background drift, shimmer effects, and UI transitions.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'system', label: 'System Pref', desc: 'Sync with OS' },
              { id: 'reduce', label: 'Reduce Motion', desc: 'Minimal FX' },
              { id: 'no-preference', label: 'Full Motion', desc: 'Fluid Water' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleReducedMotionChange(opt.id as any)}
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center text-center gap-1 border transition-all ${
                  preferences.reducedMotion === opt.id
                    ? 'bg-teal-950 text-teal-300 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.25)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="text-[10px] text-slate-500 font-normal">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Recent Tools & Metadata */}
      <div className="glass-panel rounded-2xl p-6 space-y-5 border-slate-800">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">Recent Tools History</h2>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.enableHistory}
                onChange={handleToggleHistory}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              <span className="ml-2 text-xs font-medium text-slate-300">
                {preferences.enableHistory ? 'Enabled' : 'Disabled'}
              </span>
            </label>

            {preferences.recentTools.length > 0 && (
              <button
                type="button"
                onClick={handleClearRecents}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400">
          When enabled, {APP_CONFIG.name} locally saves only the short slug identifiers of the last 10 tools you visited to populate the "Recently Used" quick-access strip on the homepage.
        </p>

        {preferences.enableHistory && preferences.recentTools.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {preferences.recentTools.map((slug) => {
              const tool = getToolBySlug(slug);
              return (
                <div
                  key={slug}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                >
                  <a
                    href={`#tool/${slug}`}
                    className="hover:text-cyan-400 font-medium transition-colors"
                  >
                    {tool ? tool.name : slug}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecent(slug)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 rounded"
                    title="Remove from recents"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-500 text-center">
            {preferences.enableHistory
              ? 'No recent tools visited in this session yet.'
              : 'Recent tool recording is disabled. No history is stored.'}
          </div>
        )}
      </div>

      {/* Section 4: Bookmarks & Favorites */}
      <div className="glass-panel rounded-2xl p-6 space-y-5 border-slate-800">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Saved Bookmarks ({preferences.favoriteTools.length})
            </h2>
          </div>

          {preferences.favoriteTools.length > 0 && (
            <button
              type="button"
              onClick={handleClearFavorites}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
            >
              Clear All Bookmarks
            </button>
          )}
        </div>

        {preferences.favoriteTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {preferences.favoriteTools.map((slug) => {
              const tool = getToolBySlug(slug);
              return (
                <div
                  key={slug}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200"
                >
                  <a
                    href={`#tool/${slug}`}
                    className="hover:text-amber-300 font-medium truncate pr-2"
                  >
                    {tool ? tool.name : slug}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(slug)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded"
                    title="Remove bookmark"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-500 text-center">
            You have no saved bookmarked tools. Click the bookmark star icon on any tool card to add it here.
          </div>
        )}
      </div>

      {/* Section 5: Transparent Local Storage Inspector & Audit */}
      <div className="glass-panel rounded-2xl p-6 space-y-5 border-cyan-500/20">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Browser Storage Audit & Memory Verification
            </h2>
          </div>
          <button
            type="button"
            onClick={refreshState}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-colors flex items-center gap-1 text-xs"
            title="Refresh Storage Audit"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Audit</span>
          </button>
        </div>

        {/* Verification Guarantee Badge */}
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-300">
              Zero File Persistence Guarantee Confirmed
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Total storage used is <strong>{formatBytes(storageReport.totalBytes)}</strong> across {storageReport.itemCount} settings keys.
              <strong> 0 bytes</strong> of file contents, PDF pages, images, passwords, or user inputs are persisted.
            </p>
          </div>
        </div>

        {/* Table of stored items */}
        {storageReport.items.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Storage Key</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3 text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {storageReport.items.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-900/40">
                    <td className="p-3 text-cyan-300 font-semibold">{item.key}</td>
                    <td className="p-3 text-slate-400 font-sans">{item.description}</td>
                    <td className="p-3 text-right text-slate-300">{formatBytes(item.bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-500 text-center">
            Local storage is completely empty.
          </div>
        )}
      </div>

      {/* Section 6: Feature Flags & Ad Slot Architecture (Disabled by Default) */}
      <div className="glass-panel rounded-2xl p-6 space-y-5 border-cyan-500/20">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Feature Flags & Monetization Subsystem
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetFlags}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-colors flex items-center gap-1 text-xs"
            title="Reset feature flags to defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Flags</span>
          </button>
        </div>

        {/* Informational Callout */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
          <div className="font-semibold text-cyan-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Zero Third-Party Provider Guarantee:</span>
          </div>
          <p>
            All ad placeholders operate with strict client-side isolation. No ad network SDKs (such as Google AdSense, Prebid, or Taboola), cookies, or telemetry tracking pixels are loaded or requested under any circumstances.
          </p>
        </div>

        {/* Flag Toggles List */}
        <div className="space-y-3">
          {/* Flag 1: enableAds */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Enable Ad Slots (Global)</span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                    flags.enableAds
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {flags.enableAds ? 'Active' : 'Disabled (Default)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Controls visibility of non-intrusive ad slot containers situated strictly outside user upload dropzones and primary buttons.
              </p>
            </div>

            <button
              type="button"
              id="feature-flag-toggle-ads"
              onClick={handleToggleAds}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                flags.enableAds
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {flags.enableAds ? 'Turn Off' : 'Enable'}
            </button>
          </div>

          {/* Flag 2: adPreviewMode */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Developer Geometry Preview</span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                    flags.adPreviewMode
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {flags.adPreviewMode ? 'Previewing' : 'Off (Default)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualizes stable responsive dimensions (Leaderboard 728×90, Rectangle 300×250) for Cumulative Layout Shift (CLS = 0) auditing without network requests.
              </p>
            </div>

            <button
              type="button"
              id="feature-flag-toggle-ad-preview"
              onClick={handleToggleAdPreview}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                flags.adPreviewMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {flags.adPreviewMode ? 'Hide Geometry' : 'Preview Geometry'}
            </button>
          </div>

          {/* Flag 3: enableTelemetry */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4 opacity-75">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Telemetry & User Tracking</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  Locked: Permanently Disabled
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hardware & privacy invariant. Analytics, telemetry pings, and fingerprinting scripts are hardcoded off.
              </p>
            </div>

            <span className="text-xs font-mono text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 shrink-0">
              0 Trackers
            </span>
          </div>

          {/* Flag 4: enableExperimentalFeatures */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Experimental Web Tools</span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                    flags.enableExperimentalFeatures
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {flags.enableExperimentalFeatures ? 'Enabled' : 'Disabled (Default)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Toggles preview access to cutting-edge browser utilities and WebAssembly experimental pipelines.
              </p>
            </div>

            <button
              type="button"
              id="feature-flag-toggle-experimental"
              onClick={handleToggleExperimental}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                flags.enableExperimentalFeatures
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)]'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {flags.enableExperimentalFeatures ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 7: Full Data Reset */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border-rose-500/30 bg-rose-950/10">
        <div className="flex items-center gap-2.5 text-rose-300">
          <Trash2 className="w-5 h-5" />
          <h2 className="text-sm font-semibold">User-Controlled Data Purge</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Instantly purge all saved bookmarks, recently visited tool records, and UI preferences from this browser's <code>localStorage</code> and <code>sessionStorage</code>.
        </p>

        <button
          type="button"
          id="settings-clear-all-data-btn"
          onClick={() => setShowConfirmClearModal(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/40 flex items-center gap-2 transition-all shadow-sm"
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Clear All Local Application Data</span>
        </button>
      </div>

      {/* Clear Confirmation Modal */}
      {showConfirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 space-y-5 border-rose-500/40 bg-slate-950 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Reset All Local Data?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will erase your bookmarks ({preferences.favoriteTools.length} tools), your recent tools history, and reset your theme to default.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClearModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeFullReset}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Confirm & Purge Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

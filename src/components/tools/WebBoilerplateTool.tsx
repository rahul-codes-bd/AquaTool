import React, { useState } from 'react';
import { GeneratorTools } from '../../services/generatorTools';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import {
  FileCode,
  Globe,
  Code,
  Shield,
  RotateCcw,
  AlertTriangle,
  Eye,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Share2
} from 'lucide-react';

export const WebBoilerplateTool: React.FC<{ defaultTab?: 'html' | 'robots' | 'sitemap' | 'og' }> = ({
  defaultTab = 'html',
}) => {
  const [activeTab, setActiveTab] = useState<'html' | 'robots' | 'sitemap' | 'og'>(defaultTab);

  // View mode for HTML (Code vs Live Sandbox Iframe Preview)
  const [htmlViewMode, setHtmlViewMode] = useState<'code' | 'preview'>('preview');

  // HTML State
  const defaultHtmlState = {
    title: 'My Web Project',
    description: 'A fast, accessible, privacy-first web application built with modern standards.',
    framework: 'tailwind' as 'tailwind' | 'bootstrap' | 'pico' | 'water' | 'none',
    font: 'jakarta' as 'jakarta' | 'inter' | 'roboto' | 'playfair' | 'fira' | 'system',
    cdnScripts: 'none' as 'alpine' | 'htmx' | 'react' | 'lucide' | 'none',
    includeOg: true,
    includeFavicon: true,
    author: 'AquaTools User',
    language: 'en',
    darkModeTemplate: true,
  };
  const [htmlState, setHtmlState] = useState(defaultHtmlState);

  // Robots State
  const defaultRobotsState = {
    allowAll: true,
    blockAiBots: true,
    sitemapUrl: 'https://example.com/sitemap.xml',
    disallowPaths: '/admin/\n/private/\n/api/',
    allowPaths: '/public/\n/assets/',
    crawlDelay: 0,
  };
  const [robotsState, setRobotsState] = useState(defaultRobotsState);

  // Sitemap State
  const defaultSitemapState = {
    domain: 'https://example.com',
    pages: '/\n/about\n/tools\n/privacy\n/contact\n/blog',
    changefreq: 'weekly' as const,
    priority: '0.8',
  };
  const [sitemapState, setSitemapState] = useState(defaultSitemapState);

  // OG State
  const defaultOgState = {
    title: 'AquaTools — 100% Client-Side Web Utility Suite',
    description: 'Fast, secure, local browser utilities for developers and creators. No server tracking or data storage.',
    url: 'https://example.com',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop',
    siteName: 'AquaTools',
    twitterHandle: '@aquatools',
    type: 'website' as 'website' | 'article' | 'product' | 'profile',
    locale: 'en_US',
    previewTarget: 'facebook' as 'facebook' | 'twitter' | 'discord' | 'google',
  };
  const [ogState, setOgState] = useState(defaultOgState);

  // Generation logic
  let generatedCode = '';
  let fileName = '';

  if (activeTab === 'html') {
    generatedCode = GeneratorTools.generateHtmlBoilerplate({
      title: htmlState.title,
      description: htmlState.description,
      framework: htmlState.framework,
      font: htmlState.font,
      cdnScripts: htmlState.cdnScripts,
      includeOg: htmlState.includeOg,
      includeFavicon: htmlState.includeFavicon,
      author: htmlState.author,
      language: htmlState.language,
      darkModeTemplate: htmlState.darkModeTemplate,
    });
    fileName = 'index.html';
  } else if (activeTab === 'robots') {
    generatedCode = GeneratorTools.generateRobotsTxt({
      allowAll: robotsState.allowAll,
      blockAiBots: robotsState.blockAiBots,
      sitemapUrl: robotsState.sitemapUrl,
      disallowPaths: robotsState.disallowPaths.split('\n').map((p) => p.trim()).filter(Boolean),
      allowPaths: robotsState.allowPaths.split('\n').map((p) => p.trim()).filter(Boolean),
      crawlDelay: robotsState.crawlDelay > 0 ? robotsState.crawlDelay : undefined,
    });
    fileName = 'robots.txt';
  } else if (activeTab === 'sitemap') {
    const today = new Date().toISOString().split('T')[0];
    const pathList = sitemapState.pages.split('\n').map((p) => p.trim()).filter(Boolean);
    const sitemapItems = pathList.map((p) => {
      const cleanPath = p.startsWith('/') ? p : `/${p}`;
      return {
        loc: `${sitemapState.domain.replace(/\/+$/, '')}${cleanPath}`,
        lastmod: today,
        changefreq: sitemapState.changefreq,
        priority: sitemapState.priority,
      };
    });
    generatedCode = GeneratorTools.generateSitemapXml(sitemapItems);
    fileName = 'sitemap.xml';
  } else if (activeTab === 'og') {
    generatedCode = GeneratorTools.generateOpenGraphTags({
      title: ogState.title,
      description: ogState.description,
      url: ogState.url,
      imageUrl: ogState.imageUrl,
      siteName: ogState.siteName,
      twitterHandle: ogState.twitterHandle,
      type: ogState.type,
      locale: ogState.locale,
    });
    fileName = 'opengraph-tags.html';
  }

  const handleResetCurrentTab = () => {
    if (activeTab === 'html') setHtmlState(defaultHtmlState);
    else if (activeTab === 'robots') setRobotsState(defaultRobotsState);
    else if (activeTab === 'sitemap') setSitemapState(defaultSitemapState);
    else if (activeTab === 'og') setOgState(defaultOgState);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-1 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('html')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'html'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5 text-cyan-400" />
          <span>HTML5 Boilerplate</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('robots')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'robots'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span>Robots.txt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sitemap')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'sitemap'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-teal-400" />
          <span>Sitemap.xml</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('og')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'og'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Open Graph & Social Cards</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls Column */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {activeTab === 'html' && 'HTML5 Project Settings'}
              {activeTab === 'robots' && 'Robots.txt Crawler Directives'}
              {activeTab === 'sitemap' && 'Sitemap.xml URL Parameters'}
              {activeTab === 'og' && 'Open Graph & Social Card Tags'}
            </h4>
            <button
              type="button"
              onClick={handleResetCurrentTab}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* HTML Form */}
          {activeTab === 'html' && (
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Page Title</label>
                <input
                  type="text"
                  value={htmlState.title}
                  onChange={(e) => setHtmlState({ ...htmlState, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Meta Description</label>
                <input
                  type="text"
                  value={htmlState.description}
                  onChange={(e) => setHtmlState({ ...htmlState, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">CSS Framework</label>
                  <select
                    value={htmlState.framework}
                    onChange={(e) => setHtmlState({ ...htmlState, framework: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="tailwind">Tailwind CSS (CDN script)</option>
                    <option value="bootstrap">Bootstrap 5 (CDN CSS)</option>
                    <option value="pico">Pico.css (Minimal Classless)</option>
                    <option value="water">Water.css (Automatic Reset)</option>
                    <option value="none">Pure HTML5 / Clean Reset</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Typography / Font</label>
                  <select
                    value={htmlState.font}
                    onChange={(e) => setHtmlState({ ...htmlState, font: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="jakarta">Plus Jakarta Sans</option>
                    <option value="inter">Inter</option>
                    <option value="roboto">Roboto</option>
                    <option value="playfair">Playfair Display (Editorial)</option>
                    <option value="fira">Fira Code (Monospace)</option>
                    <option value="system">Native System UI</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">JavaScript Libraries (CDN)</label>
                <select
                  value={htmlState.cdnScripts}
                  onChange={(e) => setHtmlState({ ...htmlState, cdnScripts: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="none">None (Vanilla JavaScript)</option>
                  <option value="alpine">Alpine.js (Lightweight Reactive)</option>
                  <option value="htmx">HTMX (Dynamic HTML Extensions)</option>
                  <option value="lucide">Lucide Icons CDN</option>
                  <option value="react">React 18 + Babel (Rapid Prototyping)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={htmlState.includeOg}
                    onChange={(e) => setHtmlState({ ...htmlState, includeOg: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Include Open Graph tags</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={htmlState.includeFavicon}
                    onChange={(e) => setHtmlState({ ...htmlState, includeFavicon: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Include Favicon tags</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={htmlState.darkModeTemplate}
                    onChange={(e) => setHtmlState({ ...htmlState, darkModeTemplate: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Dark mode canvas styling</span>
                </label>
              </div>
            </div>
          )}

          {/* Robots Form */}
          {activeTab === 'robots' && (
            <div className="space-y-3.5 text-xs">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-medium">
                  <input
                    type="checkbox"
                    checked={robotsState.allowAll}
                    onChange={(e) => setRobotsState({ ...robotsState, allowAll: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Allow standard crawlers to index site root (Allow: /)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-medium">
                  <input
                    type="checkbox"
                    checked={robotsState.blockAiBots}
                    onChange={(e) => setRobotsState({ ...robotsState, blockAiBots: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Block AI crawlers & LLM scrapers (GPTBot, CCBot, ClaudeBot, etc.)</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Sitemap URL</label>
                <input
                  type="text"
                  value={robotsState.sitemapUrl}
                  onChange={(e) => setRobotsState({ ...robotsState, sitemapUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Disallowed Paths (one per line)</label>
                <textarea
                  rows={3}
                  value={robotsState.disallowPaths}
                  onChange={(e) => setRobotsState({ ...robotsState, disallowPaths: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Allowed Exception Paths (one per line)</label>
                <textarea
                  rows={2}
                  value={robotsState.allowPaths}
                  onChange={(e) => setRobotsState({ ...robotsState, allowPaths: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Sitemap Form */}
          {activeTab === 'sitemap' && (
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Canonical Website Domain</label>
                <input
                  type="text"
                  value={sitemapState.domain}
                  onChange={(e) => setSitemapState({ ...sitemapState, domain: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Change Frequency</label>
                  <select
                    value={sitemapState.changefreq}
                    onChange={(e) => setSitemapState({ ...sitemapState, changefreq: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="always">Always</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Default Priority</label>
                  <select
                    value={sitemapState.priority}
                    onChange={(e) => setSitemapState({ ...sitemapState, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="1.0">1.0 (Homepage / Highest)</option>
                    <option value="0.8">0.8 (Primary Section Pages)</option>
                    <option value="0.5">0.5 (Standard Content / Blog)</option>
                    <option value="0.3">0.3 (Archive / Secondary)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Page Paths (one per line)</label>
                <textarea
                  rows={5}
                  value={sitemapState.pages}
                  onChange={(e) => setSitemapState({ ...sitemapState, pages: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* OG Form */}
          {activeTab === 'og' && (
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-medium">Card Title</label>
                  <span className={`text-[10px] font-mono ${ogState.title.length > 60 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {ogState.title.length}/60 recommended
                  </span>
                </div>
                <input
                  type="text"
                  value={ogState.title}
                  onChange={(e) => setOgState({ ...ogState, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-medium">Description</label>
                  <span className={`text-[10px] font-mono ${ogState.description.length > 160 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {ogState.description.length}/160 recommended
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={ogState.description}
                  onChange={(e) => setOgState({ ...ogState, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Canonical URL</label>
                  <input
                    type="text"
                    value={ogState.url}
                    onChange={(e) => setOgState({ ...ogState, url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Site Name</label>
                  <input
                    type="text"
                    value={ogState.siteName}
                    onChange={(e) => setOgState({ ...ogState, siteName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">OG Image URL (1200x630px recommended)</label>
                <input
                  type="text"
                  value={ogState.imageUrl}
                  onChange={(e) => setOgState({ ...ogState, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Twitter / X Handle</label>
                  <input
                    type="text"
                    value={ogState.twitterHandle}
                    onChange={(e) => setOgState({ ...ogState, twitterHandle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Social Preview Target</label>
                  <select
                    value={ogState.previewTarget}
                    onChange={(e) => setOgState({ ...ogState, previewTarget: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="facebook">Facebook / LinkedIn Card</option>
                    <option value="twitter">Twitter / X Large Card</option>
                    <option value="discord">Discord Embed</option>
                    <option value="google">Google Search Snippet</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Output & Live Preview Column */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                {fileName}
              </span>
              {activeTab === 'html' && (
                <div className="flex p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setHtmlViewMode('preview')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 ${
                      htmlViewMode === 'preview'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Live Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHtmlViewMode('code')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 ${
                      htmlViewMode === 'code'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Code</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <CopyButton textToCopy={generatedCode} label="Copy" />
              <DownloadButton
                content={generatedCode}
                fileName={fileName}
                mimeType={
                  activeTab === 'sitemap'
                    ? 'application/xml'
                    : activeTab === 'robots'
                    ? 'text/plain'
                    : 'text/html'
                }
                label="Download"
              />
            </div>
          </div>

          {/* Body Preview Switch */}
          {activeTab === 'html' && htmlViewMode === 'preview' ? (
            <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-800 bg-white shadow-inner">
              <iframe
                title="Live HTML5 Sandbox Preview"
                srcDoc={generatedCode}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full border-0"
              />
            </div>
          ) : activeTab === 'og' ? (
            <div className="space-y-4">
              {/* Simulated Social Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <span>Simulated {ogState.previewTarget.toUpperCase()} Share Card</span>
                </div>

                {ogState.previewTarget === 'google' ? (
                  <div className="p-3 bg-white text-slate-900 rounded-lg space-y-1 font-sans">
                    <div className="text-xs text-slate-500 truncate">{ogState.url}</div>
                    <div className="text-blue-700 hover:underline text-sm font-medium cursor-pointer truncate">
                      {ogState.title}
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2">
                      {ogState.description}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                    <div className="w-full h-36 bg-slate-950 flex items-center justify-center overflow-hidden">
                      <img
                        src={ogState.imageUrl}
                        alt="OG Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-cyan-400">
                        {new URL(ogState.url || 'https://example.com').hostname}
                      </span>
                      <h5 className="text-xs font-bold text-slate-100 line-clamp-1">
                        {ogState.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {ogState.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Code below preview */}
              <pre className="h-44 p-4 rounded-xl bg-slate-950 text-cyan-300 text-xs font-mono overflow-auto border border-slate-800">
                {generatedCode}
              </pre>
            </div>
          ) : (
            <pre className="h-80 p-4 rounded-xl bg-slate-950 text-cyan-300 text-xs font-mono overflow-auto border border-slate-800">
              {generatedCode}
            </pre>
          )}

          {/* Verification Disclaimer */}
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2.5 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-cyan-300">
                {activeTab === 'html' && 'CDN & CSP Verification Disclaimer'}
                {activeTab === 'robots' && 'Search Engine Indexing Disclaimer'}
                {activeTab === 'sitemap' && 'Canonical Status Code Disclaimer'}
                {activeTab === 'og' && 'Social Media Cache Disclaimer'}
              </span>
              <p className="text-[11px] leading-relaxed">
                {activeTab === 'html' &&
                  'External CDN scripts and fonts should be verified with Subresource Integrity (SRI) hashes and configured in your Content Security Policy (CSP) prior to production deployment.'}
                {activeTab === 'robots' &&
                  'Robots.txt directives guide compliant search bots but do not enforce access control. Verify path patterns to prevent accidentally blocking CSS or JavaScript assets required for mobile rendering.'}
                {activeTab === 'sitemap' &&
                  'Ensure all URLs specified in sitemap.xml resolve to active HTTP 200 responses and match your canonical <link rel="canonical"> tags. Search engines may penalize 404 or redirected URLs.'}
                {activeTab === 'og' &&
                  'Platforms like Facebook, Twitter, and LinkedIn cache Open Graph tags when a link is first shared. Use the Facebook Sharing Debugger or Twitter Card Validator to refresh cached card assets.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

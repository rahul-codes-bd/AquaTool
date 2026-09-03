import React, { useState } from 'react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { ImageTools } from '../../services/imageTools';
import { Layers, Download, RefreshCw, Smile, Image as ImageIcon, RotateCcw, AlertTriangle, Globe } from 'lucide-react';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';

export const FaviconGeneratorTool: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'upload' | 'text'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Text / Emoji Maker state
  const [iconText, setIconText] = useState('⚡');
  const [bgColor, setBgColor] = useState('#06b6d4');
  const [textColor, setTextColor] = useState('#ffffff');
  const [shape, setShape] = useState<'rounded' | 'circle' | 'square'>('rounded');

  const [result, setResult] = useState<{
    zipBlob: Blob;
    previewUrls: Record<string, string>;
    htmlSnippet: string;
  } | null>(null);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const uploaded = files[0];
    setFile(uploaded);
    setIsGenerating(true);
    setProgress(30);

    try {
      setProgress(60);
      const pkg = await ImageTools.generateFaviconPackage(uploaded);
      setProgress(100);
      setResult(pkg);
    } catch (e) {
      console.error('Failed to build favicon package', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromText = async () => {
    setIsGenerating(true);
    setProgress(40);
    try {
      setProgress(75);
      const pkg = await ImageTools.generateFaviconFromText(iconText, {
        backgroundColor: bgColor,
        textColor,
        shape,
      });
      setProgress(100);
      setResult(pkg);
    } catch (e) {
      console.error('Failed to build text favicon package', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setIconText('⚡');
    setBgColor('#06b6d4');
    setTextColor('#ffffff');
    setShape('rounded');
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveMode('upload');
              setResult(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'upload'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Image/Logo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('text');
              setResult(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'text'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smile className="w-3.5 h-3.5 text-sky-400" />
            <span>Create from Emoji / Text</span>
          </button>
        </div>
      </div>

      {activeMode === 'upload' && !result && (
        <FileDropzone
          accept="image/*"
          onFilesSelected={handleFile}
          title="Upload logo or icon to generate complete Favicon Pack"
          subtitle="Generates 16x16, 32x32, 48x48, 180x180 (iOS), 192x192 & 512x512 (PWA) + webmanifest + HTML tags in a ZIP."
        />
      )}

      {activeMode === 'text' && !result && (
        <div className="glass-panel rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Emoji or Character(s)</label>
              <input
                type="text"
                maxLength={4}
                value={iconText}
                onChange={(e) => setIconText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center font-bold text-lg text-slate-100"
                placeholder="⚡ or AQ"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Icon Shape</label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
              >
                <option value="rounded">Rounded Rectangle</option>
                <option value="circle">Circle</option>
                <option value="square">Square (Full Bleed)</option>
              </select>
            </div>
          </div>

          {/* Quick emoji presets */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">Popular Icons:</span>
            {['⚡', '🚀', '🔥', '💎', '🌊', '⭐', '🛠️', '✨', '💻', '🔒'].map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setIconText(em)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-base"
              >
                {em}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGenerateFromText}
            className="w-full py-3 rounded-xl aqua-glow-button text-white text-xs font-semibold flex items-center justify-center gap-2 shadow"
          >
            <Layers className="w-4 h-4" />
            <span>Generate Full Favicon Suite</span>
          </button>
        </div>
      )}

      {isGenerating && (
        <ProgressBar progress={progress} stageText="Rendering icon layers and packaging ZIP bundle..." />
      )}

      {result && (
        <div className="space-y-6">
          {/* Header Action Card */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>Favicon Package Ready</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Full multi-resolution bundle (16px, 32px, 48px, iOS Apple Touch, Android PWA) with site.webmanifest.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Generate Another</span>
              </button>
              <DownloadButton
                blob={result.zipBlob}
                fileName="aquatools-favicon-package.zip"
                label="Download ZIP Suite"
              />
            </div>
          </div>

          {/* Live Browser Tab Preview Mockup */}
          <div className="glass-panel rounded-2xl p-6 space-y-3">
            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Live Browser Tab Preview</span>
            </h5>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
              {/* Chrome/Safari-style mock tab strip */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-3 flex items-center gap-2 px-3 py-1 rounded-t-lg bg-slate-900 border-t border-x border-slate-700 max-w-xs shadow">
                  <div className="w-4 h-4 rounded shrink-0 overflow-hidden flex items-center justify-center">
                    {result.previewUrls['favicon-32x32.png'] ? (
                      <img
                        src={result.previewUrls['favicon-32x32.png']}
                        alt="Tab Favicon Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-3 h-3 bg-cyan-400 rounded-sm" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-200 truncate">
                    My Web Project — Home
                  </span>
                </div>
              </div>
              <div className="p-3 text-center text-xs text-slate-500">
                Simulated 16px/32px tab icon rendering in modern browsers.
              </div>
            </div>
          </div>

          {/* Icon Grid Preview */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Generated Resolutions
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(result.previewUrls).map(([name, url]) => (
                <div
                  key={name}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center gap-2 text-center"
                >
                  <div className="w-14 h-14 flex items-center justify-center bg-slate-950 rounded-lg p-1.5 border border-slate-800">
                    <img src={url} alt={name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 truncate w-full">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* HTML Snippet */}
          <div className="glass-panel rounded-2xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <h5 className="text-xs font-semibold text-slate-300">HTML &lt;head&gt; Integration Tags</h5>
              <CopyButton textToCopy={result.htmlSnippet} label="Copy HTML Tags" />
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-cyan-300 text-xs font-mono overflow-x-auto border border-slate-800">
              {result.htmlSnippet}
            </pre>
          </div>

          {/* Verification Disclaimer */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-300">Browser Cache Verification Disclaimer</span>
              <p>
                Browsers cache favicons aggressively. When updating icons on a production site, append a version query
                string (e.g. <code className="text-cyan-300">/favicon-32x32.png?v=2</code>) in your HTML tags, or
                perform a hard browser refresh (Ctrl+F5 / Cmd+Shift+R) to verify live changes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

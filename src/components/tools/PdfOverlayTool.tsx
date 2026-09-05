import React, { useState } from 'react';
import {
  Layers,
  FileText,
  Download,
  Shield,
  AlertCircle,
  Settings,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { DownloadButton } from '../common/DownloadButton';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfOverlayConfig, PdfEngineResult } from '../../types/pdf';

export function PdfOverlayTool() {
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [overlayFile, setOverlayFile] = useState<File | null>(null);

  const [opacity, setOpacity] = useState<number>(0.9);
  const [scale, setScale] = useState<number>(1.0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [repeatFirstOverlayPage, setRepeatFirstOverlayPage] = useState<boolean>(true);
  const [targetPages, setTargetPages] = useState<string>('all');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [result, setResult] = useState<PdfEngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBaseSelect = (files: File[]) => {
    if (files.length) {
      setBaseFile(files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleOverlaySelect = (files: File[]) => {
    if (files.length) {
      setOverlayFile(files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleExecuteOverlay = async () => {
    if (!baseFile || !overlayFile) {
      setError('Please provide both a Base Document and an Overlay/Letterhead PDF.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgressMsg('Compositing overlay pages onto base document...');

      const config: PdfOverlayConfig = {
        mode: 'overlay',
        opacity,
        scale,
        offsetX,
        offsetY,
        repeatFirstOverlayPage,
        targetPages,
      };

      const res = await PdfEngine.overlayPdf(baseFile, overlayFile, config, (pct, msg) => {
        setProgressMsg(msg);
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to apply PDF overlay.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            PDF Overlay & Letterhead Compositor
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Superimpose letterheads, corporate stationary, borders, or templates onto another PDF document.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local RAM Only</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-center gap-3 text-sm text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dual File Uploaders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Base Document */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            1. Base Document PDF
          </label>
          {!baseFile ? (
            <FileDropzone
              accept=".pdf,application/pdf"
              maxSizeMB={50}
              onFilesSelected={handleBaseSelect}
              title="Upload Base PDF"
              subtitle="The main document that receives the overlay"
            />
          ) : (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Base File:</span>
                <span className="text-sm text-slate-200 font-medium block truncate max-w-[200px]">
                  {baseFile.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBaseFile(null)}
                className="text-xs text-cyan-400 hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Overlay Document */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            2. Overlay / Letterhead PDF
          </label>
          {!overlayFile ? (
            <FileDropzone
              accept=".pdf,application/pdf"
              maxSizeMB={50}
              onFilesSelected={handleOverlaySelect}
              title="Upload Overlay / Letterhead PDF"
              subtitle="The graphic, border, or template to superimpose"
            />
          ) : (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Overlay File:</span>
                <span className="text-sm text-slate-200 font-medium block truncate max-w-[200px]">
                  {overlayFile.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOverlayFile(null)}
                className="text-xs text-cyan-400 hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Composition Options */}
      {baseFile && overlayFile && (
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Overlay & Layer Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Opacity ({Math.round(opacity * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Scale ({Math.round(scale * 100)}%)
              </label>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Offset (X, Y) pt</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={offsetX}
                  onChange={(e) => setOffsetX(parseInt(e.target.value, 10) || 0)}
                  className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  placeholder="X"
                />
                <input
                  type="number"
                  value={offsetY}
                  onChange={(e) => setOffsetY(parseInt(e.target.value, 10) || 0)}
                  className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  placeholder="Y"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Pages</label>
              <input
                type="text"
                value={targetPages}
                onChange={(e) => setTargetPages(e.target.value)}
                placeholder="all or 1-3, 5"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={repeatFirstOverlayPage}
                onChange={(e) => setRepeatFirstOverlayPage(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 bg-slate-950 border-slate-700"
              />
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Repeat First Overlay Page across all base pages
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Useful for single-page stationary or letterheads that should stamp on every page of a multi-page contract.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleExecuteOverlay}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? progressMsg || 'Overlaying...' : 'Compositing PDF Overlay'}
            </button>
          </div>

          {result && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-emerald-200 block">Overlay Applied!</span>
                <span className="text-xs text-emerald-400/80 font-mono">
                  {result.fileName} ({(result.fileSizeBytes / 1024).toFixed(1)} KB)
                </span>
              </div>
              <DownloadButton
                url={result.downloadUrl}
                fileName={result.fileName}
                label="Download Composited PDF"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

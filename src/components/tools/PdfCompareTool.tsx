import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GitCompare,
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sliders,
  Eye,
  Shield,
  AlertCircle,
  Layers,
  SplitSquareVertical,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { PdfRenderer } from '../../services/pdfRenderer';

export function PdfCompareTool() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);

  const [docA, setDocA] = useState<any | null>(null);
  const [docB, setDocB] = useState<any | null>(null);

  const [totalPagesA, setTotalPagesA] = useState<number>(0);
  const [totalPagesB, setTotalPagesB] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'diff' | 'slider'>('diff');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0..100

  const [canvasDataA, setCanvasDataA] = useState<string | null>(null);
  const [canvasDataB, setCanvasDataB] = useState<string | null>(null);
  const [diffDataUrl, setDiffDataUrl] = useState<string | null>(null);
  const [diffPercent, setDiffPercent] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const maxPages = Math.max(totalPagesA, totalPagesB);

  // Load Document A
  const handleSelectA = async (files: File[]) => {
    if (!files.length) return;
    try {
      setError(null);
      const f = files[0];
      setFileA(f);
      const doc = await PdfRenderer.loadPdfDocument(f);
      setDocA(doc);
      setTotalPagesA(doc.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load Document A. File may be corrupted or password protected.');
    }
  };

  // Load Document B
  const handleSelectB = async (files: File[]) => {
    if (!files.length) return;
    try {
      setError(null);
      const f = files[0];
      setFileB(f);
      const doc = await PdfRenderer.loadPdfDocument(f);
      setDocB(doc);
      setTotalPagesB(doc.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load Document B. File may be corrupted or password protected.');
    }
  };

  // Render & compute comparison for current page
  const renderComparison = useCallback(async () => {
    if (!docA || !docB) return;
    try {
      setIsLoading(true);
      setError(null);

      // Render page A
      let cA: HTMLCanvasElement | null = null;
      let dataA: string | null = null;
      if (currentPage <= totalPagesA) {
        const resA = await PdfRenderer.renderPage(docA, currentPage, scale);
        cA = resA.canvas;
        dataA = resA.dataUrl;
      }
      setCanvasDataA(dataA);

      // Render page B
      let cB: HTMLCanvasElement | null = null;
      let dataB: string | null = null;
      if (currentPage <= totalPagesB) {
        const resB = await PdfRenderer.renderPage(docB, currentPage, scale);
        cB = resB.canvas;
        dataB = resB.dataUrl;
      }
      setCanvasDataB(dataB);

      // Calculate pixel diff if both exist
      if (cA && cB) {
        const diffRes = PdfRenderer.comparePageCanvases(cA, cB, 0.08);
        setDiffDataUrl(diffRes.diffDataUrl);
        setDiffPercent(diffRes.diffPercentage);
      } else {
        setDiffDataUrl(null);
        setDiffPercent(100);
      }
    } catch (err: any) {
      console.error('Comparison render error:', err);
      setError('Failed to compare current pages.');
    } finally {
      setIsLoading(false);
    }
  }, [docA, docB, currentPage, scale, totalPagesA, totalPagesB]);

  useEffect(() => {
    if (docA && docB) {
      renderComparison();
    }
  }, [docA, docB, currentPage, scale, renderComparison]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentPage((p) => Math.min(maxPages || 1, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key.toLowerCase() === 'd') {
        setViewMode((m) => (m === 'diff' ? 'side-by-side' : 'diff'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maxPages]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            PDF Visual Comparator & Difference Diff
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Compare two versions of a document side-by-side with pixel-level difference highlighting and interactive curtain slider.
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

      {/* Dual Upload Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document A */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Original Document (Version A)
          </label>
          {!fileA ? (
            <FileDropzone
              accept=".pdf,application/pdf"
              maxSizeMB={50}
              onFilesSelected={handleSelectA}
              title="Upload PDF Version A"
              subtitle="The reference or initial document"
            />
          ) : (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">File A:</span>
                <span className="text-sm text-slate-200 font-medium block truncate max-w-[200px]">
                  {fileA.name} ({totalPagesA} pages)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFileA(null);
                  setDocA(null);
                }}
                className="text-xs text-cyan-400 hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Document B */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Modified Document (Version B)
          </label>
          {!fileB ? (
            <FileDropzone
              accept=".pdf,application/pdf"
              maxSizeMB={50}
              onFilesSelected={handleSelectB}
              title="Upload PDF Version B"
              subtitle="The new revision or modified document"
            />
          ) : (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">File B:</span>
                <span className="text-sm text-slate-200 font-medium block truncate max-w-[200px]">
                  {fileB.name} ({totalPagesB} pages)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFileB(null);
                  setDocB(null);
                }}
                className="text-xs text-cyan-400 hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Workspace */}
      {fileA && fileB && (
        <div className="space-y-6">
          {/* Comparison Controls Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('diff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  viewMode === 'diff' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Pixel Diff Overlay
              </button>
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  viewMode === 'side-by-side' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" /> Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  viewMode === 'slider' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Split Slider
              </button>
            </div>

            {/* Metrics Badge */}
            <div className="flex items-center gap-3">
              <div className="text-xs px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono">
                <span className="text-slate-400">Page Diff: </span>
                <span className={diffPercent > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {diffPercent.toFixed(2)}% Difference
                </span>
              </div>

              {/* Page Navigator */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono px-2 text-slate-300">
                  Page {currentPage} / {maxPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(maxPages, p + 1))}
                  disabled={currentPage >= maxPages}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono px-2 text-slate-300">{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Visual Presentation Stage */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex items-center justify-center min-h-[500px] overflow-auto">
            {isLoading ? (
              <div className="text-slate-500 text-sm">Rendering comparison...</div>
            ) : (
              <>
                {/* 1. PIXEL DIFF OVERLAY VIEW */}
                {viewMode === 'diff' && (
                  <div className="space-y-3 text-center">
                    <div className="inline-block shadow-2xl rounded border border-slate-700 overflow-hidden bg-white">
                      {diffDataUrl ? (
                        <img src={diffDataUrl} alt="Diff Overlay" className="max-w-full h-auto" />
                      ) : (
                        <div className="p-12 text-slate-600 text-sm">No Diff Available</div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center justify-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-red-500 inline-block" /> High-contrast red highlight = Added / Changed Content
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. SIDE BY SIDE VIEW */}
                {viewMode === 'side-by-side' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400 block text-center">
                        Document A (Page {currentPage})
                      </span>
                      <div className="shadow-xl rounded border border-slate-700 bg-white overflow-hidden flex items-center justify-center min-h-[400px]">
                        {canvasDataA ? (
                          <img src={canvasDataA} alt="Doc A" className="w-full h-auto object-contain" />
                        ) : (
                          <span className="text-slate-400 text-xs">Page does not exist in Document A</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400 block text-center">
                        Document B (Page {currentPage})
                      </span>
                      <div className="shadow-xl rounded border border-slate-700 bg-white overflow-hidden flex items-center justify-center min-h-[400px]">
                        {canvasDataB ? (
                          <img src={canvasDataB} alt="Doc B" className="w-full h-auto object-contain" />
                        ) : (
                          <span className="text-slate-400 text-xs">Page does not exist in Document B</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SPLIT CURTAIN SLIDER VIEW */}
                {viewMode === 'slider' && canvasDataA && canvasDataB && (
                  <div className="space-y-4 text-center">
                    <div
                      className="relative inline-block shadow-2xl rounded border border-slate-700 select-none overflow-hidden"
                      style={{ maxWidth: '100%' }}
                    >
                      {/* Base Image (Doc B) */}
                      <img src={canvasDataB} alt="Doc B" className="block max-w-full h-auto pointer-events-none" />

                      {/* Clipped Overlaid Image (Doc A) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPos}%` }}
                      >
                        <img
                          src={canvasDataA}
                          alt="Doc A"
                          className="max-w-none h-full"
                          style={{ width: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      {/* Divider bar */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 cursor-ew-resize shadow-lg"
                        style={{ left: `${sliderPos}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shadow-md">
                          ↔
                        </div>
                      </div>
                    </div>

                    <div className="max-w-md mx-auto flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">Doc A</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPos}
                        onChange={(e) => setSliderPos(parseInt(e.target.value, 10))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                      <span className="text-xs text-slate-400 font-mono">Doc B</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

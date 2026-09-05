import React, { useState } from 'react';
import {
  Grid,
  Columns,
  Download,
  FileText,
  Layers,
  Settings,
  AlertCircle,
  Shield,
  Split,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { DownloadButton } from '../common/DownloadButton';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfNUpConfig, PdfHalveConfig, PdfEngineResult } from '../../types/pdf';

interface PdfNUpToolProps {
  initialMode?: 'nup' | 'halve';
}

export function PdfNUpTool({ initialMode = 'nup' }: PdfNUpToolProps) {
  const [activeTab, setActiveTab] = useState<'nup' | 'halve'>(initialMode);
  const [file, setFile] = useState<File | null>(null);

  // N-Up options
  const [nupCount, setNupCount] = useState<2 | 4 | 6 | 9 | 16>(2);
  const [pageSize, setPageSize] = useState<'original' | 'a4' | 'letter' | 'a3'>('a4');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [addBorder, setAddBorder] = useState<boolean>(true);
  const [marginPt, setMarginPt] = useState<number>(20);
  const [spacingPt, setSpacingPt] = useState<number>(12);
  const [pageOrder, setPageOrder] = useState<'ltr' | 'ttb'>('ltr');

  // Halve options
  const [halveDirection, setHalveDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const [halveRange, setHalveRange] = useState<string>('all');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [result, setResult] = useState<PdfEngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (files: File[]) => {
    if (!files.length) return;
    const selected = files[0];
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }
    setFile(selected);
    setResult(null);
    setError(null);
  };

  const handleExecuteNUp = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);
      setProgressMsg('Compositing N-up pages onto sheets...');

      const config: PdfNUpConfig = {
        count: nupCount,
        pageSize,
        orientation,
        addBorder,
        marginPt,
        spacingPt,
        pageOrder,
      };

      const res = await PdfEngine.pagesPerSheet(file, config, (pct, msg) => {
        setProgressMsg(msg);
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to process N-up sheets.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteHalve = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);
      setProgressMsg('Splitting two-page spreads...');

      const config: PdfHalveConfig = {
        direction: halveDirection,
        pageRange: halveRange,
      };

      const res = await PdfEngine.halvePages(file, config, (pct, msg) => {
        setProgressMsg(msg);
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to split page spreads.');
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
            <Grid className="w-5 h-5 text-cyan-400" />
            PDF N-Up & Spread Halving
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Fit multiple pages per sheet (2-up, 4-up, 9-up) for handouts, or split scanned 2-page book spreads into single pages.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local RAM Only</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('nup');
            setResult(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'nup'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Grid className="w-4 h-4" />
          Pages Per Sheet (N-Up)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('halve');
            setResult(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'halve'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Split className="w-4 h-4" />
          Halve / Split Spreads
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-center gap-3 text-sm text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!file ? (
        <FileDropzone
          accept=".pdf,application/pdf"
          maxSizeMB={50}
          onFilesSelected={handleFileSelect}
          title={activeTab === 'nup' ? 'Upload PDF to Combine into N-Up Sheets' : 'Upload PDF with 2-Page Spreads to Split'}
          subtitle="Supports single and multi-page PDF documents"
        />
      ) : (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Loaded Document</span>
              <p className="text-slate-200 font-medium text-sm mt-0.5">{file.name}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Change File
            </button>
          </div>

          {/* TAB 1: N-UP CONFIGURATION */}
          {activeTab === 'nup' && (
            <div className="space-y-6">
              {/* Layout grid selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                  Pages Per Sheet Layout
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { count: 2, label: '2-in-1', desc: '1 col × 2 rows' },
                    { count: 4, label: '4-in-1', desc: '2 cols × 2 rows' },
                    { count: 6, label: '6-in-1', desc: '2 cols × 3 rows' },
                    { count: 9, label: '9-in-1', desc: '3 cols × 3 rows' },
                    { count: 16, label: '16-in-1', desc: '4 cols × 4 rows' },
                  ].map((item) => (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => setNupCount(item.count as any)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        nupCount === item.count
                          ? 'bg-cyan-950/50 border-cyan-500/80 text-cyan-200 shadow-md ring-1 ring-cyan-500/50'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <span className="text-base font-bold block">{item.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-1">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Geometry Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Output Sheet Size</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="a4">A4 (210 × 297 mm)</option>
                    <option value="letter">Letter (8.5 × 11 in)</option>
                    <option value="a3">A3 (297 × 420 mm)</option>
                    <option value="original">Match Original Page Size</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Sheet Orientation</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="auto">Auto (Best Fit Aspect)</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Reading Flow Order</label>
                  <select
                    value={pageOrder}
                    onChange={(e) => setPageOrder(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="ltr">Left to Right (Row by Row)</option>
                    <option value="ttb">Top to Bottom (Col by Col)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Outer Margin ({marginPt} pt)</label>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={marginPt}
                    onChange={(e) => setMarginPt(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Cell Spacing ({spacingPt} pt)</label>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={spacingPt}
                    onChange={(e) => setSpacingPt(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addBorder}
                      onChange={(e) => setAddBorder(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-600 bg-slate-950 border-slate-700"
                    />
                    <span className="text-xs text-slate-200">Draw Border Around Pages</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleExecuteNUp}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isProcessing ? progressMsg || 'Processing...' : `Generate ${nupCount}-in-1 Document`}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: HALVE SPREADS */}
          {activeTab === 'halve' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setHalveDirection('vertical')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    halveDirection === 'vertical'
                      ? 'bg-cyan-950/50 border-cyan-500/80 text-cyan-200 shadow-md ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                    <Split className="w-4 h-4 text-cyan-400" />
                    Vertical Cut (Left & Right Pages)
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Ideal for scanned 2-page book spreads, magazines, or 2-up PDFs that you want split into distinct portrait pages.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setHalveDirection('horizontal')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    halveDirection === 'horizontal'
                      ? 'bg-cyan-950/50 border-cyan-500/80 text-cyan-200 shadow-md ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                    <Split className="w-4 h-4 text-cyan-400 rotate-90" />
                    Horizontal Cut (Top & Bottom Pages)
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Ideal for split index cards, double presentation slides, or horizontally stacked two-page layouts.
                  </p>
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Page Range</label>
                <input
                  type="text"
                  value={halveRange}
                  onChange={(e) => setHalveRange(e.target.value)}
                  placeholder="all or 1-5, 8, 11-14"
                  className="w-full max-w-sm bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Type "all" to split every page, or specify ranges like "1-10, 15".
                </span>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleExecuteHalve}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isProcessing ? progressMsg || 'Splitting...' : 'Split Spreads into Single Pages'}
                </button>
              </div>
            </div>
          )}

          {/* Download Display */}
          {result && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-emerald-200 block">Processing Completed!</span>
                <span className="text-xs text-emerald-400/80 font-mono">
                  {result.fileName} ({result.pageCount} pages, {(result.fileSizeBytes / 1024).toFixed(1)} KB)
                </span>
              </div>
              <DownloadButton
                url={result.downloadUrl}
                fileName={result.fileName}
                label="Download Result PDF"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

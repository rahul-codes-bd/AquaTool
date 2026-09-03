import React, { useState } from 'react';
import {
  Minimize2,
  FileText,
  Sliders,
  Shield,
  AlertCircle,
  Sparkles,
  Download,
  CheckCircle2,
  Zap,
  Layers,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { DownloadButton } from '../common/DownloadButton';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';
import { PdfCompressConfig, PdfEngineResult } from '../../types/pdf';

export function PdfCompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  const [mode, setMode] = useState<PdfCompressConfig['mode']>('recommended');
  const [targetDpi, setTargetDpi] = useState<number>(120);
  const [imageQuality, setImageQuality] = useState<number>(0.7);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [stripMetadata, setStripMetadata] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressMsg, setProgressMsg] = useState<string>('');

  const [result, setResult] = useState<
    | (PdfEngineResult & {
        originalSize: number;
        compressedSize: number;
        savingsPct: number;
      })
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (files: File[]) => {
    if (!files.length) return;
    const selected = files[0];

    const validation = await PdfValidator.validatePdf(selected);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Invalid PDF file.');
      return;
    }

    try {
      setError(null);
      setFile(selected);
      setResult(null);
      const summary = await PdfEngine.inspectPdf(selected);
      setPageCount(summary.pageCount);
    } catch {
      setPageCount(1);
    }
  };

  const handlePresetChange = (preset: PdfCompressConfig['mode']) => {
    setMode(preset);
    if (preset === 'extreme') {
      setTargetDpi(72);
      setImageQuality(0.5);
      setGrayscale(false);
    } else if (preset === 'recommended') {
      setTargetDpi(120);
      setImageQuality(0.7);
      setGrayscale(false);
    } else if (preset === 'low') {
      setTargetDpi(150);
      setImageQuality(0.85);
      setGrayscale(false);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setProgress(5);
      setProgressMsg('Initializing client-side compression pipeline...');
      setError(null);

      const config: PdfCompressConfig = {
        mode,
        targetDpi,
        imageQuality,
        grayscale,
        stripMetadata,
        cleanUnusedObjects: true,
      };

      const res = await PdfEngine.compressPdf(file, config, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to compress PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (result?.downloadUrl) {
      PdfEngine.revokeUrl(result.downloadUrl);
    }
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Minimize2 className="w-5 h-5 text-cyan-400" />
            PDF Compressor & Size Optimizer
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Reduce PDF file sizes dramatically using lossy visual downsampling or lossless object stream compaction.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% In-Browser RAM</span>
        </div>
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
          title="Upload PDF to Compress & Shrink"
          subtitle="Supports multi-page documents, forms, and image-heavy PDFs"
        />
      ) : (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          {/* File Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Loaded Document</span>
              <p className="text-slate-200 font-medium text-sm mt-0.5">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB • {pageCount} page{pageCount > 1 ? 's' : ''})
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Change File</span>
            </button>
          </div>

          {/* Preset Cards */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Compression Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Extreme */}
              <button
                type="button"
                onClick={() => handlePresetChange('extreme')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === 'extreme'
                    ? 'bg-cyan-500/15 border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">Extreme</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    ~70% Small
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">72 DPI screen resolution for maximum size reduction.</p>
              </button>

              {/* Recommended */}
              <button
                type="button"
                onClick={() => handlePresetChange('recommended')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === 'recommended'
                    ? 'bg-cyan-500/15 border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-cyan-300">Recommended</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    ~55% Small
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">120 DPI balanced quality for clear text and small size.</p>
              </button>

              {/* Low / High Quality */}
              <button
                type="button"
                onClick={() => handlePresetChange('low')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === 'low'
                    ? 'bg-cyan-500/15 border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">Light / Crisp</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                    ~35% Small
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">150 DPI high fidelity preservation for fine prints.</p>
              </button>

              {/* Lossless Structural */}
              <button
                type="button"
                onClick={() => handlePresetChange('lossless-structural')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === 'lossless-structural'
                    ? 'bg-cyan-500/15 border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">Lossless</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                    Vectors Only
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Re-indexes streams & removes unreferenced objects.</p>
              </button>
            </div>
          </div>

          {/* Advanced / Custom Controls */}
          {mode !== 'lossless-structural' && (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* DPI Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Target Resolution</span>
                    <span className="text-cyan-400 font-mono">{targetDpi} DPI</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="200"
                    step="10"
                    value={targetDpi}
                    onChange={(e) => {
                      setTargetDpi(parseInt(e.target.value, 10));
                      setMode('custom');
                    }}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {/* JPEG Quality Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Image Quality</span>
                    <span className="text-cyan-400 font-mono">{Math.round(imageQuality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="0.95"
                    step="0.05"
                    value={imageQuality}
                    onChange={(e) => {
                      setImageQuality(parseFloat(e.target.value));
                      setMode('custom');
                    }}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-800/80 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={grayscale}
                    onChange={(e) => setGrayscale(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Convert to Grayscale / Monochrome (Extra Space Savings)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={stripMetadata}
                    onChange={(e) => setStripMetadata(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Sanitize & Strip Unused Metadata</span>
                </label>
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleCompress}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isProcessing ? progressMsg || 'Compressing...' : 'Compress PDF Document'}</span>
            </button>
          </div>

          {isProcessing && <ProgressBar progress={progress} stageText={progressMsg} />}

          {/* Results Summary Card */}
          {result && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">PDF Successfully Compressed!</h3>
                    <p className="text-xs text-slate-400">
                      Completed in {result.executionTimeMs}ms entirely in browser RAM.
                    </p>
                  </div>
                </div>

                <DownloadButton
                  url={result.downloadUrl}
                  fileName={result.fileName}
                  label="Download Compressed PDF"
                />
              </div>

              {/* Compression Metric Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Original Size</span>
                  <span className="text-sm font-mono text-slate-300 font-semibold">
                    {(result.originalSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Compressed Size</span>
                  <span className="text-sm font-mono text-emerald-400 font-semibold">
                    {(result.compressedSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Size Reduction</span>
                  <span className="text-sm font-mono text-cyan-400 font-bold flex items-center gap-1">
                    <ArrowDownRight className="w-4 h-4" />
                    {result.savingsPct}% Saved
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  Globe,
  Shield,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { DownloadButton } from '../common/DownloadButton';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';
import { PdfWebOptimizeConfig, PdfEngineResult } from '../../types/pdf';

export function PdfWebOptimizeTool() {
  const [file, setFile] = useState<File | null>(null);
  const [cleanStreams, setCleanStreams] = useState<boolean>(true);
  const [deflateStreams, setDeflateStreams] = useState<boolean>(true);
  const [removeUnused, setRemoveUnused] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressMsg, setProgressMsg] = useState<string>('');

  const [result, setResult] = useState<PdfEngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (files: File[]) => {
    if (!files.length) return;
    const selected = files[0];

    const validation = await PdfValidator.validatePdf(selected);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Invalid PDF file.');
      return;
    }

    setFile(selected);
    setResult(null);
    setError(null);
  };

  const handleOptimize = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setProgress(25);
      setProgressMsg('Optimizing object dictionaries and cross-reference streams...');
      setError(null);

      const config: PdfWebOptimizeConfig = {
        cleanObjectStreams: cleanStreams,
        deflateStreams,
        removeUnusedResources: removeUnused,
        sortPageTree: true,
      };

      const res = await PdfEngine.optimizeWebStreams(file, config, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to optimize PDF for web viewing.');
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
            <Globe className="w-5 h-5 text-cyan-400" />
            PDF Web Stream & Object Optimizer
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Organize document streams and compress object tables for faster page loading and reduced streaming latency.
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
          title="Upload PDF for Web Stream Optimization"
          subtitle="Compacts internal object trees and stream dictionaries"
        />
      ) : (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Loaded Document</span>
              <p className="text-slate-200 font-medium text-sm mt-0.5">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
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

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Stream Optimization Settings
            </span>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={cleanStreams}
                onChange={(e) => setCleanStreams(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Enable Object Stream Packing (Groups small objects into compact compressed streams)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={deflateStreams}
                onChange={(e) => setDeflateStreams(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Deflate uncompressed content streams</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={removeUnused}
                onChange={(e) => setRemoveUnused(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Purge orphaned cross-reference indices and unreferenced objects</span>
            </label>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-1.5 text-slate-300">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Info className="w-4 h-4" />
              <span>Stream Compression vs. Byte-Range Linearization</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This in-browser tool optimizes object dictionaries and stream deflating. True Fast Web View (linearization with byte offset primary hint tables) requires heavy native binary compilation (QPDF) currently in our WebAssembly porting roadmap.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleOptimize}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isProcessing ? progressMsg || 'Optimizing...' : 'Optimize Web Streams'}</span>
            </button>
          </div>

          {isProcessing && <ProgressBar progress={progress} stageText={progressMsg} />}

          {result && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Document Streams Successfully Optimized!</h3>
                    <p className="text-xs text-slate-400">
                      Completed stream compaction in {result.executionTimeMs}ms.
                    </p>
                  </div>
                </div>

                <DownloadButton
                  url={result.downloadUrl}
                  fileName={result.fileName}
                  label="Download Optimized PDF"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

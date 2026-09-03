import React, { useState } from 'react';
import {
  FileCheck2,
  Shield,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  Zap,
  Lock,
  Layers,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { DownloadButton } from '../common/DownloadButton';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';
import { PdfArchivalConfig, PdfEngineResult } from '../../types/pdf';

export function PdfArchivalTool() {
  const [file, setFile] = useState<File | null>(null);
  const [standard, setStandard] = useState<PdfArchivalConfig['standard']>('PDF/A-1b');
  const [colorProfile, setColorProfile] = useState<PdfArchivalConfig['colorProfile']>('sRGB');
  const [title, setTitle] = useState<string>('');
  const [stripJavaScript, setStripJavaScript] = useState<boolean>(true);

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
    setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    setResult(null);
    setError(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setProgress(20);
      setProgressMsg('Injecting ISO PDF/A XMP metadata and OutputIntents...');
      setError(null);

      const config: PdfArchivalConfig = {
        standard,
        colorProfile,
        title,
        creator: 'AquaTools Client-Side PDF/A Archival Engine',
        stripJavaScript,
        stripMultimedia: true,
      };

      const res = await PdfEngine.prepareArchivalPdf(file, config, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to prepare PDF/A archival document.');
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
            <FileCheck2 className="w-5 h-5 text-cyan-400" />
            PDF/A Long-Term Archival Converter
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Standardize documents for ISO 19005 archival preservation with sRGB OutputIntents and XMP schema metadata.
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
          title="Upload PDF to Standardize for PDF/A"
          subtitle="Prepares contracts, legal filings, and records for permanent archival storage"
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

          {/* Configuration Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Archival ISO Standard
                </label>
                <select
                  value={standard}
                  onChange={(e) => setStandard(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="PDF/A-1b">PDF/A-1b (ISO 19005-1: Basic visual preservation)</option>
                  <option value="PDF/A-2b">PDF/A-2b (ISO 19005-2: JPEG2000 & transparency)</option>
                  <option value="PDF/A-3b">PDF/A-3b (ISO 19005-3: Embedded raw attachments)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Color Profile OutputIntent
                </label>
                <select
                  value={colorProfile}
                  onChange={(e) => setColorProfile(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="sRGB">sRGB IEC61966-2.1 (Standard RGB)</option>
                  <option value="CMYK">U.S. Web Coated (SWOP) v2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Archival Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document Title"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={stripJavaScript}
                  onChange={(e) => setStripJavaScript(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="font-semibold text-slate-200">
                  Strip executable JavaScript, external URL launchers, & audio/video streams (Required by PDF/A)
                </span>
              </label>
            </div>
          </div>

          {/* Honest Technical Notice Banner */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-1.5 text-slate-300">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Info className="w-4 h-4" />
              <span>Technical Scope & Standards Note</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This client-side tool injects standard Adobe/ISO XMP metadata schemas, declares sRGB OutputIntents, and purges active scripts. Documents with non-embedded proprietary system fonts may require rasterization to guarantee 100% strict VeraPDF conformance.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleConvert}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isProcessing ? progressMsg || 'Standardizing...' : 'Sanitize & Convert to PDF/A'}</span>
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
                    <h3 className="text-sm font-bold text-slate-100">PDF/A Document Successfully Generated!</h3>
                    <p className="text-xs text-slate-400">
                      Standardized with {standard} profile in {result.executionTimeMs}ms.
                    </p>
                  </div>
                </div>

                <DownloadButton
                  url={result.downloadUrl}
                  fileName={result.fileName}
                  label="Download PDF/A Document"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

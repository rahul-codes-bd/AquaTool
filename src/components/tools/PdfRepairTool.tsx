import React, { useState } from 'react';
import {
  Wrench,
  Shield,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  FileX,
  Zap,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { DownloadButton } from '../common/DownloadButton';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfEngineResult, PdfRepairDiagnostic } from '../../types/pdf';

export function PdfRepairTool() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressMsg, setProgressMsg] = useState<string>('');

  const [result, setResult] = useState<(PdfEngineResult & { diagnostic: PdfRepairDiagnostic }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (files: File[]) => {
    if (!files.length) return;
    setFile(files[0]);
    setResult(null);
    setError(null);
  };

  const handleRepair = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setProgress(15);
      setProgressMsg('Scanning binary header and stream offsets...');
      setError(null);

      const res = await PdfEngine.repairPdf(file, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to repair PDF.');
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
            <Wrench className="w-5 h-5 text-cyan-400" />
            PDF Repair & Stream Salvage
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Diagnose and recover damaged or unreadable PDF files by rebuilding cross-reference tables and cleaning corrupted stream objects.
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
          title="Upload Damaged or Unreadable PDF"
          subtitle="Recovers files with broken trailers, invalid offsets, and corrupt XRef indices"
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

          {!result && !isProcessing && (
            <div className="text-center py-6 space-y-4">
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                AquaTools will perform byte-level structural analysis to sanitize object streams and reconstruct the cross-reference table.
              </p>
              <button
                type="button"
                onClick={handleRepair}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 inline-flex items-center gap-2 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Run Diagnostic & Repair Engine</span>
              </button>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} stageText={progressMsg} />}

          {/* Diagnostic Result Report */}
          {result && (
            <div className="space-y-6">
              <div
                className={`p-5 rounded-2xl border ${
                  result.diagnostic.healthStatus === 'UNRECOVERABLE'
                    ? 'bg-red-950/40 border-red-800/80'
                    : 'bg-slate-950 border-emerald-500/40'
                } space-y-4 shadow-xl`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        result.diagnostic.healthStatus === 'UNRECOVERABLE'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {result.diagnostic.healthStatus === 'UNRECOVERABLE' ? (
                        <FileX className="w-5 h-5" />
                      ) : (
                        <FileCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        {result.diagnostic.healthStatus === 'UNRECOVERABLE'
                          ? 'PDF Repair Inconclusive'
                          : 'PDF Successfully Diagnosed & Repaired!'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {result.diagnostic.recoveredPages} page{result.diagnostic.recoveredPages !== 1 ? 's' : ''}{' '}
                        salvaged and reserialized in {result.executionTimeMs}ms.
                      </p>
                    </div>
                  </div>

                  {result.success && result.downloadUrl && (
                    <DownloadButton
                      url={result.downloadUrl}
                      fileName={result.fileName || `repaired-${file.name}`}
                      label="Download Repaired PDF"
                    />
                  )}
                </div>

                {/* Diagnostic Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Header Signature</span>
                    <span
                      className={`text-xs font-mono font-semibold ${
                        result.diagnostic.binaryHeaderFound ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {result.diagnostic.binaryHeaderFound ? 'Valid %PDF-1.7' : 'Replaced'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">XRef Cross-Reference</span>
                    <span className="text-xs font-mono font-semibold text-emerald-400">Reconstructed</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Recovered Pages</span>
                    <span className="text-xs font-mono font-semibold text-cyan-400">
                      {result.diagnostic.recoveredPages} Pages
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Health Rating</span>
                    <span
                      className={`text-xs font-mono font-semibold ${
                        result.diagnostic.healthStatus === 'HEALTHY' || result.diagnostic.healthStatus === 'REPAIRED'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {result.diagnostic.healthStatus}
                    </span>
                  </div>
                </div>

                {/* Repairs Applied Log */}
                {result.diagnostic.repairsApplied.length > 0 && (
                  <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Repairs & Optimizations Applied:
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4 font-mono">
                      {result.diagnostic.repairsApplied.map((rep, idx) => (
                        <li key={idx}>{rep}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  RefreshCw,
  Sparkles,
  Lock,
  CheckCircle2,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputCard } from '../common/OutputCard';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';

export const PdfFlattenTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    fileName: string;
    pageCount: number;
    fileSizeBytes: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (result?.url) {
        PdfEngine.revokeUrl(result.url);
      }
      PdfEngine.cleanupAllTrackedUrls();
    };
  }, [result]);

  const handleFileSelect = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const selectedFile = files[0];

    const validation = await PdfValidator.validatePdf(selectedFile);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Invalid PDF file.');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setResult(null);
  };

  const handleFlatten = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(20);
    setProgressText('Scanning document for interactive AcroForm fields & annotations...');
    setError(null);

    try {
      const res = await PdfEngine.flattenPdf(file, (pct, msg) => {
        setProgress(pct);
        setProgressText(msg);
      });

      setResult({
        blob: res.blob!,
        url: res.downloadUrl!,
        fileName: res.fileName || `flattened-${file.name}`,
        pageCount: res.pageCount || 1,
        fileSizeBytes: res.fileSizeBytes || res.blob!.size,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to flatten PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {!file && (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-lg font-bold text-white mb-1">Flatten PDF Forms & Annotations</h2>
            <p className="text-xs text-slate-400">
              Permanently lock interactive form fields, dropdowns, checkboxes, and comment layers into static, non-editable PDF vectors.
            </p>
          </div>
          <FileDropzone
            accept=".pdf,application/pdf"
            multiple={false}
            maxSizeMB={50}
            onFilesSelected={handleFileSelect}
            title="Drop PDF to Flatten Form Fields"
            subtitle="Burns form values directly into the document so they cannot be altered"
          />
        </div>
      )}

      {file && !result && (
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{file.name}</h3>
                <p className="text-xs text-slate-400">{PdfValidator.formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Change file</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200 block">Locks Form Inputs</span>
                <span className="text-slate-400 text-[11px]">
                  Converts text boxes, checkboxes, radio buttons, and digital stamps into native immutable page graphics.
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200 block">Universal Viewer Compatibility</span>
                <span className="text-slate-400 text-[11px]">
                  Ensures all devices and printers display filled form fields exactly as entered without rendering glitches.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleFlatten}
              disabled={isProcessing}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Flatten & Secure PDF</span>
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <ProgressBar progress={progress} stageText={progressText} />
      )}

      {result && (
        <OutputCard
          title="PDF Flattened Successfully"
          downloadUrl={result.url}
          fileName={result.fileName}
          stats={{
            'File Name': result.fileName,
            'Total Pages': result.pageCount,
            'File Size': PdfValidator.formatFileSize(result.fileSizeBytes),
            'Form Status': 'Locked / Non-Editable',
            'Privacy': '100% Client-Side In-Memory',
          }}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Search,
  Shield,
  FileText,
  AlertTriangle,
  Sparkles,
  Lock,
  Clock,
  Cpu,
  CheckCircle2,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { PdfRenderer } from '../../services/pdfRenderer';
import { PdfValidator } from '../../services/pdfValidator';

export function PdfOcrTool() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
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
    setExtractedText('');
    setError(null);
  };

  const handleExtractText = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setProgress(10);
      setProgressMsg('Inspecting client-side PDF document text layers...');
      setError(null);

      const pdfDocJs = await PdfRenderer.loadPdfDocument(file);
      const numPages = pdfDocJs.numPages;
      let fullText = '';

      for (let p = 1; p <= numPages; p++) {
        setProgress(10 + Math.round((p / numPages) * 80));
        setProgressMsg(`Extracting text layer from page ${p} of ${numPages}...`);

        const page = await pdfDocJs.getPage(p);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items.map((item: any) => item.str || '').join(' ');
        fullText += `--- Page ${p} ---\n` + (pageStrings.trim() || '[No embedded vector text found on this scanned page]') + '\n\n';
      }

      setExtractedText(fullText.trim());
    } catch (err: any) {
      console.error(err);
      setError('Failed to read text layer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setExtractedText('');
    setError(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            PDF OCR & Text Layer Extractor
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Privacy-first text extraction and status notice for multi-page OCR WebAssembly integration.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero Cloud Uploads</span>
        </div>
      </div>

      {/* Honest Coming-Soon & Privacy Roadmap Banner */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
        <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
          <Clock className="w-5 h-5" />
          <span>OCR Architecture & Privacy Notice</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Most online "Free OCR" websites secretly transmit your private PDF scans to remote third-party servers. AquaTools strictly enforces <span className="text-cyan-300 font-semibold">100% Client-Side Processing</span>. We are currently testing our local <span className="font-mono text-amber-200">Tesseract.js WebAssembly engine</span> to inject invisible searchable OCR text layers into bitmap scans without a single byte leaving your machine.
        </p>
      </div>

      {!file ? (
        <FileDropzone
          accept=".pdf,application/pdf"
          maxSizeMB={50}
          onFilesSelected={handleFileSelect}
          title="Upload PDF to Inspect Text Layers"
          subtitle="Extract existing vector text layers locally in your browser memory"
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

          {!extractedText && !isProcessing && (
            <div className="text-center py-6 space-y-4">
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Scan document page streams for embedded text layers directly in browser memory.
              </p>
              <button
                type="button"
                onClick={handleExtractText}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 inline-flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Extract Client-Side Text Layer</span>
              </button>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} stageText={progressMsg} />}

          {extractedText && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Extracted Document Text
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={extractedText}
                rows={12}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

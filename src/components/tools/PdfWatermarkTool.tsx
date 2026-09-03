import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  RefreshCw,
  Sparkles,
  Sliders,
  Eye,
  Type,
  Palette,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputCard } from '../common/OutputCard';
import { PdfRenderer } from '../../services/pdfRenderer';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';

export const PdfWatermarkTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Watermark Settings
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState<number>(44);
  const [colorHex, setColorHex] = useState<string>('#e11d48'); // Red default
  const [opacity, setOpacity] = useState<number>(0.25);
  const [rotationDegrees, setRotationDegrees] = useState<number>(45);
  const [position, setPosition] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('center');
  const [targetPages, setTargetPages] = useState<'all' | 'odd' | 'even'>('all');

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
    setIsProcessing(true);
    setProgress(20);
    setProgressText('Rendering live watermark preview...');
    setResult(null);

    try {
      const doc = await PdfRenderer.loadPdfDocument(selectedFile);
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setPreviewPage(1);

      const renderRes = await PdfRenderer.renderPage(doc, 1, 1.2, 'image/png');
      setPreviewDataUrl(renderRes.dataUrl);
      setProgress(100);
    } catch (err: any) {
      setError(err?.message || 'Failed to load PDF preview.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyWatermark = async () => {
    if (!file) return;
    if (!text.trim()) {
      setError('Please enter watermark text.');
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setProgressText('Embedding text watermarks into PDF stream...');
    setError(null);

    try {
      const res = await PdfEngine.addWatermark(
        file,
        {
          text,
          fontSize,
          colorHex,
          opacity,
          rotationDegrees,
          position,
          targetPages,
        },
        (pct, msg) => {
          setProgress(pct);
          setProgressText(msg);
        }
      );

      setResult({
        blob: res.blob!,
        url: res.downloadUrl!,
        fileName: res.fileName || `watermarked-${file.name}`,
        pageCount: res.pageCount || totalPages,
        fileSizeBytes: res.fileSizeBytes || res.blob!.size,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to apply watermark.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null);
    setPreviewDataUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {!file && (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <FileDropzone
            accept=".pdf,application/pdf"
            multiple={false}
            maxSizeMB={50}
            onFilesSelected={handleFileSelect}
            title="Drop PDF to Add Watermark"
            subtitle="Add custom text stamps, copyright notices, or confidentiality markers locally"
          />
        </div>
      )}

      {file && !result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Watermark Controls */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                  <div>
                    <span className="font-semibold text-white">{file.name}</span>
                    <span className="text-slate-500 mx-2">•</span>
                    <span className="text-slate-400">{totalPages} Pages</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                </div>

                {/* Text & Quick Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Watermark Text</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE', 'APPROVED'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setText(preset)}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:text-cyan-300 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Font Size */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Font Size</span>
                      <span className="font-mono text-cyan-300">{fontSize} pt</span>
                    </div>
                    <input
                      type="range"
                      min="14"
                      max="96"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  {/* Opacity */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Opacity</span>
                      <span className="font-mono text-cyan-300">{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  {/* Rotation */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Angle</span>
                      <span className="font-mono text-cyan-300">{rotationDegrees}°</span>
                    </div>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="5"
                      value={rotationDegrees}
                      onChange={(e) => setRotationDegrees(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="w-24 px-2 py-1 bg-black/40 border border-white/15 rounded-lg text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Position & Target Pages */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Position</label>
                    <select
                      value={position}
                      onChange={(e: any) => setPosition(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="center">Center (Diagonal)</option>
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Pages</label>
                    <select
                      value={targetPages}
                      onChange={(e: any) => setTargetPages(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="all">All Pages ({totalPages})</option>
                      <option value="odd">Odd Pages Only</option>
                      <option value="even">Even Pages Only</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleApplyWatermark}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Apply Watermark & Export PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Watermark Overlay Preview */}
            <div className="lg:col-span-6 bg-slate-950/80 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="flex items-center justify-between w-full mb-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Real-Time Watermark Preview</span>
                </span>
                <span className="font-mono text-cyan-300 text-[11px]">
                  Page 1 of {totalPages}
                </span>
              </div>

              {previewDataUrl ? (
                <div className="relative max-w-full max-h-[450px] bg-white rounded shadow-2xl overflow-hidden border border-slate-700">
                  <img
                    src={previewDataUrl}
                    alt="Watermark Preview Page"
                    className="max-h-[420px] object-contain"
                  />

                  {/* Watermark Visual Overlay */}
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none p-4"
                    style={{
                      justifyContent:
                        position === 'top-left' || position === 'bottom-left'
                          ? 'flex-start'
                          : position === 'top-right' || position === 'bottom-right'
                          ? 'flex-end'
                          : 'center',
                      alignItems:
                        position === 'top-left' || position === 'top-right'
                          ? 'flex-start'
                          : position === 'bottom-left' || position === 'bottom-right'
                          ? 'flex-end'
                          : 'center',
                    }}
                  >
                    <span
                      style={{
                        transform: `rotate(${rotationDegrees}deg)`,
                        color: colorHex,
                        opacity,
                        fontSize: `${Math.round(fontSize * 0.6)}px`,
                        fontWeight: 'bold',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {text}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">Rendering preview...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <ProgressBar progress={progress} stageText={progressText} />
      )}

      {result && (
        <OutputCard
          title="Watermark Applied Successfully"
          downloadUrl={result.url}
          fileName={result.fileName}
          stats={{
            'File Name': result.fileName,
            'Total Pages': result.pageCount,
            'Watermark Text': text,
            'File Size': PdfValidator.formatFileSize(result.fileSizeBytes),
            'Privacy': '100% Client-Side In-Memory',
          }}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

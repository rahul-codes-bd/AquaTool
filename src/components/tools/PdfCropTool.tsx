import React, { useState, useEffect } from 'react';
import {
  Crop,
  Download,
  RefreshCw,
  Sparkles,
  Sliders,
  Eye,
  Layers,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputCard } from '../common/OutputCard';
import { PdfRenderer } from '../../services/pdfRenderer';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';

export const PdfCropTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Insets in Points (1 pt = 1/72 inch, ~0.35 mm)
  const [topPt, setTopPt] = useState<number>(20);
  const [bottomPt, setBottomPt] = useState<number>(20);
  const [leftPt, setLeftPt] = useState<number>(20);
  const [rightPt, setRightPt] = useState<number>(20);
  const [targetPages, setTargetPages] = useState<'all' | 'odd' | 'even' | string>('all');

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
    setProgressText('Rendering preview for crop calibration...');
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

  const handlePageSwitch = async (newPage: number) => {
    if (!pdfDoc || newPage < 1 || newPage > totalPages) return;
    setPreviewPage(newPage);
    try {
      const renderRes = await PdfRenderer.renderPage(pdfDoc, newPage, 1.2, 'image/png');
      setPreviewDataUrl(renderRes.dataUrl);
    } catch {
      // Safe fallback
    }
  };

  const applyPreset = (t: number, r: number, b: number, l: number) => {
    setTopPt(t);
    setRightPt(r);
    setBottomPt(b);
    setLeftPt(l);
  };

  const handleCrop = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(15);
    setProgressText('Applying geometric crop boxes to PDF pages...');
    setError(null);

    try {
      const res = await PdfEngine.cropPdf(
        file,
        {
          topPt,
          rightPt,
          bottomPt,
          leftPt,
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
        fileName: res.fileName || `cropped-${file.name}`,
        pageCount: res.pageCount || totalPages,
        fileSizeBytes: res.fileSizeBytes || res.blob!.size,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to crop PDF document.');
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
            title="Drop PDF here to Crop Margins"
            subtitle="Trim whitespace, remove unwanted headers, or adjust printable boundaries locally"
          />
        </div>
      )}

      {file && !result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Controls Left Column */}
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

                {/* Crop Insets Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Quick Margin Presets
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => applyPreset(15, 15, 15, 15)}
                      className="py-1.5 px-2 bg-white/5 border border-white/10 hover:border-cyan-500/40 rounded-xl text-xs text-slate-300 transition-colors"
                    >
                      Trim 5mm
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(30, 30, 30, 30)}
                      className="py-1.5 px-2 bg-white/5 border border-white/10 hover:border-cyan-500/40 rounded-xl text-xs text-slate-300 transition-colors"
                    >
                      Trim 10mm
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(50, 0, 50, 0)}
                      className="py-1.5 px-2 bg-white/5 border border-white/10 hover:border-cyan-500/40 rounded-xl text-xs text-slate-300 transition-colors"
                    >
                      Cut Top & Bottom
                    </button>
                  </div>
                </div>

                {/* Individual Margin Sliders */}
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Top Crop Margin</span>
                      <span className="font-mono text-cyan-300">{topPt} pt (~{(topPt * 0.352).toFixed(1)} mm)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={topPt}
                      onChange={(e) => setTopPt(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Bottom Crop Margin</span>
                      <span className="font-mono text-cyan-300">{bottomPt} pt (~{(bottomPt * 0.352).toFixed(1)} mm)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={bottomPt}
                      onChange={(e) => setBottomPt(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Left Crop Margin</span>
                      <span className="font-mono text-cyan-300">{leftPt} pt (~{(leftPt * 0.352).toFixed(1)} mm)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={leftPt}
                      onChange={(e) => setLeftPt(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Right Crop Margin</span>
                      <span className="font-mono text-cyan-300">{rightPt} pt (~{(rightPt * 0.352).toFixed(1)} mm)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={rightPt}
                      onChange={(e) => setRightPt(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                {/* Target Pages */}
                <div className="pt-2 border-t border-white/5">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Apply Crop To</label>
                  <select
                    value={targetPages}
                    onChange={(e) => setTargetPages(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">All Pages ({totalPages})</option>
                    <option value="odd">Odd Pages Only</option>
                    <option value="even">Even Pages Only</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCrop}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Apply Crop & Export PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Preview Right Column */}
            <div className="lg:col-span-6 bg-slate-950/80 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="flex items-center justify-between w-full mb-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Crop Boundary Preview</span>
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={previewPage <= 1}
                      onClick={() => handlePageSwitch(previewPage - 1)}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                    >
                      Prev
                    </button>
                    <span className="font-mono text-cyan-300 text-[11px]">
                      {previewPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={previewPage >= totalPages}
                      onClick={() => handlePageSwitch(previewPage + 1)}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {previewDataUrl ? (
                <div className="relative max-w-full max-h-[450px] bg-white rounded shadow-2xl overflow-hidden border border-slate-700">
                  <img
                    src={previewDataUrl}
                    alt="Crop Preview"
                    className="max-h-[420px] object-contain opacity-90"
                  />

                  {/* Visual Crop Overlay Guides */}
                  <div
                    className="absolute border-2 border-cyan-400 bg-cyan-400/10 pointer-events-none transition-all duration-150"
                    style={{
                      top: `${Math.min(45, (topPt / 400) * 100)}%`,
                      bottom: `${Math.min(45, (bottomPt / 400) * 100)}%`,
                      left: `${Math.min(45, (leftPt / 300) * 100)}%`,
                      right: `${Math.min(45, (rightPt / 300) * 100)}%`,
                    }}
                  >
                    <div className="absolute top-1 left-1 bg-cyan-500 text-slate-950 font-mono text-[8px] font-bold px-1 rounded">
                      Crop Area
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">Loading preview canvas...</div>
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
          title="PDF Cropped Successfully"
          downloadUrl={result.url}
          fileName={result.fileName}
          stats={{
            'File Name': result.fileName,
            'Total Pages': result.pageCount,
            'File Size': PdfValidator.formatFileSize(result.fileSizeBytes),
            'Margins Applied': `T:${topPt} R:${rightPt} B:${bottomPt} L:${leftPt} pt`,
            'Privacy': '100% Client-Side In-Memory',
          }}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

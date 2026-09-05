import React, { useState, useEffect } from 'react';
import {
  Image,
  Download,
  RefreshCw,
  Sparkles,
  Sliders,
  Archive,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputCard } from '../common/OutputCard';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';

interface ConvertedImage {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
  name: string;
}

interface PdfToImagesToolProps {
  defaultFormat?: 'jpeg' | 'png';
}

export const PdfToImagesTool: React.FC<PdfToImagesToolProps> = ({ defaultFormat = 'png' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'jpeg' | 'png'>(defaultFormat);
  const [scale, setScale] = useState<number>(2.0); // 2x default for crisp renders
  const [quality, setQuality] = useState<number>(0.92);
  const [pageRange, setPageRange] = useState<string>('all');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [zipResult, setZipResult] = useState<{
    blob: Blob;
    url: string;
    fileName: string;
    fileSizeBytes: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (zipResult?.url) {
        PdfEngine.revokeUrl(zipResult.url);
      }
      PdfEngine.cleanupAllTrackedUrls();
    };
  }, [zipResult]);

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
    setConvertedImages([]);
    setZipResult(null);

    try {
      const summary = await PdfEngine.inspectPdf(selectedFile);
      setTotalPages(summary.pageCount);
    } catch {
      setTotalPages(1);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setProgressText('Initializing canvas rendering engine...');
    setError(null);

    try {
      const res = await PdfEngine.pdfToImages(
        file,
        {
          format,
          scale,
          quality,
          targetPages: pageRange,
        },
        (pct, msg) => {
          setProgress(pct);
          setProgressText(msg);
        }
      );

      setConvertedImages(res.images);

      if (res.blob && res.downloadUrl) {
        setZipResult({
          blob: res.blob,
          url: res.downloadUrl,
          fileName: res.fileName || `images-${file.name}.${format === 'jpeg' ? 'zip' : 'zip'}`,
          fileSizeBytes: res.fileSizeBytes || res.blob.size,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to render PDF to images.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (img: ConvertedImage) => {
    const a = document.createElement('a');
    a.href = img.dataUrl;
    a.download = img.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setConvertedImages([]);
    setZipResult(null);
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
            title={`Drop PDF to convert to ${format.toUpperCase()}`}
            subtitle="High-resolution client-side canvas rendering (No server upload)"
          />
        </div>
      )}

      {file && !convertedImages.length && !isProcessing && (
        <div className="space-y-6">
          {/* Options Panel */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
              <div className="text-slate-300">
                <span className="font-semibold text-white">{file.name}</span>
                <span className="text-slate-500 mx-2">•</span>
                <span>{totalPages} Pages</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Change file</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Image Format */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Output Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      format === 'png'
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    PNG (Lossless)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('jpeg')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      format === 'jpeg'
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    JPG (Smaller)
                  </button>
                </div>
              </div>

              {/* Render Resolution / DPI Scale */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Resolution (DPI)</label>
                <select
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value={1.0}>1x Standard (72 DPI - Fast)</option>
                  <option value={1.5}>1.5x Medium (108 DPI)</option>
                  <option value={2.0}>2x High Res (144 DPI - Recommended)</option>
                  <option value={3.0}>3x Ultra Crisp (216 DPI - Print Quality)</option>
                </select>
              </div>

              {/* Page Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pages to Convert
                </label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="all, or 1-3, 5, odd, even"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            {/* JPEG Quality Slider (if JPEG) */}
            {format === 'jpeg' && (
              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>JPEG Quality</span>
                  <span className="text-cyan-300 font-mono">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            )}
          </div>

          {/* Convert Action Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleConvert}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Convert to {format.toUpperCase()} Images</span>
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <ProgressBar progress={progress} stageText={progressText} />
      )}

      {convertedImages.length > 0 && zipResult && (
        <div className="space-y-6">
          <OutputCard
            title={`${convertedImages.length} Image${convertedImages.length > 1 ? 's' : ''} Rendered`}
            downloadUrl={zipResult.url}
            fileName={zipResult.fileName}
            stats={{
              'File Name': zipResult.fileName,
              'Total Images': convertedImages.length,
              'Archive Size': PdfValidator.formatFileSize(zipResult.fileSizeBytes),
              'Resolution': `${scale}x scale (${format.toUpperCase()})`,
              'Privacy': '100% Client-Side In-Memory',
            }}
            onReset={handleReset}
          />

          {/* Grid of Converted Images with Individual Download */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Preview & Download Single Pages</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {convertedImages.map((img) => (
                <div
                  key={img.pageNumber}
                  className="bg-slate-900/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      Page {img.pageNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">
                      {format}
                    </span>
                  </div>

                  <div className="aspect-[3/4] bg-black/40 rounded-lg overflow-hidden flex items-center justify-center p-1 shadow-inner">
                    <img
                      src={img.dataUrl}
                      alt={`Page ${img.pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {PdfValidator.formatFileSize(img.blob.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(img)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Image,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Download,
  RefreshCw,
  Sparkles,
  Layers,
  Settings2,
  FileCheck,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputCard } from '../common/OutputCard';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';
import { PdfImageToPdfConfig } from '../../types/pdf';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

export const ImagesToPdfTool: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'US-Letter' | 'Fit-Image' | 'A3' | 'A5'>('A4');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [marginPt, setMarginPt] = useState<number>(0);
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
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      if (result?.url) {
        PdfEngine.revokeUrl(result.url);
      }
      PdfEngine.cleanupAllTrackedUrls();
    };
  }, [result]);

  const handleFilesSelected = (files: File[]) => {
    if (!files || files.length === 0) return;

    const validFiles: ImageItem[] = [];
    for (const f of files) {
      const validation = PdfValidator.validateImageForPdf(f);
      if (validation.isValid) {
        validFiles.push({
          id: `${f.name}-${Date.now()}-${Math.random()}`,
          file: f,
          previewUrl: URL.createObjectURL(f),
          name: f.name,
          size: f.size,
        });
      }
    }

    if (validFiles.length === 0) {
      setError('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    setError(null);
    setImages((prev) => [...prev, ...validFiles]);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const removeImage = (index: number) => {
    const item = images[index];
    if (item) URL.revokeObjectURL(item.previewUrl);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError('Please add at least one image.');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setProgressText('Preparing images for PDF composition...');
    setError(null);

    try {
      const config: PdfImageToPdfConfig = {
        pageSize,
        orientation,
        marginPt,
      };

      const res = await PdfEngine.imagesToPdf(
        images.map((i) => i.file),
        config,
        (pct, msg) => {
          setProgress(pct);
          setProgressText(msg);
        }
      );

      setResult({
        blob: res.blob!,
        url: res.downloadUrl!,
        fileName: res.fileName || 'images-to-pdf.pdf',
        pageCount: res.pageCount || images.length,
        fileSizeBytes: res.fileSizeBytes || res.blob!.size,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to convert images to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <FileDropzone
          accept="image/png,image/jpeg,image/webp,image/jpg"
          multiple={true}
          maxSizeMB={50}
          onFilesSelected={handleFilesSelected}
          title="Drop Images Here (JPG, PNG, WebP)"
          subtitle="Combine multiple photos into a single PDF document in your browser"
        />
      </div>

      {images.length > 0 && !result && (
        <div className="space-y-6">
          {/* Options & Settings */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-xl grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-lg">
            {/* Page Size */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Page Size</label>
              <select
                value={pageSize}
                onChange={(e: any) => setPageSize(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="A4">A4 (Standard 210 × 297 mm)</option>
                <option value="US-Letter">US Letter (8.5 × 11")</option>
                <option value="Fit-Image">Fit to Image Size (No Margins)</option>
                <option value="A3">A3 (Large 297 × 420 mm)</option>
                <option value="A5">A5 (Compact 148 × 210 mm)</option>
              </select>
            </div>

            {/* Page Orientation */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Orientation</label>
              <select
                value={orientation}
                onChange={(e: any) => setOrientation(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="auto">Auto (Match image aspect ratio)</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            {/* Page Margins */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Page Margins</span>
                <span className="text-cyan-300 font-mono">{marginPt} pt</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={marginPt}
                onChange={(e) => setMarginPt(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0 (Full Bleed)</span>
                <span>20 pt (Standard)</span>
                <span>40 pt (Spacious)</span>
              </div>
            </div>
          </div>

          {/* Image List / Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 px-1">
              <span className="font-semibold">{images.length} Images Added</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear all</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="group bg-slate-900/90 border border-white/10 rounded-xl p-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      Page #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="aspect-[3/4] bg-black/40 rounded overflow-hidden flex items-center justify-center p-1">
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400 truncate text-center">
                    {img.name}
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-2 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-slate-300"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'right')}
                      disabled={idx === images.length - 1}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-slate-300"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleConvert}
              disabled={isProcessing}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Convert to PDF ({images.length} Pages)</span>
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <ProgressBar progress={progress} stageText={progressText} />
      )}

      {result && (
        <OutputCard
          title="PDF Generated Successfully"
          downloadUrl={result.url}
          fileName={result.fileName}
          stats={{
            'File Name': result.fileName,
            'Total Pages': result.pageCount,
            'File Size': PdfValidator.formatFileSize(result.fileSizeBytes),
            'Page Setup': `${pageSize} (${orientation})`,
            'Privacy': '100% Client-Side In-Memory',
          }}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

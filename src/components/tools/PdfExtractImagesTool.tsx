import React, { useState, useEffect } from 'react';
import {
  Image,
  Download,
  Archive,
  Eye,
  Shield,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Maximize2,
  FileText,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { DownloadButton } from '../common/DownloadButton';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';
import { PdfExtractedImage } from '../../types/pdf';

export function PdfExtractImagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<PdfExtractedImage[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [zipSize, setZipSize] = useState<number>(0);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<PdfExtractedImage | null>(null);

  useEffect(() => {
    return () => {
      if (zipUrl) PdfEngine.revokeUrl(zipUrl);
    };
  }, [zipUrl]);

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
      setImages([]);
      setZipUrl(null);
    } catch {
      setError('Failed to inspect document.');
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setProgress(10);
      setProgressMsg('Extracting embedded graphics from PDF pages...');
      setError(null);

      const res = await PdfEngine.extractImages(file, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      setImages(res.images);
      if (res.zipUrl && res.zipBlob) {
        setZipUrl(res.zipUrl);
        setZipSize(res.zipBlob.size);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to extract images from PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (img: PdfExtractedImage) => {
    const a = document.createElement('a');
    a.href = img.dataUrl;
    a.download = img.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    if (zipUrl) PdfEngine.revokeUrl(zipUrl);
    setFile(null);
    setImages([]);
    setZipUrl(null);
    setError(null);
    setPreviewImage(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Image className="w-5 h-5 text-cyan-400" />
            PDF Image & Graphics Extractor
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Extract raw embedded raster images, illustrations, and photos from PDF files with zero compression loss.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local RAM Extraction</span>
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
          title="Upload PDF to Extract Images"
          subtitle="Extract embedded graphics from magazines, scans, textbooks, and reports"
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

          {images.length === 0 && !isProcessing && (
            <div className="text-center py-6 space-y-4">
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Ready to scan and extract all embedded visual media and page snapshots in full resolution.
              </p>
              <button
                type="button"
                onClick={handleExtract}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 inline-flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Extract Embedded Images</span>
              </button>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} stageText={progressMsg} />}

          {images.length > 0 && (
            <div className="space-y-6">
              {/* Batch Download Bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-semibold text-slate-200 block">
                    {images.length} Image{images.length > 1 ? 's' : ''} Extracted
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Ready for single download or full ZIP export ({(zipSize / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>

                {zipUrl && (
                  <DownloadButton
                    url={zipUrl}
                    fileName={`images-${file.name.replace(/\.[^/.]+$/, '')}.zip`}
                    label="Download All Images (ZIP)"
                  />
                )}
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors group shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-300 font-mono">Page {img.pageNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {img.width}x{img.height}
                        </span>
                      </div>

                      <div
                        onClick={() => setPreviewImage(img)}
                        className="relative aspect-square bg-black/40 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer group-hover:opacity-90 transition-opacity"
                      >
                        <img src={img.dataUrl} alt={img.name} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">
                        {(img.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(img)}
                        className="p-1.5 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg transition-colors"
                        title="Download Image"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-4 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-200">
                Page {previewImage.pageNumber} Image Preview ({previewImage.width}x{previewImage.height}px)
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center overflow-auto bg-black/50 rounded-xl p-2">
              <img src={previewImage.dataUrl} alt="Preview" className="max-w-full max-h-[65vh] object-contain" />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleDownloadSingle(previewImage)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Full Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

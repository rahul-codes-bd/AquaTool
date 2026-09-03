import React, { useState, useEffect } from 'react';
import {
  Layers,
  RotateCw,
  RotateCcw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Download,
  RefreshCw,
  CheckSquare,
  Square,
  Sparkles,
  FileCheck,
  Split,
  Eye,
  Archive,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputCard } from '../common/OutputCard';
import { PdfRenderer } from '../../services/pdfRenderer';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl: string;
  isSelected: boolean;
}

interface PdfPageOrganizerToolProps {
  initialMode?: 'rearrange' | 'rotate' | 'remove' | 'extract';
}

export const PdfPageOrganizerTool: React.FC<PdfPageOrganizerToolProps> = ({
  initialMode = 'rearrange',
}) => {
  const [activeMode, setActiveMode] = useState<'rearrange' | 'rotate' | 'remove' | 'extract'>(
    initialMode
  );
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isRenderingThumbs, setIsRenderingThumbs] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [extractMerge, setExtractMerge] = useState<boolean>(true);

  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    fileName: string;
    pageCount?: number;
    fileSizeBytes?: number;
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
    setIsRenderingThumbs(true);
    setProgress(15);
    setProgressText('Loading PDF pages & rendering thumbnails...');
    setResult(null);

    try {
      const thumbs = await PdfRenderer.renderThumbnails(selectedFile, 60, (loaded, total) => {
        setProgress(15 + Math.round((loaded / total) * 70));
        setProgressText(`Rendering page ${loaded} of ${total}...`);
      });

      const items: PageItem[] = thumbs.map((t, idx) => ({
        id: `page-${idx}-${Date.now()}`,
        originalIndex: idx,
        rotation: 0,
        thumbnailUrl: t.dataUrl,
        isSelected: activeMode === 'remove' ? false : true,
      }));

      setPages(items);
      setTotalPages(items.length);
      setProgress(100);
    } catch (err: any) {
      setError(err?.message || 'Failed to render PDF page thumbnails.');
    } finally {
      setIsRenderingThumbs(false);
    }
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;

    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const rotatePage = (index: number, delta = 90) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p))
    );
  };

  const rotateAll = (delta = 90) => {
    setPages((prev) =>
      prev.map((p) => ({ ...p, rotation: (p.rotation + delta + 360) % 360 }))
    );
  };

  const toggleSelectPage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, isSelected: !p.isSelected } : p))
    );
  };

  const selectAll = (selected: boolean) => {
    setPages((prev) => prev.map((p) => ({ ...p, isSelected: selected })));
  };

  const removePageDirect = (index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExecute = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setProgressText('Preparing document transformations...');
    setError(null);

    try {
      if (activeMode === 'rearrange') {
        if (pages.length === 0) {
          throw new Error('At least one page must remain in the document.');
        }

        const plan = pages.map((p) => ({
          originalIndex: p.originalIndex,
          rotationDelta: p.rotation,
        }));

        const res = await PdfEngine.manipulatePages(file, plan, (pct, msg) => {
          setProgress(pct);
          setProgressText(msg);
        });

        setResult({
          blob: res.blob!,
          url: res.downloadUrl!,
          fileName: res.fileName!,
          pageCount: res.pageCount,
          fileSizeBytes: res.fileSizeBytes,
        });
      } else if (activeMode === 'rotate') {
        const plan = pages.map((p) => ({
          originalIndex: p.originalIndex,
          rotationDelta: p.rotation,
        }));

        const res = await PdfEngine.manipulatePages(file, plan, (pct, msg) => {
          setProgress(pct);
          setProgressText(msg);
        });

        setResult({
          blob: res.blob!,
          url: res.downloadUrl!,
          fileName: `rotated-${file.name}`,
          pageCount: res.pageCount,
          fileSizeBytes: res.fileSizeBytes,
        });
      } else if (activeMode === 'remove') {
        // Remove pages that are checked for removal
        const pagesToKeep = pages.filter((p) => !p.isSelected);
        if (pagesToKeep.length === 0) {
          throw new Error('Cannot delete all pages. At least 1 page must remain.');
        }

        const plan = pagesToKeep.map((p) => ({
          originalIndex: p.originalIndex,
          rotationDelta: p.rotation,
        }));

        const res = await PdfEngine.manipulatePages(file, plan, (pct, msg) => {
          setProgress(pct);
          setProgressText(msg);
        });

        setResult({
          blob: res.blob!,
          url: res.downloadUrl!,
          fileName: `updated-${file.name}`,
          pageCount: res.pageCount,
          fileSizeBytes: res.fileSizeBytes,
        });
      } else if (activeMode === 'extract') {
        const selectedOriginalIndices = pages
          .filter((p) => p.isSelected)
          .map((p) => p.originalIndex);

        if (selectedOriginalIndices.length === 0) {
          throw new Error('Please select at least one page to extract.');
        }

        const plan = pages
          .filter((p) => p.isSelected)
          .map((p) => ({
            originalIndex: p.originalIndex,
            rotationDelta: p.rotation,
          }));

        if (extractMerge) {
          const res = await PdfEngine.manipulatePages(file, plan, (pct, msg) => {
            setProgress(pct);
            setProgressText(msg);
          });
          setResult({
            blob: res.blob!,
            url: res.downloadUrl!,
            fileName: `extracted-${file.name}`,
            pageCount: res.pageCount,
            fileSizeBytes: res.fileSizeBytes,
          });
        } else {
          // Extract as individual ZIP
          const res = await PdfEngine.extractPages(
            file,
            selectedOriginalIndices.map((i) => i + 1),
            false,
            (pct, msg) => {
              setProgress(pct);
              setProgressText(msg);
            }
          );
          setResult({
            blob: res.blob!,
            url: res.downloadUrl!,
            fileName: res.fileName!,
            pageCount: res.pageCount,
            fileSizeBytes: res.fileSizeBytes,
          });
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to process pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setTotalPages(0);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            setActiveMode('rearrange');
            selectAll(true);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeMode === 'rearrange'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rearrange Pages</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('rotate');
            selectAll(true);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeMode === 'rotate'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          <span>Rotate Pages</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('remove');
            selectAll(false);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeMode === 'remove'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove Pages</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('extract');
            selectAll(true);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeMode === 'extract'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Split className="w-4 h-4" />
          <span>Extract Pages</span>
        </button>
      </div>

      {!file && (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <FileDropzone
            accept=".pdf,application/pdf"
            multiple={false}
            maxSizeMB={50}
            onFilesSelected={handleFileSelect}
            title={`Drop PDF to ${activeMode} pages`}
            subtitle="Process up to 50 MB securely inside your browser"
          />
        </div>
      )}

      {isRenderingThumbs && (
        <ProgressBar progress={progress} stageText={progressText} />
      )}

      {file && pages.length > 0 && !result && (
        <div className="space-y-6">
          {/* Quick Actions Header */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-white">{file.name}</span>
              <span className="text-slate-500">•</span>
              <span>{pages.length} Pages Loaded</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeMode === 'rotate' && (
                <>
                  <button
                    type="button"
                    onClick={() => rotateAll(90)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rotate All +90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateAll(180)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    180° Flip All
                  </button>
                </>
              )}

              {(activeMode === 'remove' || activeMode === 'extract') && (
                <>
                  <button
                    type="button"
                    onClick={() => selectAll(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAll(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    Deselect All
                  </button>
                </>
              )}

              {activeMode === 'extract' && (
                <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="extractFormat"
                      checked={extractMerge}
                      onChange={() => setExtractMerge(true)}
                      className="accent-cyan-400"
                    />
                    <span>Single PDF</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="extractFormat"
                      checked={!extractMerge}
                      onChange={() => setExtractMerge(false)}
                      className="accent-cyan-400"
                    />
                    <span>Separate ZIP</span>
                  </label>
                </div>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                title="Reset / choose another file"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Visual Grid of Pages */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {pages.map((page, idx) => {
              const isMarkedForDeletion = activeMode === 'remove' && page.isSelected;
              const isMarkedForExtraction = activeMode === 'extract' && page.isSelected;

              return (
                <div
                  key={page.id}
                  className={`group relative bg-slate-900/90 border rounded-2xl p-2.5 transition-all shadow-md flex flex-col justify-between ${
                    isMarkedForDeletion
                      ? 'border-rose-500/60 bg-rose-950/20'
                      : isMarkedForExtraction
                      ? 'border-cyan-500/60 bg-cyan-950/20 shadow-cyan-500/10'
                      : 'border-white/10 hover:border-cyan-500/30'
                  }`}
                >
                  {/* Header Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-mono font-bold text-slate-300">
                      #{idx + 1}
                      {page.originalIndex !== idx && (
                        <span className="text-slate-500 text-[9px] ml-1">
                          (orig {page.originalIndex + 1})
                        </span>
                      )}
                    </span>

                    {(activeMode === 'remove' || activeMode === 'extract') && (
                      <button
                        type="button"
                        onClick={() => toggleSelectPage(idx)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {page.isSelected ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Thumbnail Image */}
                  <div className="aspect-[3/4] bg-white rounded-lg overflow-hidden flex items-center justify-center p-1 shadow-inner relative">
                    <img
                      src={page.thumbnailUrl}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-contain transition-transform duration-200"
                      style={{
                        transform: `rotate(${page.rotation}deg)`,
                      }}
                    />

                    {isMarkedForDeletion && (
                      <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-xs flex items-center justify-center text-rose-300 text-xs font-bold uppercase tracking-wider">
                        Will Delete
                      </div>
                    )}
                  </div>

                  {/* Card Controls */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-xs text-slate-400">
                    {/* Move Left / Right */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => movePage(idx, 'left')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-colors"
                        title="Move left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePage(idx, 'right')}
                        disabled={idx === pages.length - 1}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-colors"
                        title="Move right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Rotation & Remove */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => rotatePage(idx, 90)}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-cyan-400 transition-colors"
                        title="Rotate +90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePageDirect(idx)}
                        className="p-1 rounded bg-white/5 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Delete this page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Execution Button */}
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleExecute}
              disabled={isProcessing}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {activeMode === 'rearrange' && `Apply & Export (${pages.length} Pages)`}
                {activeMode === 'rotate' && `Save Rotated PDF (${pages.length} Pages)`}
                {activeMode === 'remove' && `Remove Selected & Save (${pages.filter((p) => !p.isSelected).length} Remaining)`}
                {activeMode === 'extract' && `Extract ${pages.filter((p) => p.isSelected).length} Selected Pages`}
              </span>
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <ProgressBar progress={progress} stageText={progressText} />
      )}

      {result && (
        <OutputCard
          title="Document Ready"
          downloadUrl={result.url}
          fileName={result.fileName}
          stats={{
            'File Name': result.fileName,
            'Output Pages': result.pageCount || pages.length,
            'File Size': PdfValidator.formatFileSize(result.fileSizeBytes || result.blob.size),
            'Privacy': '100% Client-Side In-Memory',
          }}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

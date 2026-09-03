import React, { useState, useEffect } from 'react';
import { FileDropzone } from '../common/FileDropzone';
import { OutputCard } from '../common/OutputCard';
import { ProgressBar } from '../common/ProgressBar';
import { ErrorAlert } from '../common/ErrorAlert';
import { PdfTools, PdfMetadata } from '../../services/pdfTools';
import { FileInfoTools } from '../../services/fileInfoTools';
import {
  Files,
  Split,
  Merge,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Info,
  Archive,
  CheckSquare,
  Square,
  Sparkles,
  Lock,
} from 'lucide-react';

export const PdfMergeSplitTool: React.FC = () => {
  const [mode, setMode] = useState<'merge' | 'split'>('merge');

  // Merge Mode state
  const [filesToMerge, setFilesToMerge] = useState<File[]>([]);

  // Split Mode state
  const [fileToSplit, setFileToSplit] = useState<File | null>(null);
  const [splitRange, setSplitRange] = useState('1-3');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [splitMetadata, setSplitMetadata] = useState<PdfMetadata | null>(null);
  const [splitFormat, setSplitFormat] = useState<'single_pdf' | 'zip_archive'>('single_pdf');

  // Processing & progress
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    fileName: string;
    stats: Record<string, string | number>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URLs on unmount or reset
  useEffect(() => {
    return () => {
      if (result?.url) {
        PdfTools.revokeUrl(result.url);
      }
    };
  }, [result]);

  const clearResult = () => {
    if (result?.url) {
      PdfTools.revokeUrl(result.url);
    }
    setResult(null);
  };

  // MERGE HANDLERS
  const handleMergeFiles = (files: File[]) => {
    setFilesToMerge((prev) => [...prev, ...files]);
    setError(null);
    clearResult();
  };

  const removeMergeFile = (index: number) => {
    setFilesToMerge((prev) => prev.filter((_, i) => i !== index));
    clearResult();
  };

  const moveMergeFile = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= filesToMerge.length) return;

    setFilesToMerge((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
    clearResult();
  };

  const totalMergeSize = filesToMerge.reduce((acc, f) => acc + f.size, 0);

  const executeMerge = async () => {
    if (filesToMerge.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    clearResult();
    setProgress(5);
    setStageText('Initiating PDF merge sequence...');

    try {
      const res = await PdfTools.mergePdfs(filesToMerge, (pct, msg) => {
        setProgress(pct);
        setStageText(msg);
      });

      setResult({
        blob: res.blob,
        url: res.url,
        fileName: 'aquatools-merged-document.pdf',
        stats: {
          mergedDocuments: filesToMerge.length,
          combinedPages: res.pageCount,
          totalOutputSize: FileInfoTools.formatBytes(res.fileSize),
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to merge PDF files.');
    } finally {
      setIsProcessing(false);
    }
  };

  // SPLIT HANDLERS
  const handleSplitFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFileToSplit(f);
    setError(null);
    clearResult();
    setIsProcessing(true);
    setProgress(20);
    setStageText('Inspecting source PDF pages and metadata...');

    try {
      const meta = await PdfTools.getPdfMetadata(f, (pct, msg) => {
        setProgress(pct);
        setStageText(msg);
      });

      if (meta.isEncrypted) {
        setSplitMetadata(meta);
        setError(
          'Password-Protected PDF: This file is encrypted. Browsers cannot decrypt or extract pages without the password.'
        );
        return;
      }

      setSplitMetadata(meta);
      const total = meta.pageCount;
      const initialPages = total > 3 ? [1, 2, 3] : Array.from({ length: total }, (_, i) => i + 1);
      setSelectedPages(initialPages);
      setSplitRange(total > 3 ? '1-3' : `1-${total}`);
    } catch (err: any) {
      setError(err.message || 'Failed to parse source PDF.');
      setFileToSplit(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateRangeFromSelection = (pages: number[]) => {
    setSelectedPages(pages);
    if (pages.length === 0) {
      setSplitRange('');
      return;
    }

    // Group into intervals
    const sorted = [...pages].sort((a, b) => a - b);
    const intervals: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i];
      } else {
        intervals.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = sorted[i];
        prev = sorted[i];
      }
    }
    intervals.push(start === prev ? `${start}` : `${start}-${prev}`);
    setSplitRange(intervals.join(', '));
  };

  const handleRangeInputChange = (val: string) => {
    setSplitRange(val);
    if (splitMetadata?.pageCount) {
      const parsed = PdfTools.parsePageRange(val, splitMetadata.pageCount);
      setSelectedPages(parsed.map((idx) => idx + 1));
    }
  };

  const togglePageSelection = (pageNum: number) => {
    let next: number[];
    if (selectedPages.includes(pageNum)) {
      next = selectedPages.filter((p) => p !== pageNum);
    } else {
      next = [...selectedPages, pageNum].sort((a, b) => a - b);
    }
    updateRangeFromSelection(next);
  };

  const applyPreset = (preset: 'all' | 'odd' | 'even' | 'firstHalf' | 'secondHalf' | 'none') => {
    if (!splitMetadata?.pageCount) return;
    const total = splitMetadata.pageCount;
    let next: number[] = [];

    switch (preset) {
      case 'all':
        next = Array.from({ length: total }, (_, i) => i + 1);
        break;
      case 'odd':
        for (let i = 1; i <= total; i += 2) next.push(i);
        break;
      case 'even':
        for (let i = 2; i <= total; i += 2) next.push(i);
        break;
      case 'firstHalf':
        const half = Math.ceil(total / 2);
        for (let i = 1; i <= half; i++) next.push(i);
        break;
      case 'secondHalf':
        const start = Math.ceil(total / 2) + 1;
        for (let i = start; i <= total; i++) next.push(i);
        break;
      case 'none':
        next = [];
        break;
    }

    updateRangeFromSelection(next);
  };

  const executeSplit = async () => {
    if (!fileToSplit || !splitMetadata) return;
    if (selectedPages.length === 0) {
      setError('Please select at least one page to extract.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    clearResult();
    setProgress(10);

    const baseName = fileToSplit.name.replace(/\.pdf$/i, '');

    try {
      if (splitFormat === 'zip_archive') {
        const res = await PdfTools.splitAllPagesToZip(fileToSplit, selectedPages, (pct, msg) => {
          setProgress(pct);
          setStageText(msg);
        });

        setResult({
          blob: res.blob,
          url: res.url,
          fileName: `${baseName}-individual-pages.zip`,
          stats: {
            originalFile: fileToSplit.name,
            exportedPdfsCount: res.pageCount,
            archivePackageSize: FileInfoTools.formatBytes(res.fileSize),
          },
        });
      } else {
        const res = await PdfTools.splitPdf(fileToSplit, selectedPages, (pct, msg) => {
          setProgress(pct);
          setStageText(msg);
        });

        setResult({
          blob: res.blob,
          url: res.url,
          fileName: `${baseName}-extracted-pages.pdf`,
          stats: {
            originalFile: fileToSplit.name,
            extractedPages: res.pageCount,
            resultPdfSize: FileInfoTools.formatBytes(res.fileSize),
          },
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to extract PDF pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFullReset = () => {
    clearResult();
    setFilesToMerge([]);
    setFileToSplit(null);
    setSplitMetadata(null);
    setSelectedPages([]);
    setSplitRange('1-3');
    setError(null);
    setProgress(0);
    setStageText('');
  };

  return (
    <div className="space-y-6">
      {/* Informative Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-start gap-3 text-xs text-cyan-200">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-cyan-300">100% In-Browser Document Integrity</p>
          <p className="text-slate-300 leading-relaxed">
            All PDF operations run locally in your browser memory using <code className="font-mono text-cyan-300">pdf-lib</code>.
            Original fonts, vector lines, annotations, and high-resolution assets are fully preserved. AquaTools does not claim or simulate lossy PDF compression.
          </p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1 shadow-md">
          <button
            type="button"
            onClick={() => {
              setMode('merge');
              clearResult();
              setError(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'merge'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Merge className="w-4 h-4 text-cyan-400" />
            <span>Merge Multiple PDFs</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('split');
              clearResult();
              setError(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'split'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Split className="w-4 h-4 text-sky-400" />
            <span>Split & Extract Pages</span>
          </button>
        </div>
      </div>

      {/* MERGE MODE */}
      {mode === 'merge' && (
        <div className="space-y-6">
          <FileDropzone
            accept=".pdf,application/pdf"
            multiple
            maxSizeMB={100}
            onFilesSelected={handleMergeFiles}
            title="Drop PDF files to combine into a single document"
            subtitle="Add 2 or more PDFs. You can reorder, arrange, and merge entirely within your browser."
          />

          {filesToMerge.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">
                    Documents to Merge ({filesToMerge.length})
                  </h4>
                  <p className="text-xs text-slate-400">
                    Total combined size: {FileInfoTools.formatBytes(totalMergeSize)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFilesToMerge([]);
                    clearResult();
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Clear all files
                </button>
              </div>

              {/* Memory warning if total size > 50MB */}
              {totalMergeSize > 50 * 1024 * 1024 && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">High Total Size Warning: </span>
                    Combined files exceed 50 MB ({FileInfoTools.formatBytes(totalMergeSize)}). Parsing and copying multiple large PDFs concurrently in browser memory requires ample free RAM.
                  </div>
                </div>
              )}

              {/* Reorderable File List */}
              <div className="space-y-2">
                {filesToMerge.map((f, idx) => (
                  <div
                    key={`${f.name}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-200 truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {FileInfoTools.formatBytes(f.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0 || isProcessing}
                        onClick={() => moveMergeFile(idx, 'up')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                        title="Move Up in Merge Order"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === filesToMerge.length - 1 || isProcessing}
                        onClick={() => moveMergeFile(idx, 'down')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                        title="Move Down in Merge Order"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => removeMergeFile(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Remove Document"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                id="merge-pdf-btn"
                onClick={executeMerge}
                disabled={isProcessing || filesToMerge.length < 2}
                className="w-full py-3 rounded-xl aqua-glow-button text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Merge className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Merging Documents...'
                    : `Merge ${filesToMerge.length} Documents`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SPLIT MODE */}
      {mode === 'split' && (
        <div className="space-y-6">
          {!fileToSplit ? (
            <FileDropzone
              accept=".pdf,application/pdf"
              maxSizeMB={100}
              onFilesSelected={handleSplitFile}
              title="Drop PDF file to extract or split pages"
              subtitle="Select specific pages visually or enter custom ranges like '1-3, 5, 8-10'. Export as single PDF or ZIP archive."
            />
          ) : (
            <div className="glass-panel rounded-2xl p-6 space-y-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{fileToSplit.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{FileInfoTools.formatBytes(fileToSplit.size)}</span>
                    {splitMetadata && (
                      <>
                        <span>•</span>
                        <span className="text-cyan-400 font-mono font-medium">
                          {splitMetadata.pageCount} Pages Total
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFileToSplit(null);
                    setSplitMetadata(null);
                    clearResult();
                  }}
                  className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  Choose Different PDF
                </button>
              </div>

              {/* Large file warning */}
              {fileToSplit.size > 30 * 1024 * 1024 && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Large File Notice: </span>
                    File is {FileInfoTools.formatBytes(fileToSplit.size)}. Extracting pages in-memory requires active browser resources.
                  </div>
                </div>
              )}

              {/* Password-protected warning */}
              {splitMetadata?.isEncrypted && (
                <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-rose-300">
                    <Lock className="w-4 h-4" />
                    <span>Encrypted PDF Cannot Be Split</span>
                  </div>
                  <p className="text-slate-300">
                    This document requires password decryption to copy or extract pages.
                  </p>
                </div>
              )}

              {splitMetadata && !splitMetadata.isEncrypted && (
                <div className="space-y-5">
                  {/* Export format selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Extraction Format
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSplitFormat('single_pdf')}
                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                          splitFormat === 'single_pdf'
                            ? 'bg-cyan-950/80 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)] text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Split className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold">Combine into One PDF</p>
                          <p className="text-[11px] text-slate-400">
                            Merges selected pages into a single new PDF document.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSplitFormat('zip_archive')}
                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                          splitFormat === 'zip_archive'
                            ? 'bg-cyan-950/80 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)] text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Archive className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold">Separate PDFs in a ZIP</p>
                          <p className="text-[11px] text-slate-400">
                            Extracts each page as its own PDF, bundled in a ZIP.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Range Text Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold text-slate-300">
                        Page Range Syntax
                      </label>
                      <span className="text-cyan-400 font-mono text-[11px]">
                        {selectedPages.length} of {splitMetadata.pageCount} pages selected
                      </span>
                    </div>
                    <input
                      type="text"
                      value={splitRange}
                      onChange={(e) => handleRangeInputChange(e.target.value)}
                      placeholder="e.g. 1-3, 5, 8-10, odd, even"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>

                  {/* Quick Select Preset Buttons */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Quick Selection Presets
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyPreset('all')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        All Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('odd')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        Odd Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('even')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        Even Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('firstHalf')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        First Half (1-{Math.ceil(splitMetadata.pageCount / 2)})
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('secondHalf')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        Second Half
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('none')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-rose-300 hover:bg-slate-700"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>

                  {/* Visual Page Selector Grid (up to 60 pages visually) */}
                  {splitMetadata.pageCount <= 60 && (
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Interactive Page Selector
                      </label>
                      <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5 max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        {Array.from({ length: splitMetadata.pageCount }, (_, i) => i + 1).map((num) => {
                          const isSelected = selectedPages.includes(num);
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => togglePageSelection(num)}
                              className={`p-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                                isSelected
                                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.6)] font-bold'
                                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                              }`}
                              title={`Click to ${isSelected ? 'deselect' : 'select'} page ${num}`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    id="split-pdf-btn"
                    onClick={executeSplit}
                    disabled={isProcessing || selectedPages.length === 0}
                    className="w-full py-3 rounded-xl aqua-glow-button text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {splitFormat === 'zip_archive' ? (
                      <Archive className="w-4 h-4" />
                    ) : (
                      <Split className="w-4 h-4" />
                    )}
                    <span>
                      {isProcessing
                        ? 'Extracting Pages...'
                        : `Extract ${selectedPages.length} ${
                            selectedPages.length === 1 ? 'Page' : 'Pages'
                          } (${splitFormat === 'zip_archive' ? 'ZIP' : 'PDF'})`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress State */}
      {isProcessing && (
        <ProgressBar
          progress={progress}
          stageText={stageText || 'Compiling pages locally with pdf-lib...'}
        />
      )}

      {/* Error state */}
      {error && <ErrorAlert message={error} />}

      {/* Result Card */}
      {result && (
        <OutputCard
          title={splitFormat === 'zip_archive' ? 'ZIP Archive Ready' : 'Generated PDF Ready'}
          blob={result.blob}
          downloadUrl={result.url}
          fileName={result.fileName}
          stats={result.stats}
          onReset={handleFullReset}
        />
      )}
    </div>
  );
};


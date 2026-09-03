import React, { useState } from 'react';
import {
  Bookmark,
  Plus,
  Trash2,
  Download,
  FileText,
  ListOrdered,
  Layers,
  ChevronRight,
  Shield,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { DownloadButton } from '../common/DownloadButton';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfBookmarkItem, PdfEngineResult } from '../../types/pdf';

export function PdfBookmarksTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [bookmarks, setBookmarks] = useState<PdfBookmarkItem[]>([
    { id: 'bm-1', title: 'Chapter 1: Introduction', pageNumber: 1 },
    { id: 'bm-2', title: 'Chapter 2: Core Methodology', pageNumber: 3 },
    { id: 'bm-3', title: 'Chapter 3: Results & Analysis', pageNumber: 7 },
    { id: 'bm-4', title: 'Chapter 4: Conclusion', pageNumber: 12 },
  ]);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [result, setResult] = useState<PdfEngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (files: File[]) => {
    if (!files.length) return;
    const selected = files[0];
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file.');
      return;
    }

    try {
      setError(null);
      setFile(selected);
      setResult(null);
      const doc = await PdfEngine.inspectPdf(selected);
      setPageCount(doc.pageCount);
    } catch (err: any) {
      console.error(err);
      setError('Failed to inspect document.');
    }
  };

  const addBookmark = () => {
    const newId = `bm-${Date.now()}`;
    setBookmarks((prev) => [
      ...prev,
      {
        id: newId,
        title: `Section ${prev.length + 1}`,
        pageNumber: Math.min(prev.length + 1, pageCount),
      },
    ]);
  };

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBookmark = (id: string, updates: Partial<PdfBookmarkItem>) => {
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const handleGenerateToc = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);
      setProgressMsg('Generating Table of Contents page and index structure...');

      const res = await PdfEngine.generateTocPdf(file, bookmarks, (pct, msg) => {
        setProgressMsg(msg);
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to generate Table of Contents.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-cyan-400" />
            PDF Bookmarks & Table of Contents Generator
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Build document outlines, chapter markers, and automatically insert an elegant Table of Contents page.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local RAM Processing</span>
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
          title="Upload PDF to Add Bookmarks & Table of Contents"
          subtitle="Supports single and multi-page documents"
        />
      ) : (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Loaded Document</span>
              <p className="text-slate-200 font-medium text-sm mt-0.5">
                {file.name} ({pageCount} page{pageCount > 1 ? 's' : ''})
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Change File
            </button>
          </div>

          {/* Bookmarks Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-cyan-400" />
                Bookmark Entries ({bookmarks.length})
              </span>
              <button
                type="button"
                onClick={addBookmark}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Chapter / Section
              </button>
            </div>

            <div className="space-y-3">
              {bookmarks.map((bm, index) => (
                <div
                  key={bm.id}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3 hover:border-slate-700 transition-colors"
                >
                  <span className="text-xs font-mono text-cyan-400 font-bold w-6 shrink-0">#{index + 1}</span>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={bm.title}
                      onChange={(e) => updateBookmark(bm.id, { title: e.target.value })}
                      placeholder="Chapter / Section Name"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400">Page:</span>
                    <input
                      type="number"
                      min="1"
                      max={pageCount}
                      value={bm.pageNumber}
                      onChange={(e) =>
                        updateBookmark(bm.id, {
                          pageNumber: Math.max(1, Math.min(parseInt(e.target.value, 10) || 1, pageCount)),
                        })
                      }
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 text-center font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeBookmark(bm.id)}
                    className="text-slate-500 hover:text-red-400 p-1.5 transition-colors shrink-0"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleGenerateToc}
              disabled={isProcessing || bookmarks.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? progressMsg || 'Generating...' : 'Insert Table of Contents & Save'}
            </button>
          </div>

          {result && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-emerald-200 block">Table of Contents Inserted!</span>
                <span className="text-xs text-emerald-400/80 font-mono">
                  {result.fileName} ({result.pageCount} pages, {(result.fileSizeBytes / 1024).toFixed(1)} KB)
                </span>
              </div>
              <DownloadButton
                url={result.downloadUrl}
                fileName={result.fileName}
                label="Download Updated PDF"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { FileDropzone } from '../common/FileDropzone';
import { ErrorAlert } from '../common/ErrorAlert';
import { ProgressBar } from '../common/ProgressBar';
import { PdfTools, PdfMetadata, PdfPageInfo } from '../../services/pdfTools';
import { FileInfoTools } from '../../services/fileInfoTools';
import {
  FileText,
  Lock,
  RotateCcw,
  AlertTriangle,
  Info,
  Layers,
  Compass,
  Maximize2,
  FileCheck2,
  Search,
} from 'lucide-react';
import { CopyButton } from '../common/CopyButton';

export const PdfMetadataTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pageSearch, setPageSearch] = useState('');
  const [pageViewPage, setPageViewPage] = useState(1);
  const PAGES_PER_VIEW = 12;

  useEffect(() => {
    return () => {
      // Memory cleanup on unmount
    };
  }, []);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const uploaded = files[0];
    setFile(uploaded);
    setIsInspecting(true);
    setError(null);
    setProgress(15);
    setStageText('Reading PDF signature...');

    try {
      const data = await PdfTools.getPdfMetadata(uploaded, (pct, msg) => {
        setProgress(pct);
        setStageText(msg);
      });
      setMetadata(data);
    } catch (err: any) {
      setError(err.message || 'Failed to parse PDF metadata.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setMetadata(null);
    setError(null);
    setProgress(0);
    setStageText('');
    setPageSearch('');
    setPageViewPage(1);
  };

  // Filtered pages for the page info section
  const filteredPages = metadata?.pages.filter((p) => {
    if (!pageSearch.trim()) return true;
    const q = pageSearch.toLowerCase();
    return (
      String(p.pageNumber).includes(q) ||
      p.standardSize.toLowerCase().includes(q) ||
      p.orientation.toLowerCase().includes(q)
    );
  }) || [];

  const paginatedPages = filteredPages.slice(
    (pageViewPage - 1) * PAGES_PER_VIEW,
    pageViewPage * PAGES_PER_VIEW
  );
  const totalViewPages = Math.ceil(filteredPages.length / PAGES_PER_VIEW);

  return (
    <div className="space-y-6">
      {/* Informative Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-start gap-3 text-xs text-cyan-200">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-cyan-300">100% Client-Side PDF Architecture</p>
          <p className="text-slate-300 leading-relaxed">
            All PDF operations run locally in your browser memory using the reputable <code className="font-mono text-cyan-300">pdf-lib</code> engine.
            Document contents are never uploaded to any cloud server. PDF compression is not claimed or simulated, ensuring your original vectors and typography remain intact.
          </p>
        </div>
      </div>

      {!file ? (
        <FileDropzone
          accept=".pdf,application/pdf"
          maxSizeMB={100}
          onFilesSelected={handleFile}
          title="Drop PDF file to inspect metadata & page metrics"
          subtitle="Extracts document metadata, per-page dimensions, orientation, paper size (A4, Letter), and encryption status."
        />
      ) : (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-5">
            {/* Header info bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 truncate max-w-sm sm:max-w-md">
                    {file.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{FileInfoTools.formatBytes(file.size)}</span>
                    {metadata?.pdfVersion && (
                      <>
                        <span>•</span>
                        <span className="text-cyan-400 font-mono font-medium">{metadata.pdfVersion}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="inspect-another-pdf-btn"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Inspect Another PDF</span>
              </button>
            </div>

            {/* Large file warning */}
            {file.size > 30 * 1024 * 1024 && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Large File Notice: </span>
                  This PDF is {FileInfoTools.formatBytes(file.size)}. Processing large PDF documents in browser memory requires notable RAM. Avoid closing this tab during operations.
                </div>
              </div>
            )}

            {/* In-progress state */}
            {isInspecting && (
              <ProgressBar progress={progress} stageText={stageText || 'Parsing PDF dictionary and xref tables...'} />
            )}

            {/* Error banner */}
            {error && <ErrorAlert message={error} onRetry={() => handleFile([file])} />}

            {/* Metadata Results */}
            {metadata && (
              <div className="space-y-6">
                {/* Password-protected / Encrypted Banner */}
                {metadata.isEncrypted ? (
                  <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-rose-300 text-sm">
                      <Lock className="w-4 h-4 text-rose-400" />
                      <span>Password-Protected / Encrypted PDF Detected</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {metadata.encryptionError ||
                        'This document has active password encryption or permission security. In accordance with PDF security specifications, password-protected streams cannot be inspected or altered in client-side pdf-lib without the decryption password.'}
                    </p>
                    <div className="pt-2 flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span>File Size: {FileInfoTools.formatBytes(metadata.fileSize)}</span>
                      {metadata.pdfVersion && <span>Format: {metadata.pdfVersion}</span>}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Summary Badges Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Total Pages
                        </span>
                        <p className="text-xl font-bold text-cyan-300 font-mono">
                          {metadata.pageCount}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Paper Size
                        </span>
                        <p className="text-sm font-semibold text-slate-200 truncate">
                          {metadata.hasMixedSizes
                            ? 'Mixed Page Sizes'
                            : metadata.pages[0]?.standardSize || 'Custom'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Orientation
                        </span>
                        <p className="text-sm font-semibold text-slate-200 truncate">
                          {metadata.hasMixedOrientations
                            ? 'Mixed Orientations'
                            : metadata.pages[0]?.orientation || 'Portrait'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Encryption
                        </span>
                        <p className="text-sm font-semibold text-teal-400 flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>None (Unrestricted)</span>
                        </p>
                      </div>
                    </div>

                    {/* Metadata Dictionary Grid */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Document Information Dictionary</span>
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Title</span>
                          <p className="text-xs font-medium text-slate-200 truncate" title={metadata.title}>
                            {metadata.title || 'Not specified'}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Author</span>
                          <p className="text-xs font-medium text-slate-200 truncate" title={metadata.author}>
                            {metadata.author || 'Not specified'}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Subject</span>
                          <p className="text-xs font-medium text-slate-200 truncate" title={metadata.subject}>
                            {metadata.subject || 'Not specified'}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Keywords</span>
                          <p className="text-xs font-medium text-slate-200 truncate" title={metadata.keywords}>
                            {metadata.keywords || 'Not specified'}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Creator Application</span>
                          <p className="text-xs font-medium text-slate-200 truncate" title={metadata.creator}>
                            {metadata.creator || 'Not specified'}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">PDF Producer</span>
                          <p className="text-xs font-medium text-slate-200 truncate" title={metadata.producer}>
                            {metadata.producer || 'Not specified'}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Creation Date</span>
                          <p className="text-xs font-medium text-slate-200 truncate" title={metadata.creationDate}>
                            {metadata.creationDate || 'Not specified'}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Modification Date</span>
                          <p className="text-xs font-medium text-slate-200 truncate" title={metadata.modificationDate}>
                            {metadata.modificationDate || 'Not specified'}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">PDF Specification</span>
                          <p className="text-xs font-medium text-cyan-300 font-mono">
                            {metadata.pdfVersion || 'Standard PDF'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Page Information Section */}
                    {metadata.pages.length > 0 && (
                      <div className="space-y-4 pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Page Dimensions & Orientation ({metadata.pages.length} Pages)</span>
                          </h5>

                          {metadata.pages.length > PAGES_PER_VIEW && (
                            <div className="relative w-full sm:w-60">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={pageSearch}
                                onChange={(e) => {
                                  setPageSearch(e.target.value);
                                  setPageViewPage(1);
                                }}
                                placeholder="Filter by page #, size, or orientation..."
                                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          )}
                        </div>

                        {/* Page Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {paginatedPages.map((p) => (
                            <div
                              key={p.pageNumber}
                              className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs">
                                  Page {p.pageNumber}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-300">
                                  {p.standardSize}
                                </span>
                              </div>

                              <div className="space-y-1 text-[11px] text-slate-400">
                                <div className="flex justify-between">
                                  <span>Orientation:</span>
                                  <span className="text-slate-200 font-medium">{p.orientation}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Millimeters:</span>
                                  <span className="text-cyan-300 font-mono">
                                    {p.widthMm} × {p.heightMm} mm
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Inches:</span>
                                  <span className="text-slate-300 font-mono">
                                    {p.widthInches}" × {p.heightInches}"
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Points / Rotation:</span>
                                  <span className="text-slate-400 font-mono">
                                    {Math.round(p.widthPt)}×{Math.round(p.heightPt)} pt • {p.rotation}°
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination if many pages */}
                        {totalViewPages > 1 && (
                          <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                            <span>
                              Showing {((pageViewPage - 1) * PAGES_PER_VIEW) + 1} -{' '}
                              {Math.min(pageViewPage * PAGES_PER_VIEW, filteredPages.length)} of{' '}
                              {filteredPages.length} pages
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={pageViewPage === 1}
                                onClick={() => setPageViewPage((p) => Math.max(1, p - 1))}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                              >
                                Prev
                              </button>
                              <span className="px-2 font-mono text-cyan-400">
                                {pageViewPage} / {totalViewPages}
                              </span>
                              <button
                                type="button"
                                disabled={pageViewPage === totalViewPages}
                                onClick={() => setPageViewPage((p) => Math.min(totalViewPages, p + 1))}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Copy JSON action bar */}
                    <div className="pt-3 border-t border-slate-800/80 flex justify-end">
                      <CopyButton
                        textToCopy={JSON.stringify(metadata, null, 2)}
                        label="Copy Full Metadata JSON"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


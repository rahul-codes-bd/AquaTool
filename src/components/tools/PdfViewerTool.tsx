import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Download,
  Eye,
  RefreshCw,
  Layers,
  Info,
  Sliders,
} from 'lucide-react';
import { PdfRenderer, RenderPageResult } from '../../services/pdfRenderer';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';
import { PdfDocumentSummary } from '../../types/pdf';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { ErrorAlert } from '../common/ErrorAlert';

export const PdfViewerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [summary, setSummary] = useState<PdfDocumentSummary | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<{ pageNumber: number; dataUrl: string }[]>([]);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      PdfEngine.cleanupAllTrackedUrls();
    };
  }, []);

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
    setIsLoading(true);
    setProgress(15);
    setCurrentPage(1);
    setRotation(0);
    setThumbnails([]);
    setRenderedImage(null);

    try {
      setProgress(30);
      const docSummary = await PdfEngine.inspectPdf(selectedFile);
      setSummary(docSummary);

      setProgress(60);
      const loadedDoc = await PdfRenderer.loadPdfDocument(selectedFile);
      setPdfDoc(loadedDoc);
      setTotalPages(loadedDoc.numPages);

      setProgress(80);
      // Render first page
      const firstPage = await PdfRenderer.renderPage(loadedDoc, 1, zoom, 'image/png');
      setRenderedImage(firstPage.dataUrl);

      // Render thumbnails in background
      PdfRenderer.renderThumbnails(selectedFile, 30)
        .then((thumbs) => setThumbnails(thumbs))
        .catch(() => {});

      setProgress(100);
    } catch (err: any) {
      setError(err?.message || 'Failed to load and render PDF in browser.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!pdfDoc || newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    setIsLoading(true);

    try {
      const pageResult = await PdfRenderer.renderPage(pdfDoc, newPage, zoom, 'image/png');
      setRenderedImage(pageResult.dataUrl);
    } catch (err: any) {
      setError(err?.message || 'Failed to render page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoomChange = async (newZoom: number) => {
    const clampedZoom = Math.min(3.0, Math.max(0.5, newZoom));
    setZoom(clampedZoom);
    if (!pdfDoc) return;

    try {
      const pageResult = await PdfRenderer.renderPage(pdfDoc, currentPage, clampedZoom, 'image/png');
      setRenderedImage(pageResult.dataUrl);
    } catch {
      // Ignore zoom render errors
    }
  };

  const handleDownloadOriginal = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null);
    setSummary(null);
    setCurrentPage(1);
    setTotalPages(0);
    setRenderedImage(null);
    setThumbnails([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {!file && (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-lg font-bold text-white mb-1">In-Browser PDF Viewer</h2>
            <p className="text-xs text-slate-400">
              View and inspect PDF documents with high fidelity, zoom, page rotation, and thumbnail navigation. Completely private — 0% server uploads.
            </p>
          </div>
          <FileDropzone
            accept=".pdf,application/pdf"
            multiple={false}
            maxSizeMB={50}
            onFilesSelected={handleFileSelect}
            title="Drop your PDF file here to view"
            subtitle="Supports single & multi-page PDFs up to 50 MB"
          />
        </div>
      )}

      {isLoading && progress < 100 && (
        <ProgressBar progress={progress} stageText="Loading and rendering PDF pages locally..." />
      )}

      {file && pdfDoc && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
            {/* Left: Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span>Page</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) handlePageChange(val);
                  }}
                  className="w-14 px-2 py-1 bg-black/40 border border-white/15 rounded-lg text-center text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
                <span className="text-slate-400">of {totalPages}</span>
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Middle: Zoom & View controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.2)}
                disabled={zoom <= 0.5}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-slate-300 px-2 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.2)}
                disabled={zoom >= 3.0}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
                title="Rotate View Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowThumbnails((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  showThumbnails
                    ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thumbnails</span>
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
                title="Document Info"
              >
                <Info className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleDownloadOriginal}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                title="Open another file"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Properties Inspector Panel */}
          {showDetails && summary && (
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 text-xs space-y-2 backdrop-blur-md">
              <div className="font-semibold text-cyan-400 flex items-center gap-1.5 mb-2">
                <Info className="w-4 h-4" />
                <span>PDF Document Properties</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500 block">File Name</span>
                  <span className="font-mono text-slate-200 truncate block">{file.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">File Size</span>
                  <span className="font-mono text-slate-200">
                    {PdfValidator.formatFileSize(file.size)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Pages</span>
                  <span className="font-mono text-slate-200">{summary.pageCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">PDF Version</span>
                  <span className="font-mono text-slate-200">{summary.pdfVersion || 'Standard'}</span>
                </div>
                {summary.title && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Title</span>
                    <span className="font-medium text-slate-200">{summary.title}</span>
                  </div>
                )}
                {summary.author && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Author</span>
                    <span className="font-medium text-slate-200">{summary.author}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Viewer Canvas Layout */}
          <div className="flex gap-4 min-h-[500px]">
            {/* Thumbnails Sidebar */}
            {showThumbnails && thumbnails.length > 0 && (
              <div className="w-40 sm:w-48 bg-slate-950/60 border border-white/10 rounded-2xl p-3 overflow-y-auto max-h-[700px] space-y-3 shrink-0 scrollbar-thin">
                <div className="text-[11px] font-semibold text-slate-400 px-1 uppercase tracking-wider">
                  Pages ({totalPages})
                </div>
                <div className="space-y-2.5">
                  {thumbnails.map((thumb) => (
                    <button
                      key={thumb.pageNumber}
                      type="button"
                      onClick={() => handlePageChange(thumb.pageNumber)}
                      className={`w-full text-left p-1.5 rounded-xl border transition-all ${
                        currentPage === thumb.pageNumber
                          ? 'bg-cyan-500/15 border-cyan-500 shadow-md shadow-cyan-500/10'
                          : 'bg-black/30 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="aspect-[3/4] bg-white rounded overflow-hidden flex items-center justify-center">
                        <img
                          src={thumb.dataUrl}
                          alt={`Page ${thumb.pageNumber}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-[10px] text-center mt-1 text-slate-400 font-mono">
                        Page {thumb.pageNumber}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Document Stage */}
            <div
              ref={containerRef}
              className="flex-1 bg-slate-950/80 border border-white/10 rounded-2xl p-4 sm:p-8 flex items-center justify-center overflow-auto max-h-[700px] shadow-inner"
            >
              {renderedImage ? (
                <div
                  className="transition-transform duration-200 ease-out shadow-2xl rounded-sm bg-white overflow-hidden max-w-full"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={renderedImage}
                    alt={`Page ${currentPage}`}
                    className="max-h-full object-contain shadow-2xl"
                  />
                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs">Loading page preview...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

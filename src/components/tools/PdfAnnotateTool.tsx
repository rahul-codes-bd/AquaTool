import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Type,
  Highlighter,
  Square,
  Circle,
  PenTool,
  Stamp,
  RotateCcw,
  Download,
  Eye,
  Trash2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Palette,
  AlertCircle,
  Undo2,
  Strikethrough,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { DownloadButton } from '../common/DownloadButton';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfRenderer } from '../../services/pdfRenderer';
import { PdfAnnotationItem, PdfAnnotationType, PdfEngineResult } from '../../types/pdf';

export function PdfAnnotateTool() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [activeTool, setActiveTool] = useState<PdfAnnotationType>('highlight');
  const [color, setColor] = useState<string>('#facc15'); // Yellow highlighter
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [opacity, setOpacity] = useState<number>(0.8);
  const [fontSize, setFontSize] = useState<number>(16);
  const [stampType, setStampType] = useState<'APPROVED' | 'CONFIDENTIAL' | 'DRAFT' | 'VOID' | 'COMPLETED'>('APPROVED');
  const [textContent, setTextContent] = useState<string>('Note text');

  const [annotations, setAnnotations] = useState<PdfAnnotationItem[]>([]);
  const [undoStack, setUndoStack] = useState<PdfAnnotationItem[][]>([]);
  const [thumbnails, setThumbnails] = useState<{ pageNumber: number; dataUrl: string }[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [result, setResult] = useState<PdfEngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pageCanvasDataUrl, setPageCanvasDataUrl] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const drawStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Load document when file changes
  const handleFileSelect = async (files: File[]) => {
    if (!files.length) return;
    const selected = files[0];
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF document.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setFile(selected);
      setResult(null);
      setAnnotations([]);
      setUndoStack([]);

      const doc = await PdfRenderer.loadPdfDocument(selected);
      setTotalPages(doc.numPages);
      setCurrentPage(1);

      // Load thumbs
      const thumbs = await PdfRenderer.renderThumbnails(selected, 30);
      setThumbnails(thumbs);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to parse PDF document. It might be corrupted or encrypted.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render current page
  const renderCurrentPage = useCallback(async () => {
    if (!file || totalPages === 0) return;
    try {
      const renderRes = await PdfRenderer.renderPage(file, currentPage, scale);
      setPageCanvasDataUrl(renderRes.dataUrl);
      setPageSize({ width: renderRes.width / scale, height: renderRes.height / scale });
    } catch (err: any) {
      console.error('Failed to render page:', err);
    }
  }, [file, currentPage, scale, totalPages]);

  useEffect(() => {
    if (file) {
      renderCurrentPage();
    }
  }, [file, currentPage, scale, renderCurrentPage]);

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage((prev) => Math.max(prev - 1, 1));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, undoStack]);

  const saveToUndo = () => {
    setUndoStack((prev) => [...prev, [...annotations]]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setAnnotations(previous);
  };

  const clearAllAnnotations = () => {
    if (annotations.length === 0) return;
    saveToUndo();
    setAnnotations([]);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Convert screen coordinates to PDF unscaled Points (PDF bottom-left origin)
    const displayX = (clientX - rect.left) / scale;
    const displayY = (clientY - rect.top) / scale;

    // In PDF coordinates, origin (0,0) is bottom-left, display is top-left
    const pdfY = pageSize.height - displayY;

    return { x: displayX, y: pdfY, displayX, displayY };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    isDrawingRef.current = true;
    drawStartPosRef.current = { x: coords.x, y: coords.y };

    if (activeTool === 'draw') {
      currentPathRef.current = [{ x: coords.x, y: coords.y }];
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const coords = getCanvasCoords(e);

    if (activeTool === 'draw') {
      currentPathRef.current.push({ x: coords.x, y: coords.y });
      redrawOverlay();
    }
  };

  const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !drawStartPosRef.current) return;
    isDrawingRef.current = false;
    const coords = getCanvasCoords(e);
    const start = drawStartPosRef.current;

    saveToUndo();

    const pageIndex = currentPage - 1;
    const newId = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    if (activeTool === 'draw') {
      if (currentPathRef.current.length > 1) {
        setAnnotations((prev) => [
          ...prev,
          {
            id: newId,
            type: 'draw',
            pageIndex,
            x: 0,
            y: 0,
            points: [...currentPathRef.current],
            color,
            strokeWidth,
            opacity,
          },
        ]);
      }
      currentPathRef.current = [];
    } else if (activeTool === 'text' || activeTool === 'note') {
      setAnnotations((prev) => [
        ...prev,
        {
          id: newId,
          type: 'text',
          pageIndex,
          x: coords.x,
          y: coords.y,
          text: textContent || 'Note',
          color,
          fontSize,
          opacity,
        },
      ]);
    } else if (activeTool === 'highlight') {
      const x = Math.min(start.x, coords.x);
      const y = Math.min(start.y, coords.y);
      const width = Math.max(Math.abs(coords.x - start.x), 40);
      const height = Math.max(Math.abs(coords.y - start.y), 16);

      setAnnotations((prev) => [
        ...prev,
        {
          id: newId,
          type: 'highlight',
          pageIndex,
          x,
          y,
          width,
          height,
          color: color || '#facc15',
          opacity: 0.4,
        },
      ]);
    } else if (activeTool === 'strike') {
      const x = Math.min(start.x, coords.x);
      const y = Math.min(start.y, coords.y);
      const width = Math.max(Math.abs(coords.x - start.x), 40);
      const height = Math.max(Math.abs(coords.y - start.y), 12);

      setAnnotations((prev) => [
        ...prev,
        {
          id: newId,
          type: 'strike',
          pageIndex,
          x,
          y,
          width,
          height,
          color: color || '#ef4444',
          strokeWidth,
          opacity,
        },
      ]);
    } else if (activeTool === 'rect') {
      const x = Math.min(start.x, coords.x);
      const y = Math.min(start.y, coords.y);
      const width = Math.max(Math.abs(coords.x - start.x), 20);
      const height = Math.max(Math.abs(coords.y - start.y), 20);

      setAnnotations((prev) => [
        ...prev,
        {
          id: newId,
          type: 'rect',
          pageIndex,
          x,
          y,
          width,
          height,
          color,
          strokeWidth,
          opacity,
        },
      ]);
    } else if (activeTool === 'circle') {
      const x = Math.min(start.x, coords.x);
      const y = Math.min(start.y, coords.y);
      const size = Math.max(Math.abs(coords.x - start.x), Math.abs(coords.y - start.y), 20);

      setAnnotations((prev) => [
        ...prev,
        {
          id: newId,
          type: 'circle',
          pageIndex,
          x,
          y,
          width: size,
          height: size,
          color,
          strokeWidth,
          opacity,
        },
      ]);
    } else if (activeTool === 'stamp') {
      setAnnotations((prev) => [
        ...prev,
        {
          id: newId,
          type: 'stamp',
          pageIndex,
          x: coords.x,
          y: coords.y,
          stampType,
          width: 140,
          height: 42,
        },
      ]);
    }

    drawStartPosRef.current = null;
  };

  // Redraw interactive canvas markup
  const redrawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageIndex = currentPage - 1;
    const pageAnns = annotations.filter((a) => a.pageIndex === pageIndex);

    for (const ann of pageAnns) {
      ctx.save();
      const displayY = pageSize.height - ann.y;

      if (ann.type === 'text' || ann.type === 'note') {
        ctx.fillStyle = ann.color || '#ffffff';
        ctx.globalAlpha = ann.opacity ?? 1;
        ctx.font = `bold ${Math.round((ann.fontSize || 14) * scale)}px sans-serif`;
        ctx.fillText(ann.text || '', ann.x * scale, displayY * scale);
      } else if (ann.type === 'highlight') {
        ctx.fillStyle = ann.color || '#facc15';
        ctx.globalAlpha = 0.4;
        const topY = pageSize.height - (ann.y + (ann.height || 18));
        ctx.fillRect(ann.x * scale, topY * scale, (ann.width || 80) * scale, (ann.height || 18) * scale);
      } else if (ann.type === 'strike') {
        ctx.strokeStyle = ann.color || '#ef4444';
        ctx.lineWidth = (ann.strokeWidth || 2) * scale;
        ctx.globalAlpha = ann.opacity ?? 0.9;
        const topY = pageSize.height - (ann.y + (ann.height || 12) / 2);
        ctx.beginPath();
        ctx.moveTo(ann.x * scale, topY * scale);
        ctx.lineTo((ann.x + (ann.width || 80)) * scale, topY * scale);
        ctx.stroke();
      } else if (ann.type === 'rect') {
        ctx.strokeStyle = ann.color || '#ef4444';
        ctx.lineWidth = (ann.strokeWidth || 2) * scale;
        ctx.globalAlpha = ann.opacity ?? 0.9;
        const topY = pageSize.height - (ann.y + (ann.height || 60));
        ctx.strokeRect(ann.x * scale, topY * scale, (ann.width || 80) * scale, (ann.height || 60) * scale);
      } else if (ann.type === 'circle') {
        ctx.strokeStyle = ann.color || '#ef4444';
        ctx.lineWidth = (ann.strokeWidth || 2) * scale;
        ctx.globalAlpha = ann.opacity ?? 0.9;
        const radius = ((ann.width || 40) / 2) * scale;
        const topY = pageSize.height - (ann.y + (ann.height || 40) / 2);
        ctx.beginPath();
        ctx.arc((ann.x + (ann.width || 40) / 2) * scale, topY * scale, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ann.type === 'draw' && ann.points && ann.points.length > 1) {
        ctx.strokeStyle = ann.color || '#ef4444';
        ctx.lineWidth = (ann.strokeWidth || 3) * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = ann.opacity ?? 0.9;
        ctx.beginPath();
        const first = ann.points[0];
        ctx.moveTo(first.x * scale, (pageSize.height - first.y) * scale);
        for (let i = 1; i < ann.points.length; i++) {
          const pt = ann.points[i];
          ctx.lineTo(pt.x * scale, (pageSize.height - pt.y) * scale);
        }
        ctx.stroke();
      } else if (ann.type === 'stamp') {
        const text = ann.stampType || 'APPROVED';
        const stColor =
          text === 'APPROVED' || text === 'COMPLETED' ? '#22c55e' : text === 'CONFIDENTIAL' || text === 'VOID' ? '#ef4444' : '#3b82f6';
        ctx.strokeStyle = stColor;
        ctx.fillStyle = stColor;
        ctx.lineWidth = 2.5 * scale;
        const topY = pageSize.height - (ann.y + (ann.height || 42));
        ctx.strokeRect(ann.x * scale, topY * scale, (ann.width || 140) * scale, (ann.height || 42) * scale);
        ctx.font = `bold ${Math.round(14 * scale)}px sans-serif`;
        ctx.fillText(text, (ann.x + 12) * scale, (topY + 26) * scale);
      }
      ctx.restore();
    }

    // Active freehand drawing in-progress
    if (currentPathRef.current.length > 1) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      const first = currentPathRef.current[0];
      ctx.moveTo(first.x * scale, (pageSize.height - first.y) * scale);
      for (let i = 1; i < currentPathRef.current.length; i++) {
        const pt = currentPathRef.current[i];
        ctx.lineTo(pt.x * scale, (pageSize.height - pt.y) * scale);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [annotations, currentPage, pageSize, scale, color, strokeWidth, opacity]);

  useEffect(() => {
    redrawOverlay();
  }, [annotations, currentPage, pageSize, scale, redrawOverlay]);

  // Export process
  const handleExport = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);
      setProgressMsg('Baking annotations into standard PDF...');

      const res = await PdfEngine.applyAnnotations(file, annotations, (pct, msg) => {
        setProgressMsg(msg);
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to export annotated PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Info */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-cyan-400" />
              PDF Annotator & Visual Markup
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Add text, highlighters, stamps, freehand sketches, and geometrical callouts directly inside your browser.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Client-Side RAM Processing</span>
          </div>
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
          title="Upload PDF to Annotate & Markup"
          subtitle="Supports single and multi-page PDFs with visual canvas tools"
        />
      ) : (
        <div className="space-y-6">
          {/* Main Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Page Thumbnails & Navigation Sidebar */}
            <div className="lg:col-span-3 space-y-4 bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pages ({totalPages})</span>
                <span className="text-xs text-cyan-400 font-mono">Page {currentPage}</span>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {thumbnails.map((t) => {
                  const annCount = annotations.filter((a) => a.pageIndex === t.pageNumber - 1).length;
                  const isActive = currentPage === t.pageNumber;
                  return (
                    <button
                      key={t.pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(t.pageNumber)}
                      className={`w-full text-left p-2 rounded-xl transition-all flex items-center gap-3 border ${
                        isActive
                          ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-200 shadow-md'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="w-12 h-16 bg-slate-950 rounded border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={t.dataUrl} alt={`Page ${t.pageNumber}`} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium block text-slate-200">Page {t.pageNumber}</span>
                        {annCount > 0 && (
                          <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded inline-block mt-1 font-mono">
                            {annCount} markup{annCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 disabled:opacity-40 text-xs font-medium transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Undo (Ctrl+Z)
                </button>
                <button
                  type="button"
                  onClick={clearAllAnnotations}
                  disabled={annotations.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/30 border border-red-800/50 hover:bg-red-950/60 text-red-300 disabled:opacity-40 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All Markups
                </button>
              </div>
            </div>

            {/* Right: Canvas & Annotation Control Bar */}
            <div className="lg:col-span-9 space-y-4">
              {/* Tool Selection Toolbar */}
              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool('highlight');
                        setColor('#facc15');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        activeTool === 'highlight' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Highlighter className="w-3.5 h-3.5" /> Highlight
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool('strike');
                        setColor('#ef4444');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        activeTool === 'strike' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Strikethrough className="w-3.5 h-3.5" /> Strike
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool('draw');
                        setColor('#ef4444');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        activeTool === 'draw' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" /> Draw
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool('text');
                        setColor('#ffffff');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        activeTool === 'text' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5" /> Text
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool('rect');
                        setColor('#ef4444');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        activeTool === 'rect' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Square className="w-3.5 h-3.5" /> Box
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool('circle');
                        setColor('#ef4444');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        activeTool === 'circle' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Circle className="w-3.5 h-3.5" /> Circle
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool('stamp')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        activeTool === 'stamp' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Stamp className="w-3.5 h-3.5" /> Stamp
                    </button>
                  </div>

                  {/* Zoom Controls & Page Flip */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-mono px-2 text-slate-300">{Math.round(scale * 100)}%</span>
                      <button
                        type="button"
                        onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-mono px-2 text-slate-300">
                        {currentPage}/{totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-tool parameter options */}
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80 text-xs">
                  {activeTool === 'text' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Text:</span>
                      <input
                        type="text"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Click canvas to place"
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 text-xs w-44 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}

                  {activeTool === 'stamp' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Stamp Preset:</span>
                      <select
                        value={stampType}
                        onChange={(e) => setStampType(e.target.value as any)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                      >
                        <option value="APPROVED">APPROVED (Green)</option>
                        <option value="CONFIDENTIAL">CONFIDENTIAL (Red)</option>
                        <option value="DRAFT">DRAFT (Blue)</option>
                        <option value="VOID">VOID (Red)</option>
                        <option value="COMPLETED">COMPLETED (Green)</option>
                      </select>
                    </div>
                  )}

                  {activeTool !== 'stamp' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Palette className="w-3 h-3 text-cyan-400" /> Color:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ffffff', '#000000'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-5 h-5 rounded-full border ${color === c ? 'border-white scale-110 shadow' : 'border-slate-700'}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {(activeTool === 'draw' || activeTool === 'rect' || activeTool === 'circle' || activeTool === 'strike') && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Thickness:</span>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
                        className="w-20 accent-cyan-500"
                      />
                      <span className="font-mono text-slate-300">{strokeWidth}px</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Interactive Canvas Area */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-center overflow-auto min-h-[500px]">
                {pageCanvasDataUrl ? (
                  <div
                    className="relative shadow-2xl rounded border border-slate-700 select-none touch-none"
                    style={{
                      width: `${pageSize.width * scale}px`,
                      height: `${pageSize.height * scale}px`,
                    }}
                  >
                    {/* Rendered PDF Page Background Image */}
                    <img
                      src={pageCanvasDataUrl}
                      alt="PDF Page"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    />

                    {/* Interactive Annotation Canvas Overlay */}
                    <canvas
                      ref={canvasRef}
                      width={Math.round(pageSize.width * scale)}
                      height={Math.round(pageSize.height * scale)}
                      onMouseDown={handlePointerDown}
                      onMouseMove={handlePointerMove}
                      onMouseUp={handlePointerUp}
                      onTouchStart={handlePointerDown}
                      onTouchMove={handlePointerMove}
                      onTouchEnd={handlePointerUp}
                      className="absolute inset-0 w-full h-full cursor-crosshair"
                    />
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-500 text-sm">
                    Rendering page preview...
                  </div>
                )}
              </div>

              {/* Export & Result Bar */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  Total Markups Applied: <span className="text-cyan-300 font-mono font-bold">{annotations.length}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setAnnotations([]);
                      setResult(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Change File
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? progressMsg || 'Processing...' : 'Save & Export PDF'}
                  </button>
                </div>
              </div>

              {/* Download Ready Display */}
              {result && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-emerald-200 block">PDF Successfully Annotated!</span>
                    <span className="text-xs text-emerald-400/80 font-mono">
                      {result.fileName} ({(result.fileSizeBytes / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <DownloadButton
                    url={result.downloadUrl}
                    fileName={result.fileName}
                    label="Download Annotated PDF"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Move, Grid, Sparkles } from 'lucide-react';
import { ImageDimensions } from '../../types/image';

interface ImagePreviewCanvasProps {
  imageUrl: string;
  dimensions?: ImageDimensions;
  title?: string;
  showGrid?: boolean;
  maxHeight?: string;
  altText?: string;
}

export const ImagePreviewCanvas: React.FC<ImagePreviewCanvasProps> = ({
  imageUrl,
  dimensions,
  title,
  showGrid = true,
  maxHeight = 'max-h-[500px]',
  altText = 'Processed image preview',
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [gridEnabled, setGridEnabled] = useState(showGrid);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div className="bg-slate-950/70 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col space-y-0">
      {/* Top Controls Bar */}
      <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold text-white truncate">{title || 'Image Preview'}</span>
          {dimensions && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {dimensions.width} × {dimensions.height} px
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setGridEnabled(!gridEnabled)}
            className={`p-1.5 rounded-lg border transition-all ${
              gridEnabled
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle transparency checkerboard"
            aria-label="Toggle transparency grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-all"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-mono font-medium px-2 py-0.5 text-cyan-300">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-all"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Fit to View"
            aria-label="Reset zoom and center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full ${maxHeight} min-h-[280px] sm:min-h-[380px] flex items-center justify-center p-4 overflow-hidden select-none ${
          zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        } ${gridEnabled ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-[#070d18]' : 'bg-[#060a12]'}`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-xl overflow-hidden"
        >
          <img
            src={imageUrl}
            alt={altText}
            className="max-h-[460px] max-w-full object-contain rounded-lg transition-all"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};

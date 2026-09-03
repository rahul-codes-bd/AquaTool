import React, { useState, useRef, useCallback } from 'react';
import { ChevronsLeftRight, Sparkles, Layers } from 'lucide-react';

interface BeforeAfterSliderProps {
  originalUrl: string;
  processedUrl: string;
  originalLabel?: string;
  processedLabel?: string;
  originalSizeText?: string;
  processedSizeText?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalUrl,
  processedUrl,
  originalLabel = 'Original',
  processedLabel = 'Optimized',
  originalSizeText,
  processedSizeText,
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percent);
    },
    []
  );

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className={`space-y-2 select-none ${className}`}>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        className="relative w-full h-[320px] sm:h-[440px] rounded-3xl overflow-hidden border border-white/10 bg-[#070d18] shadow-2xl cursor-ew-resize"
      >
        {/* Processed (After) Image - Background Layer */}
        <div className="absolute inset-0 flex items-center justify-center p-2 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          <img
            src={processedUrl}
            alt={processedLabel}
            className="max-w-full max-h-full object-contain pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Original (Before) Image - Clipped Top Layer */}
        <div
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
          className="absolute inset-0 flex items-center justify-center p-2 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"
        >
          <img
            src={originalUrl}
            alt={originalLabel}
            className="max-w-full max-h-full object-contain pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Vertical Divider Line with Floating Grab Handle */}
        <div
          style={{ left: `${sliderPosition}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] z-20 pointer-events-none"
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.6)] border-2 border-white">
            <ChevronsLeftRight className="w-4 h-4" />
          </div>
        </div>

        {/* Left Label Pill (Original) */}
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 shadow-lg">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>{originalLabel}</span>
          {originalSizeText && (
            <span className="text-[10px] text-cyan-300 font-mono font-normal">({originalSizeText})</span>
          )}
        </div>

        {/* Right Label Pill (Processed) */}
        <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-cyan-950/80 backdrop-blur-md border border-cyan-500/30 text-xs font-semibold text-cyan-200 flex items-center gap-1.5 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{processedLabel}</span>
          {processedSizeText && (
            <span className="text-[10px] text-cyan-300 font-mono font-normal">({processedSizeText})</span>
          )}
        </div>
      </div>

      {/* Keyboard instructions & slider bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
        <span>← Slide left/right to compare</span>
        <div className="flex items-center gap-2">
          <span>Split:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="w-24 accent-cyan-400 h-1 bg-white/10 rounded-lg cursor-pointer"
            aria-label="Comparison split position"
          />
          <span className="font-mono text-cyan-300 w-8 text-right">{Math.round(sliderPosition)}%</span>
        </div>
      </div>
    </div>
  );
};

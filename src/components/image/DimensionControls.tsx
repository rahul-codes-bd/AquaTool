import React from 'react';
import { Lock, Unlock, RefreshCcw, Maximize2 } from 'lucide-react';
import { ImageDimensions } from '../../types/image';
import { IMAGE_CONFIG } from '../../config/imageConfig';

interface DimensionControlsProps {
  originalDimensions: ImageDimensions;
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  scalePercent: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onMaintainAspectRatioToggle: () => void;
  onScalePercentChange: (percent: number) => void;
  onReset: () => void;
}

export const DimensionControls: React.FC<DimensionControlsProps> = ({
  originalDimensions,
  width,
  height,
  maintainAspectRatio,
  scalePercent,
  onWidthChange,
  onHeightChange,
  onMaintainAspectRatioToggle,
  onScalePercentChange,
  onReset,
}) => {
  const handleWidthInput = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      onWidthChange(num);
      if (maintainAspectRatio && originalDimensions.width > 0) {
        const calculatedHeight = Math.round((num / originalDimensions.width) * originalDimensions.height);
        onHeightChange(calculatedHeight);
      }
    }
  };

  const handleHeightInput = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      onHeightChange(num);
      if (maintainAspectRatio && originalDimensions.height > 0) {
        const calculatedWidth = Math.round((num / originalDimensions.height) * originalDimensions.width);
        onWidthChange(calculatedWidth);
      }
    }
  };

  const presetScales = [
    { label: '25%', val: 0.25 },
    { label: '50%', val: 0.5 },
    { label: '75%', val: 0.75 },
    { label: '100%', val: 1.0 },
    { label: '150%', val: 1.5 },
    { label: '200%', val: 2.0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-cyan-400" />
          <span>Resize & Dimensions</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px]"
        >
          <RefreshCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Width & Height Inputs with Lock */}
      <div className="grid grid-cols-11 gap-2 items-center">
        {/* Width */}
        <div className="col-span-5 space-y-1">
          <label className="text-[11px] font-medium text-slate-400">Width (px)</label>
          <input
            type="number"
            min="1"
            max={IMAGE_CONFIG.MAX_SAFE_DIMENSION_PX}
            value={width || ''}
            onChange={(e) => handleWidthInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Lock Ratio Button */}
        <div className="col-span-1 flex items-center justify-center pt-5">
          <button
            type="button"
            onClick={onMaintainAspectRatioToggle}
            className={`p-2 rounded-xl border transition-all ${
              maintainAspectRatio
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title={maintainAspectRatio ? 'Aspect ratio is locked' : 'Aspect ratio is unlocked'}
            aria-label="Toggle aspect ratio lock"
          >
            {maintainAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Height */}
        <div className="col-span-5 space-y-1">
          <label className="text-[11px] font-medium text-slate-400">Height (px)</label>
          <input
            type="number"
            min="1"
            max={IMAGE_CONFIG.MAX_SAFE_DIMENSION_PX}
            value={height || ''}
            onChange={(e) => handleHeightInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      {/* Quick Percentage Presets */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-400">Quick Scale Factor</label>
        <div className="grid grid-cols-6 gap-1.5">
          {presetScales.map((p) => {
            const isActive = Math.abs(scalePercent - p.val) < 0.01;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onScalePercentChange(p.val);
                  onWidthChange(Math.round(originalDimensions.width * p.val));
                  onHeightChange(Math.round(originalDimensions.height * p.val));
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold font-mono border transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

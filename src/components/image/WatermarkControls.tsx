import React from 'react';
import { Stamp, AlignLeft, AlignCenter, AlignRight, Shield } from 'lucide-react';
import { ImageProcessingConfig } from '../../types/image';

interface WatermarkControlsProps {
  watermarkText: string;
  opacity: number;
  position: ImageProcessingConfig['watermarkPosition'];
  onTextChange: (text: string) => void;
  onOpacityChange: (opacity: number) => void;
  onPositionChange: (pos: ImageProcessingConfig['watermarkPosition']) => void;
}

export const WatermarkControls: React.FC<WatermarkControlsProps> = ({
  watermarkText,
  opacity,
  position,
  onTextChange,
  onOpacityChange,
  onPositionChange,
}) => {
  const positions: { id: ImageProcessingConfig['watermarkPosition']; label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'center', label: 'Center' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
        <div className="flex items-center gap-2">
          <Stamp className="w-4 h-4 text-cyan-400" />
          <span>Watermark & Copyright Stamp</span>
        </div>
        <span className="text-[11px] text-slate-400">Local Canvas Overlay</span>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-400">Watermark Text / Stamp</label>
        <input
          type="text"
          value={watermarkText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="e.g. © 2026 AquaTools • Confidential"
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
        />
      </div>

      {watermarkText.trim().length > 0 && (
        <>
          {/* Opacity slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Stamp Opacity</span>
              <span className="font-mono text-cyan-300">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={Math.round(opacity * 100)}
              onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
              className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              aria-label="Watermark opacity"
            />
          </div>

          {/* Position Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400">Alignment Position</label>
            <div className="grid grid-cols-3 gap-1.5">
              {positions.map((p) => {
                const isSelected = position === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPositionChange(p.id)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-medium border transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

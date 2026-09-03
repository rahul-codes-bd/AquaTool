import React from 'react';
import { ImageProcessingConfig } from '../../types/image';
import { Sliders, RotateCcw, Sparkles, Type, Square, Shield } from 'lucide-react';

interface ImageEditorControlsProps {
  config: ImageProcessingConfig;
  onChange: (updater: (prev: ImageProcessingConfig) => ImageProcessingConfig) => void;
  onReset: () => void;
}

export const ImageEditorControls: React.FC<ImageEditorControlsProps> = ({ config, onChange, onReset }) => {
  return (
    <div className="bg-slate-950/70 border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header with Master Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Advanced Adjustments & Effects</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset all adjustments"
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Toggles (Grayscale, Sepia, Invert, Sharpen) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Quick Filters & Enhancements</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={!!config.grayscale}
            onClick={() => onChange((c) => ({ ...c, grayscale: !c.grayscale }))}
            className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
              config.grayscale
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/10'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            Grayscale
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={!!config.sepia}
            onClick={() => onChange((c) => ({ ...c, sepia: !c.sepia }))}
            className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
              config.sepia
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            Sepia
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={!!config.invert}
            onClick={() => onChange((c) => ({ ...c, invert: !c.invert }))}
            className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
              config.invert
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-lg shadow-purple-500/10'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            Invert
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={!!config.sharpen}
            onClick={() => onChange((c) => ({ ...c, sharpen: !c.sharpen }))}
            className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
              config.sharpen
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/10'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            Sharpen
          </button>
        </div>
      </div>

      {/* Tone & Color Sliders */}
      <div className="space-y-4 pt-2 border-t border-white/10">
        <label className="text-xs font-semibold text-slate-300">Tone & Color Matrix</label>

        {/* Brightness */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Brightness</span>
            <span className="font-mono text-cyan-400">{config.brightness || 0}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={config.brightness || 0}
            onChange={(e) => onChange((c) => ({ ...c, brightness: Number(e.target.value) }))}
            aria-label="Brightness"
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Contrast</span>
            <span className="font-mono text-cyan-400">{config.contrast || 0}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={config.contrast || 0}
            onChange={(e) => onChange((c) => ({ ...c, contrast: Number(e.target.value) }))}
            aria-label="Contrast"
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Saturation</span>
            <span className="font-mono text-cyan-400">{config.saturation || 0}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={config.saturation || 0}
            onChange={(e) => onChange((c) => ({ ...c, saturation: Number(e.target.value) }))}
            aria-label="Saturation"
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
          />
        </div>

        {/* Exposure */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Exposure</span>
            <span className="font-mono text-cyan-400">{config.exposure || 0}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={config.exposure || 0}
            onChange={(e) => onChange((c) => ({ ...c, exposure: Number(e.target.value) }))}
            aria-label="Exposure"
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
          />
        </div>

        {/* Temperature */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Temperature (Warm / Cool)</span>
            <span className="font-mono text-cyan-400">{config.temperature || 0}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={config.temperature || 0}
            onChange={(e) => onChange((c) => ({ ...c, temperature: Number(e.target.value) }))}
            aria-label="Temperature"
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
          />
        </div>
      </div>

      {/* Effects & Blur / Pixelate */}
      <div className="space-y-4 pt-2 border-t border-white/10">
        <label className="text-xs font-semibold text-slate-300">Blur & Pixelation</label>

        {/* Blur Radius */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Blur Radius</span>
            <span className="font-mono text-cyan-400">{config.blurRadius || 0}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={config.blurRadius || 0}
            onChange={(e) => onChange((c) => ({ ...c, blurRadius: Number(e.target.value) }))}
            aria-label="Blur Radius"
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
          />
        </div>

        {/* Pixelate Size */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Pixelate Mosaic</span>
            <span className="font-mono text-cyan-400">{config.pixelateSize || 0}</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={config.pixelateSize || 0}
            onChange={(e) => onChange((c) => ({ ...c, pixelateSize: Number(e.target.value) }))}
            aria-label="Pixelate Size"
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
          />
        </div>
      </div>

      {/* Borders, Corners & Shadow */}
      <div className="space-y-4 pt-2 border-t border-white/10">
        <label className="text-xs font-semibold text-slate-300">Frame & Border Styling</label>

        <div className="grid grid-cols-2 gap-3">
          {/* Border Radius */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Corner Radius</span>
              <span className="font-mono text-cyan-400">{config.borderRadius || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.borderRadius || 0}
              onChange={(e) => onChange((c) => ({ ...c, borderRadius: Number(e.target.value) }))}
              aria-label="Corner Radius"
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
          </div>

          {/* Border Size */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Border Width</span>
              <span className="font-mono text-cyan-400">{config.borderSize || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={config.borderSize || 0}
              onChange={(e) => onChange((c) => ({ ...c, borderSize: Number(e.target.value) }))}
              aria-label="Border Width"
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
          </div>
        </div>

        {config.borderSize ? (
          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <span>Border Color</span>
            <input
              type="color"
              value={config.borderColor || '#ffffff'}
              onChange={(e) => onChange((c) => ({ ...c, borderColor: e.target.value }))}
              aria-label="Border Color"
              className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-white/20"
            />
          </div>
        ) : null}
      </div>

      {/* Custom Text & Shape Overlays */}
      <div className="space-y-4 pt-2 border-t border-white/10">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-cyan-400" />
          <span>Custom Text Stamp & Shapes</span>
        </label>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="Add custom caption or copyright..."
            value={config.customText || ''}
            onChange={(e) => onChange((c) => ({ ...c, customText: e.target.value }))}
            aria-label="Custom text stamp"
            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {config.customText && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Horizontal Position (%)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={config.customTextX ?? 50}
                onChange={(e) => onChange((c) => ({ ...c, customTextX: Number(e.target.value) }))}
                aria-label="Custom Text Horizontal Position"
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Vertical Position (%)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={config.customTextY ?? 85}
                onChange={(e) => onChange((c) => ({ ...c, customTextY: Number(e.target.value) }))}
                aria-label="Custom Text Vertical Position"
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Shape Overlays */}
        <div className="space-y-2 pt-1">
          <span className="text-xs text-slate-300">Geometric Shape Overlay</span>
          <div className="grid grid-cols-4 gap-2">
            {(['none', 'rectangle', 'circle', 'star'] as const).map((shape) => (
              <button
                key={shape}
                type="button"
                onClick={() => onChange((c) => ({ ...c, shapeOverlay: shape }))}
                className={`py-2 px-2 rounded-xl border text-xs capitalize transition-all ${
                  (config.shapeOverlay || 'none') === shape
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

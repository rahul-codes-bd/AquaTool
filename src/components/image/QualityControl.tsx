import React, { useState } from 'react';
import { Gauge, Sparkles, Sliders, Target, ShieldCheck, Info } from 'lucide-react';
import { IMAGE_CONFIG } from '../../config/imageConfig';

interface QualityControlProps {
  quality: number; // 0.01 - 1.0
  onChange: (quality: number) => void;
  format?: string;
  originalSizeBytes?: number;
  stripMetadata?: boolean;
  onStripMetadataChange?: (strip: boolean) => void;
  targetSizeBytes?: number;
  onTargetSizeChange?: (bytes: number | undefined) => void;
  isLosslessMode?: boolean;
  onLosslessModeToggle?: (lossless: boolean) => void;
}

export const QualityControl: React.FC<QualityControlProps> = ({
  quality,
  onChange,
  format = 'image/jpeg',
  originalSizeBytes,
  stripMetadata = true,
  onStripMetadataChange,
  targetSizeBytes,
  onTargetSizeChange,
  isLosslessMode = false,
  onLosslessModeToggle,
}) => {
  const [mode, setMode] = useState<'quality' | 'target'>('quality');
  const [targetKbInput, setTargetKbInput] = useState<string>(
    targetSizeBytes ? Math.round(targetSizeBytes / 1024).toString() : '200'
  );

  // PNG, BMP, ICO are strictly lossless in browser Canvas encoding.
  // WebP supports both lossless & lossy compression in supported browsers.
  const isInherentlyLossless = format === 'image/png' || format === 'image/bmp' || format === 'image/x-icon';
  const supportsLosslessToggle = format === 'image/webp';

  // Calculate estimated output size approximation
  const getEstimatedSize = () => {
    if (!originalSizeBytes) return null;
    if (isInherentlyLossless || (supportsLosslessToggle && isLosslessMode)) {
      if (format === 'image/webp') return Math.round(originalSizeBytes * 0.78);
      return Math.round(originalSizeBytes * 0.95);
    }
    let factor = Math.max(0.08, quality);
    if (format === 'image/webp') factor *= 0.70;
    if (format === 'image/avif') factor *= 0.55;
    if (format === 'image/jpeg') factor *= 0.88;
    return Math.round(originalSizeBytes * factor);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const estimatedBytes = getEstimatedSize();
  const estimatedSavingsPercent =
    originalSizeBytes && estimatedBytes
      ? Math.round(((originalSizeBytes - estimatedBytes) / originalSizeBytes) * 100)
      : null;

  // Handle Target Size input update
  const handleTargetKbChange = (val: string) => {
    setTargetKbInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && originalSizeBytes) {
      const targetBytes = num * 1024;
      if (onTargetSizeChange) onTargetSizeChange(targetBytes);

      // Estimate equivalent quality factor based on target size
      const targetRatio = targetBytes / originalSizeBytes;
      const computedQuality = Math.min(1.0, Math.max(0.05, targetRatio));
      onChange(parseFloat(computedQuality.toFixed(2)));
    } else if (val === '') {
      if (onTargetSizeChange) onTargetSizeChange(undefined);
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>Compression & Optimization</span>
        </div>

        {/* Compression Mode Selector */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode('quality');
              if (onTargetSizeChange) onTargetSizeChange(undefined);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              mode === 'quality' ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual Quality
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('target');
              handleTargetKbChange(targetKbInput);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              mode === 'target' ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Target Size
          </button>
        </div>
      </div>

      {/* Lossless format banner */}
      {isInherentlyLossless ? (
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <p className="font-semibold">Lossless Format Encoding</p>
            <p className="text-[11px] text-cyan-300/80 mt-0.5">
              100% pixel fidelity is preserved with zero compression artifacts.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* WebP Lossless / Lossy toggle where supported */}
          {supportsLosslessToggle && onLosslessModeToggle && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300">Lossless WebP Compression</span>
              </div>
              <button
                type="button"
                onClick={() => onLosslessModeToggle(!isLosslessMode)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isLosslessMode ? 'bg-cyan-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isLosslessMode ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {mode === 'target' ? (
            /* Target Size Approximation Mode */
            <div className="space-y-2 p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  Target File Size (Approx):
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="10"
                    value={targetKbInput}
                    onChange={(e) => handleTargetKbChange(e.target.value)}
                    className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-white/20 text-white text-xs font-mono text-right focus:border-cyan-400 focus:outline-none"
                    placeholder="200"
                  />
                  <span className="text-xs text-slate-400 font-mono">KB</span>
                </div>
              </div>

              {/* Quick Target Size Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {['50', '100', '200', '500'].map((kb) => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => handleTargetKbChange(kb)}
                    className={`py-1 px-1.5 rounded-lg text-[11px] font-mono border transition-all ${
                      targetKbInput === kb
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {kb} KB
                  </button>
                ))}
              </div>

              <div className="flex items-start gap-1.5 text-[10px] text-amber-300/90 pt-1 leading-normal">
                <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Exact target size is an approximation calculated via dynamic quality scaling. Browser entropy encoding varies by image detail.
                </span>
              </div>
            </div>
          ) : (
            /* Manual Quality Slider Mode */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Compression Level:</span>
                <span className="font-mono text-cyan-300 font-bold">{Math.round(quality * 100)}%</span>
              </div>

              <div className="space-y-1">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={Math.round(quality * 100)}
                  onChange={(e) => onChange(Number(e.target.value) / 100)}
                  className="w-full accent-cyan-400 h-2 bg-white/10 rounded-lg cursor-pointer"
                  aria-label="Quality percentage slider"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Small Size (5%)</span>
                  <span>Balanced (80%)</span>
                  <span>Max Quality (100%)</span>
                </div>
              </div>

              {/* Quality Presets */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {IMAGE_CONFIG.QUALITY_PRESETS.slice(0, 3).map((p) => {
                  const isActive = Math.abs(quality - p.quality) < 0.05;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => onChange(p.quality)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {p.label.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Estimation & Reduction Percentage */}
          {estimatedBytes && originalSizeBytes && (
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>Estimated Output Size:</span>
                <span className="font-mono font-semibold text-cyan-300">~{formatBytes(estimatedBytes)}</span>
              </div>
              {estimatedSavingsPercent !== null && (
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>Estimated Reduction:</span>
                  <span
                    className={`font-mono font-semibold ${
                      estimatedSavingsPercent > 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {estimatedSavingsPercent > 0 ? `~${estimatedSavingsPercent}% savings` : 'Original fidelity'}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Metadata Removal Option */}
      {onStripMetadataChange && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <span className="text-slate-300 font-medium">Remove Metadata (EXIF/GPS)</span>
              <p className="text-[10px] text-slate-400">Scrub location, camera model, and dates</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onStripMetadataChange(!stripMetadata)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              stripMetadata ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                stripMetadata ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
};


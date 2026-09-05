import React, { useState } from 'react';
import { Sliders, Eye, FileText, Image as ImageIcon, Zap } from 'lucide-react';

interface QualitySizeLabProps {
  file: File;
  targetFormat: string;
  initialQuality?: number;
  onQualityChange: (quality: number) => void;
}

export const QualitySizeLab: React.FC<QualitySizeLabProps> = ({
  file,
  targetFormat,
  initialQuality = 0.85,
  onQualityChange,
}) => {
  const [quality, setQuality] = useState(initialQuality);

  const handleSlider = (val: number) => {
    setQuality(val);
    onQualityChange(val);
  };

  const origSizeMb = file.size / (1024 * 1024);
  const estimatedOutputMb = origSizeMb * quality * (targetFormat === 'webp' ? 0.65 : targetFormat === 'jpg' ? 0.75 : 0.95);
  const savingsPct = Math.max(0, Math.round((1 - estimatedOutputMb / origSizeMb) * 100));

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Quality-vs-Size Optimization Lab</span>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-400">
          Estimated Savings: -{savingsPct}%
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-medium">Quality & Bitrate Compression</span>
          <span className="font-mono text-cyan-300 font-bold">{Math.round(quality * 100)}%</span>
        </div>

        <input
          type="range"
          min={0.1}
          max={1.0}
          step={0.05}
          value={quality}
          onChange={(e) => handleSlider(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>Max Compression (10%)</span>
          <span>Balanced (80%)</span>
          <span>Lossless / Max Fidelity (100%)</span>
        </div>
      </div>

      {/* Side-by-side Estimation Cards */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Original Stream</span>
          <div className="font-mono font-bold text-slate-200">{origSizeMb.toFixed(2)} MB</div>
          <span className="text-[10px] text-slate-500 block">{file.name}</span>
        </div>

        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs space-y-1">
          <span className="text-[10px] font-mono text-cyan-400 uppercase">Estimated Output</span>
          <div className="font-mono font-bold text-cyan-300">{estimatedOutputMb.toFixed(2)} MB</div>
          <span className="text-[10px] text-cyan-400/80 block uppercase font-mono">{targetFormat} Format</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Sparkles, ArrowDownRight, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ImageStats } from '../../types/image';

interface OutputSummaryProps {
  stats?: ImageStats;
  fileName?: string;
}

export const OutputSummary: React.FC<OutputSummaryProps> = ({ stats, fileName }) => {
  if (!stats) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isSavingsPositive = stats.originalSize > stats.newSize;
  const savingsPercent = isSavingsPositive
    ? Math.round(((stats.originalSize - stats.newSize) / stats.originalSize) * 100)
    : 0;

  return (
    <div className="bg-slate-950/70 border border-white/10 rounded-3xl p-5 backdrop-blur-xl space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Processing Completed Successfully</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{stats.durationMs} ms</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Original vs New Size */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
          <p className="text-[10px] text-slate-400 font-medium">Original Size</p>
          <p className="text-xs font-mono font-bold text-slate-300">{formatBytes(stats.originalSize)}</p>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
          <p className="text-[10px] text-slate-400 font-medium">New Output Size</p>
          <p className="text-xs font-mono font-bold text-cyan-300">{formatBytes(stats.newSize)}</p>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
          <p className="text-[10px] text-slate-400 font-medium">Dimensions</p>
          <p className="text-xs font-mono font-bold text-white">
            {stats.newWidth} × {stats.newHeight} px
          </p>
        </div>

        <div
          className={`p-3 rounded-2xl border space-y-0.5 ${
            isSavingsPositive
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}
        >
          <p className="text-[10px] opacity-80 font-medium">Byte Savings</p>
          <p className="text-xs font-mono font-bold flex items-center gap-1">
            {isSavingsPositive ? `-${savingsPercent}%` : '0% (Fidelity)'}
          </p>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Output encoded 100% locally in device memory. Ready for instant download.</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 uppercase font-bold">
          {stats.format}
        </span>
      </div>
    </div>
  );
};

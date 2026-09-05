import React from 'react';

interface ConversionProgressProps {
  progress: number;
  statusText?: string;
}

export const ConversionProgress: React.FC<ConversionProgressProps> = ({ progress, statusText = 'Processing file locally...' }) => {
  const cappedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
        <span className="text-cyan-300 font-medium">{statusText}</span>
        <span className="font-bold text-slate-200">{Math.round(cappedProgress)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
          style={{ width: `${cappedProgress}%` }}
        />
      </div>
    </div>
  );
};

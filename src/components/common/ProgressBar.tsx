import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  stageText?: string;
  status?: 'idle' | 'processing' | 'success' | 'error';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  stageText,
  status = 'processing',
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  const isSuccess = status === 'success' || clamped === 100;
  const isError = status === 'error';

  return (
    <div
      className={`w-full space-y-2 select-none ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={stageText || `Progress: ${clamped}%`}
    >
      <div className="flex justify-between items-center text-xs">
        <span
          className={`font-medium flex items-center gap-1.5 ${
            isError
              ? 'text-rose-300'
              : isSuccess
              ? 'text-teal-300'
              : 'text-cyan-300'
          }`}
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isError
                ? 'bg-rose-400'
                : isSuccess
                ? 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]'
                : 'bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]'
            }`}
          />
          {stageText || (isSuccess ? 'Processing complete' : 'Processing local file...')}
        </span>
        <span
          className={`font-mono font-semibold ${
            isError ? 'text-rose-400' : isSuccess ? 'text-teal-300' : 'text-cyan-400'
          }`}
        >
          {clamped}%
        </span>
      </div>

      <div className="w-full h-2.5 bg-slate-900/80 rounded-full overflow-hidden border border-white/10 p-0.5 backdrop-blur-md">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isError
              ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
              : isSuccess
              ? 'bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]'
              : 'bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400 shadow-[0_0_14px_rgba(6,182,212,0.6)]'
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

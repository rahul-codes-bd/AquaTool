import React from 'react';
import { AlertTriangle, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';

interface ErrorRecoveryPanelProps {
  error: string;
  onRetry?: () => void;
  onFallback?: () => void;
  fallbackLabel?: string;
}

export const ErrorRecoveryPanel: React.FC<ErrorRecoveryPanelProps> = ({
  error,
  onRetry,
  onFallback,
  fallbackLabel = 'Try Safe PNG Fallback',
}) => {
  return (
    <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-4 shadow-xl backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Image Processing Notice</h4>
          <p className="text-xs text-rose-200/90 leading-relaxed">{error}</p>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Troubleshooting Tips:</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
          <li>Ensure the file is not corrupted or password-protected.</li>
          <li>For huge dimensions (e.g. &gt; 8000px), try scaling to 50% first to stay within browser canvas limits.</li>
          <li>Try exporting as PNG or JPEG if AVIF/WebP is unsupported on your browser version.</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Processing</span>
          </button>
        )}
        {onFallback && (
          <button
            type="button"
            onClick={onFallback}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{fallbackLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

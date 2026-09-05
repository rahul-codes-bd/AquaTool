import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorRecoveryPanelProps {
  error: string;
  onRetry: () => void;
  onDismiss: () => void;
}

export const ErrorRecoveryPanel: React.FC<ErrorRecoveryPanelProps> = ({ error, onRetry, onDismiss }) => {
  return (
    <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-3 shadow-xl">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-rose-300 block">Conversion Error Encountered</span>
          <p className="text-rose-100/90 font-mono text-[11px]">{error}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Conversion</span>
        </button>
      </div>
    </div>
  );
};

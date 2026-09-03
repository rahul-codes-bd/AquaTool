import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, X } from 'lucide-react';
import { t } from '../../i18n';

interface ErrorAlertProps {
  title?: string;
  message: string;
  code?: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title,
  message,
  code,
  details,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-4 sm:p-5 rounded-2xl bg-rose-950/45 border border-rose-500/40 text-rose-200 text-sm shadow-xl shadow-black/30 backdrop-blur-xl animate-in fade-in duration-200 space-y-3 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-900/50 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
            <AlertCircle className="w-4.5 h-4.5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-rose-200 text-sm">
                {title || t('common.error')}
              </h4>
              {code && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-900/60 text-rose-300 border border-rose-700/50">
                  {code}
                </span>
              )}
            </div>
            <p className="text-rose-200/90 text-xs sm:text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-100 hover:bg-rose-900/40 transition-colors"
            aria-label="Dismiss error notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {details && (
        <div className="pt-2 border-t border-rose-800/40">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-medium text-rose-300 hover:text-rose-100 flex items-center gap-1 transition-colors"
            aria-expanded={showDetails}
          >
            <span>{showDetails ? 'Hide technical diagnostics' : 'Show technical diagnostics'}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showDetails && (
            <pre className="mt-2 p-3 rounded-xl bg-black/40 border border-rose-900/40 text-[11px] font-mono text-rose-300/90 overflow-x-auto whitespace-pre-wrap max-h-40">
              {details}
            </pre>
          )}
        </div>
      )}

      {onRetry && (
        <div className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
};

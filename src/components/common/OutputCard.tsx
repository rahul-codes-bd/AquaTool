import React from 'react';
import { CopyButton } from './CopyButton';
import { DownloadButton } from './DownloadButton';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { t } from '../../i18n';

interface OutputCardProps {
  title?: string;
  resultText?: string;
  blob?: Blob;
  downloadUrl?: string;
  fileName?: string;
  stats?: Record<string, string | number>;
  previewElement?: React.ReactNode;
  onReset?: () => void;
  className?: string;
}

export const OutputCard: React.FC<OutputCardProps> = ({
  title = 'Output Result',
  resultText,
  blob,
  downloadUrl,
  fileName,
  stats,
  previewElement,
  onReset,
  className = '',
}) => {
  return (
    <div
      className={`glass-panel rounded-3xl p-5 sm:p-6 border border-cyan-500/30 space-y-5 shadow-2xl shadow-black/30 backdrop-blur-2xl animate-in fade-in duration-200 ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base tracking-tight">{title}</h3>
            <span className="text-[11px] text-teal-400 font-mono">100% Client-Side Generated</span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {resultText && <CopyButton textToCopy={resultText} />}
          {fileName && (blob || downloadUrl) && (
            <DownloadButton blob={blob} url={downloadUrl} fileName={fileName} />
          )}
          {onReset && (
            <button
              type="button"
              id="reset-output-btn"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95"
              aria-label="Reset and process another file"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('common.reset')}</span>
            </button>
          )}
        </div>
      </div>

      {stats && Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 text-xs">
          {Object.entries(stats).map(([label, val]) => (
            <div key={label} className="space-y-0.5">
              <span className="text-[11px] text-slate-400 capitalize">
                {label.replace(/([A-Z])/g, ' $1')}
              </span>
              <p className="font-semibold text-cyan-300 font-mono text-xs sm:text-sm truncate" title={String(val)}>
                {String(val)}
              </p>
            </div>
          ))}
        </div>
      )}

      {previewElement && (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40">
          {previewElement}
        </div>
      )}

      {resultText && !previewElement && (
        <div className="relative">
          <textarea
            readOnly
            value={resultText}
            rows={Math.min(16, Math.max(5, resultText.split('\n').length))}
            className="w-full p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-cyan-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y leading-relaxed"
            aria-label="Result text"
          />
        </div>
      )}
    </div>
  );
};

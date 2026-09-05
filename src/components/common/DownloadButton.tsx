import React, { useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { t } from '../../i18n';
import { FileHandlerService } from '../../services/fileHandler';

interface DownloadButtonProps {
  blob?: Blob;
  url?: string;
  content?: string;
  mimeType?: string;
  fileName: string;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  blob,
  url,
  content,
  mimeType = 'text/plain',
  fileName,
  className = '',
  label,
  disabled = false,
}) => {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done'>('idle');

  const handleDownload = () => {
    const effectiveBlob = blob || (content !== undefined ? new Blob([content], { type: mimeType }) : undefined);
    if (disabled || (!effectiveBlob && !url)) return;

    setDownloadState('downloading');

    let downloadUrl = url;
    let shouldRevoke = false;

    if (effectiveBlob && !downloadUrl) {
      downloadUrl = URL.createObjectURL(effectiveBlob);
      shouldRevoke = true;
    }

    if (!downloadUrl) {
      setDownloadState('idle');
      return;
    }

    // Safe filename sanitization to prevent directory traversal and illegal characters
    const sanitizedFileName = FileHandlerService.sanitizeFileName(fileName, 'download');

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = sanitizedFileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up temporary Object URL safely after download initiates
    if (shouldRevoke) {
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl!);
      }, 1500);
    }

    setDownloadState('done');
    setTimeout(() => {
      setDownloadState('idle');
    }, 2000);
  };

  const isInteractive = !disabled && (!!blob || !!url);

  return (
    <button
      type="button"
      id="download-action-btn"
      onClick={handleDownload}
      disabled={!isInteractive || downloadState === 'downloading'}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 active:scale-95 select-none ${
        !isInteractive
          ? 'bg-slate-800/40 text-slate-500 border border-slate-700/40 cursor-not-allowed'
          : downloadState === 'done'
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
          : 'bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.35)]'
      } ${className}`}
      aria-label={label || `${t('common.download')} ${fileName}`}
      aria-live="polite"
    >
      {downloadState === 'downloading' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Preparing...</span>
        </>
      ) : downloadState === 'done' ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Downloaded</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>{label || t('common.download')}</span>
        </>
      )}
    </button>
  );
};

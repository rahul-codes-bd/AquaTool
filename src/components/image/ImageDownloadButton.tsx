import React, { useState } from 'react';
import { Download, Check, Sparkles, Loader2 } from 'lucide-react';

interface ImageDownloadButtonProps {
  blob?: Blob;
  downloadUrl?: string;
  fileName?: string;
  formatExtension?: string;
  sizeBytes?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const ImageDownloadButton: React.FC<ImageDownloadButtonProps> = ({
  blob,
  downloadUrl,
  fileName = 'aquatools_processed_image',
  formatExtension = 'png',
  sizeBytes,
  label = 'Download Processed Image',
  disabled = false,
  className = '',
}) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    if (disabled) return;

    let targetUrl = downloadUrl;
    let createdUrl = false;

    if (!targetUrl && blob) {
      targetUrl = URL.createObjectURL(blob);
      createdUrl = true;
    }

    if (!targetUrl) return;

    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const cleanExt = formatExtension.replace(/^\./, '');
    const finalFilename = `${baseName}.${cleanExt}`;

    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (createdUrl) {
      setTimeout(() => URL.revokeObjectURL(targetUrl!), 10000);
    }

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || (!downloadUrl && !blob)}
      className={`relative group px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-xl ${
        downloaded
          ? 'bg-emerald-500 text-slate-950 border border-emerald-400 shadow-emerald-500/30'
          : 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 border border-cyan-300 hover:brightness-110 active:scale-[0.98] shadow-cyan-500/25'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      {downloaded ? (
        <>
          <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
          <span>Downloaded Successfully!</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4 text-slate-950 stroke-[2.5] group-hover:translate-y-0.5 transition-transform" />
          <span>{label}</span>
          {sizeBytes ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950/20 font-mono font-bold">
              {formatBytes(sizeBytes)}
            </span>
          ) : null}
        </>
      )}
    </button>
  );
};

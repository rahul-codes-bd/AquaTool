import React, { useState } from 'react';
import { Archive, Check, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { ImageFileItem } from '../../types/image';

interface ZipExportButtonProps {
  items: ImageFileItem[];
  zipFileName?: string;
  label?: string;
  disabled?: boolean;
}

export const ZipExportButton: React.FC<ZipExportButtonProps> = ({
  items,
  zipFileName = 'aquatools_images_bundle.zip',
  label = 'Download All as ZIP',
  disabled = false,
}) => {
  const [isPacking, setIsPacking] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleExportZip = async () => {
    if (disabled || isPacking || items.length === 0) return;

    try {
      setIsPacking(true);
      const zip = new JSZip();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const blob = item.resultBlob || item.file;
        const filename = item.resultFileName || item.name;
        zip.file(filename, blob);
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (err) {
      console.error('Failed to create ZIP bundle:', err);
    } finally {
      setIsPacking(false);
    }
  };

  const completedCount = items.filter((i) => i.resultBlob || i.status === 'completed').length;

  return (
    <button
      type="button"
      onClick={handleExportZip}
      disabled={disabled || isPacking || completedCount === 0}
      className={`px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 border shadow-lg ${
        isDone
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20'
          : 'bg-white/5 hover:bg-white/10 text-white border-white/15 hover:border-cyan-400/40'
      } ${disabled || completedCount === 0 ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {isPacking ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Packing {completedCount} files into ZIP...</span>
        </>
      ) : isDone ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          <span>ZIP Downloaded!</span>
        </>
      ) : (
        <>
          <Archive className="w-4 h-4 text-cyan-400" />
          <span>
            {label} ({completedCount})
          </span>
        </>
      )}
    </button>
  );
};

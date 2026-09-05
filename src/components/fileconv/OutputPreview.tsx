import React from 'react';
import { Eye, FileText, Image as ImageIcon, Music, Video, Archive } from 'lucide-react';

interface OutputPreviewProps {
  blob?: Blob;
  url?: string;
  filename: string;
  format: string;
}

export const OutputPreview: React.FC<OutputPreviewProps> = ({ url, filename, format }) => {
  if (!url) return null;

  const lowerFmt = format.toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico', 'avif'].includes(lowerFmt);
  const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(lowerFmt);
  const isVideo = ['mp4', 'webm', 'mov'].includes(lowerFmt);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800 pb-2">
        <span className="flex items-center gap-1.5 font-bold text-cyan-300">
          <Eye className="w-4 h-4" /> Live Output Preview
        </span>
        <span className="truncate text-slate-400 max-w-[200px]">{filename}</span>
      </div>

      <div className="flex justify-center items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800 min-h-[140px]">
        {isImage && (
          <img
            src={url}
            alt={filename}
            className="max-h-[220px] max-w-full rounded object-contain shadow-lg"
          />
        )}

        {isAudio && (
          <audio controls src={url} className="w-full max-w-md" />
        )}

        {isVideo && (
          <video controls src={url} className="max-h-[220px] max-w-full rounded shadow-lg" />
        )}

        {!isImage && !isAudio && !isVideo && (
          <div className="flex flex-col items-center gap-2 text-slate-400 py-4">
            <FileText className="w-10 h-10 text-cyan-400/80" />
            <span className="text-xs font-mono text-slate-300">
              Binary / Document format (.{format.toUpperCase()}) ready for download.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

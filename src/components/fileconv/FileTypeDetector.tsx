import React from 'react';
import { FileCode, FileImage, FileText, Music, Video, Archive, HelpCircle } from 'lucide-react';

interface FileTypeDetectorProps {
  filename: string;
  mimeType?: string;
  sizeBytes?: number;
}

export const FileTypeDetector: React.FC<FileTypeDetectorProps> = ({ filename, mimeType, sizeBytes }) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const getCategoryIcon = () => {
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'avif', 'heic'].includes(ext) || mimeType?.startsWith('image/')) {
      return <FileImage className="w-5 h-5 text-cyan-400" />;
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext) || mimeType?.startsWith('audio/')) {
      return <Music className="w-5 h-5 text-emerald-400" />;
    }
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext) || mimeType?.startsWith('video/')) {
      return <Video className="w-5 h-5 text-purple-400" />;
    }
    if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) {
      return <Archive className="w-5 h-5 text-amber-400" />;
    }
    if (['json', 'xml', 'yaml', 'csv', 'html', 'md', 'js', 'ts'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-sky-400" />;
    }
    if (['pdf', 'docx', 'doc', 'txt', 'rtf'].includes(ext)) {
      return <FileText className="w-5 h-5 text-indigo-400" />;
    }
    return <HelpCircle className="w-5 h-5 text-slate-400" />;
  };

  const formattedSize = sizeBytes ? (sizeBytes / (1024 * 1024)).toFixed(2) + ' MB' : '';

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300">
      {getCategoryIcon()}
      <span className="font-mono font-semibold uppercase text-cyan-300">{ext || 'UNKNOWN'}</span>
      {mimeType && <span className="text-slate-500 font-mono">({mimeType})</span>}
      {formattedSize && <span className="ml-auto font-mono text-slate-400">{formattedSize}</span>}
    </div>
  );
};

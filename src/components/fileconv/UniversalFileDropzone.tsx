import React, { useRef, useState } from 'react';
import { Upload, FileUp, Sparkles } from 'lucide-react';
import { FileValidator } from '../../services/fileconv/fileValidator';

interface UniversalFileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedExtensions?: string[];
  maxRecommendedBytes?: number;
}

export const UniversalFileDropzone: React.FC<UniversalFileDropzoneProps> = ({
  onFilesSelected,
  acceptedExtensions = ['*'],
  maxRecommendedBytes = 100 * 1024 * 1024,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMessage(null);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = (files: File[]) => {
    const validFiles: File[] = [];
    for (const f of files) {
      const res = FileValidator.validateFile(f, maxRecommendedBytes);
      if (!res.valid) {
        setErrorMessage(res.error || 'Invalid file.');
        return;
      }
      validFiles.push(f);
    }
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'bg-cyan-500/20 border-cyan-400 shadow-2xl scale-[1.01]'
            : 'bg-slate-900/60 border-white/15 hover:border-cyan-500/50 hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
          accept={acceptedExtensions.includes('*') ? undefined : acceptedExtensions.map((e) => `.${e}`).join(',')}
        />
        <div className="max-w-sm mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
            <Upload className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Drag & drop files here, or click to browse</h3>
            <p className="text-xs text-slate-400">
              Processed locally in browser memory. Zero server uploads or cloud storage.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

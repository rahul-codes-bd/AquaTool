import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle2, Lock, X } from 'lucide-react';
import { PdfValidator } from '../../services/pdfValidator';
import { PdfValidationResult, PdfValidationOptions } from '../../types/pdf';

interface PdfDropzoneProps {
  onFileAccepted: (file: File, validation: PdfValidationResult) => void;
  onFileRejected?: (errorMessage: string) => void;
  validationOptions?: PdfValidationOptions;
  acceptLabel?: string;
  allowedExtensionsText?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  disabled?: boolean;
}

export const PdfDropzone: React.FC<PdfDropzoneProps> = ({
  onFileAccepted,
  onFileRejected,
  validationOptions,
  acceptLabel = 'Drop PDF document here or browse',
  allowedExtensionsText = 'Supports standard .pdf files',
  maxSizeMB = 50,
  multiple = false,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<PdfValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    setIsValidating(true);

    const file = files[0];
    const validation = await PdfValidator.validatePdf(file, {
      maxFileSizeMB: maxSizeMB,
      ...validationOptions,
    });

    setLastValidation(validation);
    setIsValidating(false);

    if (validation.isValid) {
      onFileAccepted(file, validation);
    } else if (onFileRejected && validation.errorMessage) {
      onFileRejected(validation.errorMessage);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(e.dataTransfer.files);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
    // Reset file input value so selecting the same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div
        id="pdf-dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer select-none group overflow-hidden ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-white/10 bg-slate-900/30'
            : isDragging
            ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.25)] scale-[1.01]'
            : 'border-white/15 bg-white/[0.03] hover:border-cyan-400/50 hover:bg-white/[0.06] shadow-xl'
        }`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload PDF document"
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          aria-hidden="true"
        />

        {/* Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />

        <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
            <UploadCloud className="w-8 h-8 text-cyan-400" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {acceptLabel}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Drag and drop files here, or <span className="text-cyan-400 font-semibold underline underline-offset-4">browse your device</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/10 flex items-center gap-1 text-slate-300">
              <FileText className="w-3 h-3 text-cyan-400" />
              <span>{allowedExtensionsText}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/10 text-slate-300">
              Max {maxSizeMB} MB
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 font-semibold">
              <Lock className="w-3 h-3" />
              <span>100% Client-Side</span>
            </span>
          </div>
        </div>
      </div>

      {/* Validation Feedback Message */}
      {lastValidation && !lastValidation.isValid && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <div className="font-semibold text-red-200">Validation Error ({lastValidation.errorCode})</div>
            <p className="text-slate-300 leading-relaxed text-[11px]">{lastValidation.errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLastValidation(null);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {lastValidation && lastValidation.isValid && lastValidation.warningMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <div className="font-semibold text-amber-200">Processing Note</div>
            <p className="text-slate-300 leading-relaxed text-[11px]">{lastValidation.warningMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

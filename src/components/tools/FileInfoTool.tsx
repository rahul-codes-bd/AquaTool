import React, { useState } from 'react';
import { FileDropzone } from '../common/FileDropzone';
import { FileInfoTools, FileInspectionResult } from '../../services/fileInfoTools';
import { CopyButton } from '../common/CopyButton';
import { FileSearch, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const FileInfoTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<FileInspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setIsInspecting(true);

    try {
      const res = await FileInfoTools.inspectFile(f);
      setInfo(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setInfo(null);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          maxSizeMB={150}
          onFilesSelected={handleFile}
          title="Upload any file to analyze magic bytes & structure"
          subtitle="Determines real binary MIME signature vs declared extension completely offline."
        />
      ) : (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-semibold text-slate-100">{file.name}</h4>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-rose-400"
              >
                Inspect another file
              </button>
            </div>

            {isInspecting && (
              <div className="py-6 text-center text-xs text-cyan-300 animate-pulse">
                Reading file headers and hex signatures...
              </div>
            )}

            {info && (
              <div className="space-y-5">
                {/* Magic signature validation indicator */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    info.isExtensionMatch
                      ? 'bg-teal-950/40 border-teal-500/30 text-teal-200'
                      : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {info.isExtensionMatch ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span>
                      {info.isExtensionMatch
                        ? 'Magic byte signature matches the declared file extension perfectly.'
                        : 'Warning: Magic byte signature does not match the file extension! (Possible masqueraded or corrupt file)'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-900/60">
                    {info.signatureMime}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Exact Size</span>
                    <p className="font-semibold text-slate-200">{info.formattedSize}</p>
                    <p className="font-mono text-[10px] text-cyan-400">{info.size} bytes</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Browser MIME</span>
                    <p className="font-semibold text-slate-200 truncate">{info.mimeType}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Last Modified</span>
                    <p className="font-semibold text-slate-200">{info.lastModified}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 sm:col-span-2 md:col-span-3">
                    <span className="text-[10px] text-slate-400 uppercase">
                      Magic Header Bytes (Hex Signature)
                    </span>
                    <div className="flex items-center justify-between pt-1">
                      <p className="font-mono text-cyan-300 font-bold text-xs">
                        {info.headerHex}
                      </p>
                      <CopyButton textToCopy={info.headerHex} label="Copy Hex" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

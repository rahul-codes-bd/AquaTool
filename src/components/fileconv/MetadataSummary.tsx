import React from 'react';
import { Info, Shield, Check, Lock } from 'lucide-react';

interface MetadataSummaryProps {
  filename: string;
  sizeBytes: number;
  format: string;
  metadataPreserved?: boolean;
}

export const MetadataSummary: React.FC<MetadataSummaryProps> = ({
  filename,
  sizeBytes,
  format,
  metadataPreserved = true,
}) => {
  const formattedSize = (sizeBytes / (1024 * 1024)).toFixed(2) + ' MB';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs flex flex-col gap-2 font-mono">
      <div className="flex items-center gap-2 text-cyan-300 font-semibold border-b border-slate-800/80 pb-1.5">
        <Info className="w-4 h-4 text-cyan-400" />
        <span>Metadata & Technical Inspect</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-slate-300">
        <div>
          <span className="text-slate-500 block text-[10px]">FILE NAME</span>
          <span className="truncate block font-medium">{filename}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">FILE SIZE</span>
          <span className="font-medium">{formattedSize}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">FORMAT</span>
          <span className="uppercase text-cyan-400 font-bold">{format}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">METADATA STATUS</span>
          <span className="flex items-center gap-1 font-medium text-emerald-400">
            <Shield className="w-3 h-3" />
            {metadataPreserved ? 'Preserved' : 'Sanitized'}
          </span>
        </div>
      </div>
    </div>
  );
};

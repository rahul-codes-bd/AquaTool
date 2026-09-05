import React from 'react';
import { FileCheck, Sparkles, AlertTriangle } from 'lucide-react';

interface OutputFormatCardProps {
  format: string;
  mimeType: string;
  description: string;
  isSelected?: boolean;
  onSelect?: () => void;
  warnings?: string[];
}

export const OutputFormatCard: React.FC<OutputFormatCardProps> = ({
  format,
  mimeType,
  description,
  isSelected = false,
  onSelect,
  warnings,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.25)]'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-sm font-bold uppercase text-cyan-300">.{format}</span>
        {isSelected ? (
          <FileCheck className="w-4 h-4 text-cyan-400" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-slate-500" />
        )}
      </div>
      <p className="text-xs text-slate-300 mb-1">{description}</p>
      <span className="text-[10px] font-mono text-slate-500 block">{mimeType}</span>

      {warnings && warnings.length > 0 && (
        <div className="mt-2 text-[10px] text-amber-300 flex items-center gap-1 font-mono">
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
          <span>{warnings[0]}</span>
        </div>
      )}
    </div>
  );
};

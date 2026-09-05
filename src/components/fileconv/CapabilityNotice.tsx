import React from 'react';
import { Info, AlertCircle } from 'lucide-react';
import { ProcessingMode, ToolStatus } from '../../types/fileConv';

interface CapabilityNoticeProps {
  mode: ProcessingMode;
  status: ToolStatus;
  privacyNote: string;
  knownLimitations: string[];
}

export const CapabilityNotice: React.FC<CapabilityNoticeProps> = ({ mode, status, privacyNote, knownLimitations }) => {
  return (
    <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold text-white">Processing Capability & Privacy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
            status === 'ready' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
            status === 'beta' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {status}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono uppercase">
            {mode}
          </span>
        </div>
      </div>

      <p className="text-slate-300">{privacyNote}</p>

      {knownLimitations.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-white/10">
          <span className="font-semibold text-amber-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Known Limitations & Fidelity Notes:
          </span>
          <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
            {knownLimitations.map((lim, idx) => (
              <li key={idx}>{lim}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

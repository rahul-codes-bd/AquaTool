import React from 'react';
import { ShieldCheck, HardDrive, Cpu, AlertTriangle, Layers, Lock, Clock } from 'lucide-react';
import { PdfToolDefinition } from '../../types/pdf';
import { PdfCapabilityBadge } from './PdfCapabilityBadge';

interface PdfCapabilityNoticeProps {
  tool: PdfToolDefinition;
  compact?: boolean;
}

export const PdfCapabilityNotice: React.FC<PdfCapabilityNoticeProps> = ({ tool, compact = false }) => {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-white/10 rounded-2xl text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <PdfCapabilityBadge level={tool.browserSupportLevel} size="sm" />
          <span className="text-slate-400">|</span>
          <span className="font-mono text-cyan-300">Max: {tool.maxRecommendedFileSizeMB} MB</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
          <Lock className="w-3.5 h-3.5" />
          <span>Zero Server Ingestion</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Execution Architecture & Capability</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Transparent technical disclosure regarding browser-side execution and memory boundaries.
          </p>
        </div>
        <PdfCapabilityBadge level={tool.browserSupportLevel} size="md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Privacy & Engine */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="font-semibold text-slate-200">Zero Server Upload</div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {tool.privacyNote || 'Processed entirely within your local browser memory space. No packets leave your device.'}
          </p>
        </div>

        {/* Engine Capability */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="font-semibold text-slate-200">Engine Core</div>
          <p className="text-slate-400 leading-relaxed text-[11px] font-mono">
            {tool.requiredCapability || 'Pure JavaScript & Canvas2D'}
          </p>
        </div>

        {/* Recommended Limit */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="font-semibold text-slate-200">Recommended Limit</div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Up to <span className="font-mono text-sky-300 font-bold">{tool.maxRecommendedFileSizeMB} MB</span> per document for optimal responsiveness.
          </p>
        </div>

        {/* Formats Supported */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div className="font-semibold text-slate-200">I/O Pipeline</div>
          <p className="text-slate-400 leading-relaxed text-[11px] truncate" title={tool.supportedInputTypes.join(', ')}>
            In: <span className="text-slate-300 font-mono">{tool.supportedInputTypes.join(', ')}</span>
            <br />
            Out: <span className="text-slate-300 font-mono">{tool.supportedOutputTypes.join(', ')}</span>
          </p>
        </div>
      </div>

      {tool.knownLimitations && tool.knownLimitations.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs space-y-1.5">
          <div className="font-semibold flex items-center gap-1.5 text-amber-200">
            <AlertTriangle className="w-4 h-4" />
            <span>Known Technical Limitations (Client-Side)</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
            {tool.knownLimitations.map((lim, idx) => (
              <li key={idx}>{lim}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

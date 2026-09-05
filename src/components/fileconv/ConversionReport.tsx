import React from 'react';
import { FileText, CheckCircle2, Clock, HardDrive, ShieldAlert, ArrowRight } from 'lucide-react';
import { ConversionReportData } from '../../types/fileConv';

interface ConversionReportProps {
  report: ConversionReportData;
}

export const ConversionReport: React.FC<ConversionReportProps> = ({ report }) => {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white text-xs">Conversion Report & Metrics</span>
        </div>
        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
          SUCCESS
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 block">Format Flow</span>
          <div className="flex items-center gap-1.5 font-mono text-xs text-white">
            <span className="uppercase">{report.sourceFormat}</span>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
            <span className="uppercase text-cyan-300">{report.outputFormat}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 block">Size Reduction</span>
          <span className="font-mono text-xs text-emerald-400 font-bold">
            {report.reductionPercentage > 0 ? `-${report.reductionPercentage}%` : '0%'}
          </span>
          <span className="text-[9px] text-slate-400 block">
            {(report.sourceSizeBytes / 1024).toFixed(1)} KB → {(report.outputSizeBytes / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 block">Processing Time</span>
          <div className="flex items-center gap-1 font-mono text-xs text-cyan-300">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{report.durationMs} ms</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 block">Execution Mode</span>
          <span className="font-mono text-xs text-blue-300 uppercase">{report.processingMode}</span>
        </div>
      </div>

      {report.warnings.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-white/10">
          <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Conversion Notes & Warnings:
          </span>
          <ul className="list-disc pl-4 text-[11px] text-slate-300 space-y-0.5">
            {report.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

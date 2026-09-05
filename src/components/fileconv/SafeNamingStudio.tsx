import React, { useState } from 'react';
import { Tag, Sparkles, Check, FileText } from 'lucide-react';
import { FileValidator } from '../../services/fileconv/fileValidator';

interface SafeNamingStudioProps {
  sampleFilename: string;
  targetFormat: string;
  pattern: string;
  onChangePattern: (pattern: string) => void;
}

export const SafeNamingStudio: React.FC<SafeNamingStudioProps> = ({
  sampleFilename,
  targetFormat,
  pattern,
  onChangePattern,
}) => {
  const baseOriginal = sampleFilename.substring(0, sampleFilename.lastIndexOf('.')) || sampleFilename;
  const todayDate = new Date().toISOString().split('T')[0];

  const formatSample = (pat: string) => {
    let raw = pat
      .replace('{original}', baseOriginal)
      .replace('{format}', targetFormat.toLowerCase())
      .replace('{date}', todayDate)
      .replace('{index}', '001');

    return FileValidator.escapeFilename(raw) + '.' + targetFormat.toLowerCase();
  };

  const previewName = formatSample(pattern);

  const presets = [
    { label: '{original}_converted', val: '{original}_converted' },
    { label: '{original}-{date}', val: '{original}-{date}' },
    { label: 'aqua_{index}_{original}', val: 'aqua_{index}_{original}' },
  ];

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
          <Tag className="w-4 h-4 text-cyan-400" />
          <span>Safe Output Naming Studio</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400">Filesystem Safe</span>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={pattern}
            onChange={(e) => onChangePattern(e.target.value)}
            placeholder="{original}_{format}"
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="text-slate-500 self-center">Quick Patterns:</span>
          {presets.map((pr) => (
            <button
              key={pr.val}
              onClick={() => onChangePattern(pr.val)}
              className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 font-mono transition cursor-pointer"
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs">
        <span className="text-slate-400">Live Output Preview:</span>
        <span className="font-mono font-bold text-cyan-300">{previewName}</span>
      </div>
    </div>
  );
};

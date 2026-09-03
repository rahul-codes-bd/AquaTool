import React from 'react';
import { UseCasePreset } from '../../types/fileConv';
import { Globe, Smartphone, Printer, Mail, Archive, Share2 } from 'lucide-react';

interface ConversionPresetSelectorProps {
  selectedPreset: UseCasePreset;
  onSelectPreset: (preset: UseCasePreset) => void;
  disabled?: boolean;
}

export const ConversionPresetSelector: React.FC<ConversionPresetSelectorProps> = ({
  selectedPreset,
  onSelectPreset,
  disabled = false,
}) => {
  const presets: { id: UseCasePreset; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'web', label: 'Web Optimized', icon: <Globe className="w-3.5 h-3.5" />, desc: 'Balanced quality & fast load times' },
    { id: 'mobile', label: 'Mobile Device', icon: <Smartphone className="w-3.5 h-3.5" />, desc: 'Compact footprint & mobile display' },
    { id: 'print', label: 'High-Res Print', icon: <Printer className="w-3.5 h-3.5" />, desc: 'Lossless / 300 DPI preservation' },
    { id: 'email', label: 'Email Attachment', icon: <Mail className="w-3.5 h-3.5" />, desc: 'Strict size limits & universal compatibility' },
    { id: 'archive', label: 'Long-term Archive', icon: <Archive className="w-3.5 h-3.5" />, desc: 'Maximum fidelity & metadata retention' },
    { id: 'social', label: 'Social Media', icon: <Share2 className="w-3.5 h-3.5" />, desc: 'Standard ratios & crisp preview' },
  ];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
        Use-Case Optimization Presets
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {presets.map((p) => {
          const active = selectedPreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPreset(p.id)}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                active
                  ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-1.5 font-medium text-xs text-slate-100">
                <span className={active ? 'text-cyan-400' : 'text-slate-400'}>{p.icon}</span>
                <span>{p.label}</span>
              </div>
              <span className="text-[10px] text-slate-400 line-clamp-1">{p.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

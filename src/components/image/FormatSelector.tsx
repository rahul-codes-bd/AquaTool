import React from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { IMAGE_CONFIG } from '../../config/imageConfig';

interface FormatSelectorProps {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  allowedFormats?: string[];
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onFormatChange,
  allowedFormats,
}) => {
  const formats = IMAGE_CONFIG.EXPORT_FORMATS.filter(
    (f) => !allowedFormats || allowedFormats.includes(f.id)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>Target Export Format</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {formats.map((fmt) => {
          const isSelected = selectedFormat === fmt.id;
          return (
            <button
              key={fmt.id}
              type="button"
              onClick={() => onFormatChange(fmt.id)}
              className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-1 relative ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/8 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{fmt.extension.toUpperCase()}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {fmt.lossless ? 'Lossless / Alpha' : 'Compressed Web'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

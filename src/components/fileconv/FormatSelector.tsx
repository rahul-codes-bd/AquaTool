import React from 'react';

interface FormatSelectorProps {
  availableFormats: string[];
  selectedFormat: string;
  onChange: (format: string) => void;
  disabled?: boolean;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  availableFormats,
  selectedFormat,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
        Target Output Format
      </label>
      <div className="flex flex-wrap gap-2">
        {availableFormats.map((fmt) => {
          const active = selectedFormat.toLowerCase() === fmt.toLowerCase();
          return (
            <button
              key={fmt}
              type="button"
              disabled={disabled}
              onClick={() => onChange(fmt)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                active
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105'
                  : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-cyan-500/50 hover:text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              .{fmt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

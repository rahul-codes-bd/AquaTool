import React from 'react';
import { Edit3, ShieldCheck } from 'lucide-react';

interface SafeFilenameEditorProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export const SafeFilenameEditor: React.FC<SafeFilenameEditorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const sanitize = (raw: string) => {
    // Escapes special chars & prevents directory traversal
    return raw.replace(/[/\\?%*:|"<>]/g, '_').trim();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(sanitize(e.target.value));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Output Filename Pattern
        </span>
        <span className="text-[10px] text-emerald-400 font-normal flex items-center gap-0.5">
          <ShieldCheck className="w-3 h-3" /> Path-Safe
        </span>
      </label>
      <input
        type="text"
        disabled={disabled}
        value={value}
        onChange={handleInputChange}
        placeholder="converted_output"
        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 disabled:opacity-50"
      />
    </div>
  );
};

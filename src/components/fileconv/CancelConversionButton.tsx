import React from 'react';
import { XCircle } from 'lucide-react';

interface CancelConversionButtonProps {
  onCancel: () => void;
  disabled?: boolean;
}

export const CancelConversionButton: React.FC<CancelConversionButtonProps> = ({ onCancel, disabled = false }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onCancel}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-40"
      title="Cancel current task"
    >
      <XCircle className="w-3.5 h-3.5" />
      <span>Cancel</span>
    </button>
  );
};

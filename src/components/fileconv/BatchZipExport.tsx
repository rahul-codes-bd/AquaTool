import React from 'react';
import { Package, Download } from 'lucide-react';

interface BatchZipExportProps {
  onExport: () => void;
  itemCount: number;
  disabled?: boolean;
}

export const BatchZipExport: React.FC<BatchZipExportProps> = ({
  onExport,
  itemCount,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      disabled={disabled || itemCount === 0}
      onClick={onExport}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-[0_0_14px_rgba(16,185,129,0.3)] hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
    >
      <Package className="w-4 h-4" />
      <span>Download All as ZIP ({itemCount})</span>
      <Download className="w-3.5 h-3.5 ml-1" />
    </button>
  );
};

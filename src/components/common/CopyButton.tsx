import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { t } from '../../i18n';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  label?: string;
  onCopied?: () => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  className = '',
  label,
  onCopied,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      if (onCopied) onCopied();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      type="button"
      id="copy-action-btn"
      onClick={handleCopy}
      disabled={!textToCopy}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
        copied
          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
          : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 hover:border-cyan-500/40'
      } ${className}`}
      aria-label={label || t('common.copy')}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-teal-400" />
          <span>{t('common.copied')}</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-slate-400" />
          <span>{label || t('common.copy')}</span>
        </>
      )}
    </button>
  );
};

import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

export const PrivacyBadge: React.FC<{ processingMode?: string }> = ({ processingMode = 'browser' }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span>100% Local Privacy-First ({processingMode.toUpperCase()})</span>
    </div>
  );
};

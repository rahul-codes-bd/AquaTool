import React, { useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { t } from '../../i18n';

interface PrivacyBadgeProps {
  customText?: string;
  className?: string;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({ customText, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        id="privacy-badge-trigger"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/20 transition-all backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        aria-label="Privacy information: Local browser processing"
      >
        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span>{customText || t('common.privacyBadge')}</span>
        <Info className="w-3 h-3 text-cyan-400/70 ml-0.5" />
      </button>

      {showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#020617]/95 text-slate-200 text-xs rounded-xl shadow-2xl border border-white/15 z-50 backdrop-blur-2xl pointer-events-none transition-opacity duration-150 animate-in fade-in"
        >
          <div className="font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Zero Upload Guarantee
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {t('common.privacyBadgeTooltip')}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#020617]/95" />
        </div>
      )}
    </div>
  );
};


import React from 'react';
import { ShieldAlert, ShieldCheck, MapPin, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { PrivacyRiskItem } from '../../types/image';

interface PrivacyRiskPanelProps {
  risks: PrivacyRiskItem[];
  onAutoFix?: () => void;
}

export const PrivacyRiskPanel: React.FC<PrivacyRiskPanelProps> = ({ risks, onAutoFix }) => {
  if (risks.length === 0) {
    return (
      <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-300">No Privacy Risks Detected</p>
          <p className="text-[11px] text-emerald-400/80 mt-0.5">
            This image contains no GPS coordinates, camera serial numbers, or owner identifiers.
          </p>
        </div>
      </div>
    );
  }

  const hasCritical = risks.some((r) => r.level === 'critical');

  return (
    <div
      className={`p-5 rounded-3xl border backdrop-blur-xl space-y-4 shadow-xl ${
        hasCritical
          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          {hasCritical ? (
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )}
          <span className="font-bold text-sm text-white">
            Privacy Audit: {risks.length} Risk{risks.length > 1 ? 's' : ''} Found
          </span>
        </div>

        {onAutoFix && (
          <button
            type="button"
            onClick={onAutoFix}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            <span>Fix All with 1-Click</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {risks.map((risk, idx) => (
          <div
            key={idx}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  risk.level === 'critical'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                }`}
              >
                {risk.level}
              </span>
              <span className="font-semibold text-white">{risk.title}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{risk.description}</p>
            {risk.remedy && (
              <p className="text-[11px] text-cyan-300 pt-0.5">
                <span className="font-medium">Recommended action:</span> {risk.remedy}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

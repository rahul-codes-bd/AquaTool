import React from 'react';
import { useFeatureFlags } from '../../services/featureFlags';
import { Shield, Sparkles, Info, EyeOff } from 'lucide-react';
import { t } from '../../i18n';

export type AdSlotFormat =
  | 'horizontal-banner'
  | 'large-banner'
  | 'rectangle'
  | 'in-feed'
  | 'sidebar-rail';

interface AdSlotPlaceholderProps {
  slotId: string;
  format?: AdSlotFormat;
  className?: string;
  /** Optional position label for developer inspection */
  positionLabel?: string;
}

export const AdSlotPlaceholder: React.FC<AdSlotPlaceholderProps> = ({
  slotId,
  format = 'horizontal-banner',
  className = '',
  positionLabel,
}) => {
  const flags = useFeatureFlags();

  // STRICT RULE: If ads are disabled and preview mode is off, return null immediately.
  // This guarantees 100% zero DOM footprint, zero layout shift, and zero external scripts.
  if (!flags.enableAds && !flags.adPreviewMode) {
    return null;
  }

  // Dimension presets conforming to IAB standard advertising dimensions
  const getFormatStyles = () => {
    switch (format) {
      case 'large-banner':
        // Billboard (970x250 / 970x90 responsive)
        return {
          containerClass: 'w-full max-w-[970px] min-h-[90px] sm:min-h-[120px] md:min-h-[250px]',
          label: 'Billboard (970×250 / 970×90)',
        };
      case 'rectangle':
        // Medium Rectangle (300x250 / 336x280)
        return {
          containerClass: 'w-full max-w-[336px] min-h-[250px] sm:min-h-[280px]',
          label: 'Medium Rectangle (300×250)',
        };
      case 'sidebar-rail':
        // Half Page / Skyscraper (300x600 / 160x600)
        return {
          containerClass: 'w-full max-w-[300px] min-h-[400px] md:min-h-[600px]',
          label: 'Sidebar Rail (300×600)',
        };
      case 'in-feed':
        // In-feed responsive card
        return {
          containerClass: 'w-full max-w-4xl min-h-[90px] sm:min-h-[100px]',
          label: 'In-Feed Native Banner (Responsive)',
        };
      case 'horizontal-banner':
      default:
        // Leaderboard (728x90 desktop / 468x60 tablet / 320x50 mobile)
        return {
          containerClass: 'w-full max-w-[728px] min-h-[50px] sm:min-h-[60px] md:min-h-[90px]',
          label: 'Leaderboard (728×90 / 320×50)',
        };
    }
  };

  const { containerClass, label } = getFormatStyles();

  return (
    <aside
      id={`ad-slot-${slotId}`}
      role="complementary"
      aria-label="Advertisement area placeholder"
      className={`mx-auto my-6 p-4 rounded-2xl border border-dashed border-cyan-500/30 bg-slate-950/40 backdrop-blur-md flex flex-col items-center justify-center text-center select-none transition-all ${containerClass} ${className}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase bg-cyan-950/90 text-cyan-400 border border-cyan-500/40">
          SPONSORED PLACEMENT &bull; RESERVED GEOMETRY
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
          <EyeOff className="w-3 h-3 text-emerald-400" />
          <span>Zero External Scripts</span>
        </span>
      </div>

      <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
        <span>{positionLabel || slotId}</span>
        <span className="text-slate-400 font-mono text-[11px]">({label})</span>
      </div>

      <p className="text-[11px] text-slate-400 max-w-md mt-1 leading-relaxed">
        Stable layout reservation placeholder. No third-party network requests, trackers, or cookies are loaded.
      </p>
    </aside>
  );
};

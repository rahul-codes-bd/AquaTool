import React from 'react';
import { ShieldCheck, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { PdfSupportLevel } from '../../types/pdf';

interface PdfCapabilityBadgeProps {
  level: PdfSupportLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const PdfCapabilityBadge: React.FC<PdfCapabilityBadgeProps> = ({
  level,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const getBadgeConfig = () => {
    switch (level) {
      case 'ready':
        return {
          label: '100% In-Browser',
          subLabel: 'Client-Side Ready',
          bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
          icon: ShieldCheck,
        };
      case 'beta':
        return {
          label: 'Client-Side Beta',
          subLabel: 'High Fidelity',
          bgColor: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
          dotColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
          icon: Sparkles,
        };
      case 'coming-soon':
      default:
        return {
          label: 'Coming Soon',
          subLabel: 'WASM / Roadmap',
          bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          dotColor: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
          icon: Clock,
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 11,
    md: 13,
    lg: 16,
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border backdrop-blur-md transition-all select-none ${config.bgColor} ${sizeClasses} ${className}`}
      title={config.subLabel}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`} />
      {showIcon && <Icon size={iconSizes} className="shrink-0" />}
      <span className="whitespace-nowrap font-mono tracking-tight">{config.label}</span>
    </span>
  );
};

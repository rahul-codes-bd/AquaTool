import React from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/30 px-4 py-2.5 text-xs font-medium text-cyan-200 shadow-xl backdrop-blur-md">
      <WifiOff className="w-4 h-4 text-cyan-400 animate-pulse" />
      <div className="flex flex-col">
        <span className="font-semibold text-white">Offline Mode Active</span>
        <span className="text-[10px] text-cyan-300/80 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-cyan-400" /> 100% Client-side local engines operational
        </span>
      </div>
    </div>
  );
};

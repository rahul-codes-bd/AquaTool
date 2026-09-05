import React from 'react';

export const AdSlotPlaceholder: React.FC = () => {
  const ENABLE_ADS = false;

  if (!ENABLE_ADS) {
    return null;
  }

  return (
    <div className="w-full my-4 p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center text-xs text-slate-500 font-mono">
      Ad Space (Disabled - Privacy First)
    </div>
  );
};

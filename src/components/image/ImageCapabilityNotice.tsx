import React from 'react';
import { ShieldCheck, Cpu, Zap, Lock, Globe2 } from 'lucide-react';

export const ImageCapabilityNotice: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-white/5 to-cyan-500/5 border border-white/10 p-5 backdrop-blur-xl shadow-xl space-y-3">
      <div className="flex items-center gap-2 text-white font-semibold text-xs">
        <ShieldCheck className="w-4 h-4 text-cyan-400" />
        <span>AquaTools Water-Glass Privacy Guarantee</span>
      </div>

      <div className={`grid ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'} gap-3 text-xs`}>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px]">
            <Lock className="w-3.5 h-3.5" />
            <span>0% Cloud Upload</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All conversions, resizing, EXIF scrubbing, and filters execute directly in your browser's RAM and GPU.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-teal-300 font-semibold text-[11px]">
            <Cpu className="w-3.5 h-3.5" />
            <span>WebAssembly & Workers</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Offloaded to background Web Workers and SIMD WebAssembly to prevent UI stuttering.
          </p>
        </div>

        {!compact && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-[11px]">
              <Globe2 className="w-3.5 h-3.5" />
              <span>Offline Ready</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Works completely offline without active internet once loaded. Zero tracking cookies or ads.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { Suspense } from 'react';
import { Loader2, Droplet } from 'lucide-react';

interface PdfLazyBoundaryProps {
  children: React.ReactNode;
  fallbackText?: string;
}

export const PdfLazyLoadingFallback: React.FC<{ text?: string }> = ({ text = 'Loading PDF Engine Module...' }) => (
  <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-12 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-4 my-6 min-h-[320px]">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 animate-pulse">
        <Droplet className="w-8 h-8 fill-cyan-400/20" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin opacity-80" />
      </div>
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-white tracking-tight">{text}</h3>
      <p className="text-xs text-slate-400 font-mono">Initializing client-side sandbox</p>
    </div>
  </div>
);

export const PdfLazyBoundary: React.FC<PdfLazyBoundaryProps> = ({ children, fallbackText }) => {
  return <Suspense fallback={<PdfLazyLoadingFallback text={fallbackText} />}>{children}</Suspense>;
};

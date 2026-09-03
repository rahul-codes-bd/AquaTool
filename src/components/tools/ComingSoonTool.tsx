import React from 'react';
import { Clock, Shield, Sparkles, Lock, ArrowLeft, Layers, Compass } from 'lucide-react';

interface ComingSoonToolProps {
  title?: string;
  category?: string;
  description?: string;
  onNavigateHub?: () => void;
}

export function ComingSoonTool({
  title = 'Advanced PDF Tool',
  category = 'Client-Side WASM Roadmap',
  description = 'This advanced document utility is currently in active WebAssembly development to guarantee 100% private in-browser execution with zero remote server uploads.',
  onNavigateHub,
}: ComingSoonToolProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Active WebAssembly Development Pipeline</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">{title}</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Zero Server Uploads</span>
        </div>
      </div>

      {/* Rationale Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Why is this tool in our coming-soon pipeline?</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unlike commercial utilities that quietly transmit your private files to remote cloud servers, AquaTools strictly enforces client-side processing. Heavy operations like proprietary Office format conversion and deep layout OCR require isolated WebAssembly runtime sandboxes.
          </p>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs sm:text-sm">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>The Zero-Telemetry Privacy Commitment</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your files remain in your browser's local RAM. No cookies, no remote logging, and zero document transmission. All ready tools in AquaTools work entirely offline.
          </p>
        </div>
      </div>
    </div>
  );
}

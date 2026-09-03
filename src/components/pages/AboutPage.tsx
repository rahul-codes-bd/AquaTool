import React from 'react';
import {
  Droplet,
  Heart,
  Cpu,
  Sparkles,
  Shield,
  Layers,
  Globe,
  CheckCircle,
  FileCode,
  Zap,
  Terminal,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { ALL_TOOLS } from '../../registry/toolsRegistry';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Hero */}
      <div className="glass-panel rounded-3xl p-8 space-y-4 border-cyan-500/20 text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_30px_rgba(6,182,212,0.3)]">
          <Droplet className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          About {APP_CONFIG.name}
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
          {APP_CONFIG.tagline}. High-speed, private document, image, and developer utilities engineered for total client-side execution.
        </p>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="glass-panel rounded-2xl p-5 space-y-1.5 border-slate-800">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400">{ALL_TOOLS.length}+</span>
          <p className="text-xs text-slate-400">Offline Tools</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 space-y-1.5 border-slate-800">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">0 KB</span>
          <p className="text-xs text-slate-400">Cloud Data Uploads</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 space-y-4 border-slate-800">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-sky-400">100%</span>
          <p className="text-xs text-slate-400">Client Memory Execution</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 space-y-1.5 border-slate-800">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-teal-400">0</span>
          <p className="text-xs text-slate-400">Tracking Scripts</p>
        </div>
      </div>

      {/* Mission & Philosophy */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>The Philosophy Behind AquaTools</span>
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Modern web browsers have evolved into extraordinary operating platforms equipped with GPU-accelerated 2D/3D Canvases, native cryptographic hardware modules, multithreaded Web Workers, and WebAssembly compilation runtimes.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          Despite these advances, conventional online file tools continue to operate on an archaic, privacy-invasive model: forcing users to upload sensitive contracts, personal photos, and proprietary code to remote servers simply to resize an image, convert a CSV, or merge two PDF files.
        </p>
        <p className="text-xs text-cyan-300 font-medium leading-relaxed">
          AquaTools demonstrates that with careful engineering, high-performance developer and document utilities can run entirely within local browser memory with zero server dependencies.
        </p>
      </div>

      {/* Browser Compatibility Matrix */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Browser Compatibility Matrix</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: 'Google Chrome', version: 'v80+', status: 'Fully Supported', color: 'text-emerald-400' },
            { name: 'Apple Safari', version: 'v14.1+', status: 'Fully Supported', color: 'text-emerald-400' },
            { name: 'Mozilla Firefox', version: 'v78+', status: 'Fully Supported', color: 'text-emerald-400' },
            { name: 'Microsoft Edge', version: 'v80+', status: 'Fully Supported', color: 'text-emerald-400' },
            { name: 'iOS Safari', version: 'iOS 14.5+', status: 'Fully Supported', color: 'text-emerald-400' },
            { name: 'Android Chrome', version: 'v80+', status: 'Fully Supported', color: 'text-emerald-400' },
          ].map((b) => (
            <div key={b.name} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-200">{b.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">{b.version}</div>
              <div className={`text-[11px] font-semibold flex items-center gap-1 ${b.color}`}>
                <CheckCircle className="w-3 h-3" />
                <span>{b.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology & Open Source Credits */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span>Under the Hood & Open Standards</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">PDF-Lib & PDF.js</span>
            <p className="text-slate-400">Pure JavaScript PDF document manipulation and page extraction.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">Web Crypto API</span>
            <p className="text-slate-400">Native CSPRNG entropy pool and SubtleCrypto cryptographic digests.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">HTML5 Canvas & OffscreenCanvas</span>
            <p className="text-slate-400">Client-side pixel rasterization, lossless image conversions, and cropping.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">JSZip & PapaParse</span>
            <p className="text-slate-400">In-memory ZIP archive generation and high-speed CSV streaming.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

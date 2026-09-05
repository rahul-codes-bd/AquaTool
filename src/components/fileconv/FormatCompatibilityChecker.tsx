import React, { useState } from 'react';
import { Globe, Check, AlertCircle, HelpCircle } from 'lucide-react';

export const FormatCompatibilityChecker: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'image' | 'audio' | 'video' | 'doc'>('image');

  const compatibilityMatrix = {
    image: [
      { format: 'WebP', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Modern default, 30% smaller than JPG' },
      { format: 'AVIF', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Next-gen lossy/lossless compression' },
      { format: 'PNG', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Lossless transparency' },
      { format: 'JPEG', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Universal photograph standard' },
      { format: 'SVG', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Scalable vector graphics' },
      { format: 'ICO', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Favicon multi-resolution bitmap' },
    ],
    audio: [
      { format: 'WAV', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Uncompressed 16-bit PCM audio' },
      { format: 'MP3', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Universal audio compression' },
      { format: 'OGG / Vorbis', chrome: true, safari: false, firefox: true, edge: true, ios: false, note: 'Open container codec' },
      { format: 'AAC / M4A', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'High efficiency audio' },
      { format: 'FLAC', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Lossless audio compression' },
    ],
    video: [
      { format: 'MP4 (H.264)', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Universal HTML5 video standard' },
      { format: 'WebM (VP9)', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Web-optimized royalty-free container' },
      { format: 'Animated GIF', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Universal animated image fallback' },
      { format: 'MKV', chrome: false, safari: false, firefox: false, edge: false, ios: false, note: 'Requires local container demuxer' },
    ],
    doc: [
      { format: 'PDF', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Native vector reader in modern browsers' },
      { format: 'CSV / JSON', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Structured client data parsing' },
      { format: 'HTML', chrome: true, safari: true, firefox: true, edge: true, ios: true, note: 'Standard document reflow DOM' },
    ],
  };

  const rows = compatibilityMatrix[selectedCategory];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Cross-Browser Format Compatibility Lookup</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Client Compatibility Index</span>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {(['image', 'audio', 'video', 'doc'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 font-mono text-[10px] uppercase">
              <th className="py-2 px-3">Format</th>
              <th className="py-2 px-2 text-center">Chrome</th>
              <th className="py-2 px-2 text-center">Safari</th>
              <th className="py-2 px-2 text-center">Firefox</th>
              <th className="py-2 px-2 text-center">Edge</th>
              <th className="py-2 px-2 text-center">iOS Safari</th>
              <th className="py-2 px-3">Browser Capabilities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="py-2.5 px-3 font-bold text-white">{r.format}</td>
                <td className="py-2.5 px-2 text-center">{r.chrome ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <AlertCircle className="w-4 h-4 text-rose-400 mx-auto" />}</td>
                <td className="py-2.5 px-2 text-center">{r.safari ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <AlertCircle className="w-4 h-4 text-rose-400 mx-auto" />}</td>
                <td className="py-2.5 px-2 text-center">{r.firefox ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <AlertCircle className="w-4 h-4 text-rose-400 mx-auto" />}</td>
                <td className="py-2.5 px-2 text-center">{r.edge ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <AlertCircle className="w-4 h-4 text-rose-400 mx-auto" />}</td>
                <td className="py-2.5 px-2 text-center">{r.ios ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <AlertCircle className="w-4 h-4 text-rose-400 mx-auto" />}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-400">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

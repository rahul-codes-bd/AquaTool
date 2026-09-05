import React, { useState } from 'react';
import { Sliders, Download, Check } from 'lucide-react';
import { ImageEngine } from '../../services/imageEngine';

interface SmartExportPresetsProps {
  currentFile?: File | null;
  currentBlob?: Blob | null;
}

export const SmartExportPresets: React.FC<SmartExportPresetsProps> = ({ currentFile, currentBlob }) => {
  const [selectedPreset, setSelectedPreset] = useState<'web' | 'print' | 'mobile' | 'archive' | 'email'>('web');
  const [isExporting, setIsExporting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const presets = [
    { id: 'web', name: 'Web Performance (WebP)', format: 'image/webp', quality: 0.8, desc: 'Optimized for fast web load speed & SEO.' },
    { id: 'print', name: 'High-Res Print (JPEG)', format: 'image/jpeg', quality: 0.95, desc: 'Maximum fidelity for physical printing.' },
    { id: 'mobile', name: 'Mobile / Retina (AVIF)', format: 'image/avif', quality: 0.75, desc: 'Ultra-compressed next-gen format.' },
    { id: 'archive', name: 'Lossless Archive (PNG)', format: 'image/png', quality: 1.0, desc: 'Bit-exact lossless preservation.' },
    { id: 'email', name: 'Email Attachment (JPEG 60%)', format: 'image/jpeg', quality: 0.6, desc: 'Compact file size for quick messaging.' },
  ];

  const handleExport = async () => {
    if (!currentFile && !currentBlob) return;
    setIsExporting(true);
    try {
      const preset = presets.find((p) => p.id === selectedPreset)!;
      const src = currentFile || currentBlob!;
      const img = new Image();
      const objectUrl = ImageEngine.createTrackedUrl(src);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load source image'));
        img.src = objectUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }

      const res = await ImageEngine.exportCanvas(canvas, { format: preset.format, quality: preset.quality });
      setResultUrl(res.url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <Sliders className="w-4 h-4 text-cyan-400" />
        <span>Smart Export Presets</span>
      </div>
      <p className="text-xs text-slate-400">Select an optimized export profile tailored for your specific distribution channel.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPreset(p.id as any)}
            className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
              selectedPreset === p.id
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="font-semibold text-xs text-white">{p.name}</div>
            <p className="text-[11px] text-slate-400">{p.desc}</p>
          </button>
        ))}
      </div>

      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          disabled={!currentFile && !currentBlob || isExporting}
          onClick={handleExport}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Exporting...' : 'Export with Preset'}</span>
        </button>

        {resultUrl && (
          <a
            href={resultUrl}
            download={`export-${selectedPreset}.${selectedPreset === 'print' ? 'jpg' : selectedPreset === 'archive' ? 'png' : 'webp'}`}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Download Result</span>
          </a>
        )}
      </div>
    </div>
  );
};

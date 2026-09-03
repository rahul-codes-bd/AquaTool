import React, { useState } from 'react';
import { ShoppingBag, Download } from 'lucide-react';
import { ImageEngine } from '../../services/imageEngine';

interface EcommercePackProps {
  currentFile?: File | null;
}

export const EcommercePack: React.FC<EcommercePackProps> = ({ currentFile }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [packResults, setPackResults] = useState<Array<{ name: string; url: string; size: number }>>([]);

  const generatePack = async () => {
    if (!currentFile) return;
    setIsProcessing(true);
    try {
      const img = new Image();
      const objectUrl = ImageEngine.createTrackedUrl(currentFile);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Load failed'));
        img.src = objectUrl;
      });

      const targets = [
        { name: 'catalog-square-1000.jpg', size: 1000, pad: true },
        { name: 'thumbnail-300.jpg', size: 300, pad: false },
        { name: 'zoom-detail-2000.jpg', size: 2000, pad: false },
      ];

      const results = [];
      for (const t of targets) {
        const canvas = document.createElement('canvas');
        canvas.width = t.size;
        canvas.height = t.size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, t.size, t.size);
          const iw = img.naturalWidth || img.width;
          const ih = img.naturalHeight || img.height;
          const scale = Math.min(t.size / iw, t.size / ih);
          const nw = iw * scale;
          const nh = ih * scale;
          const nx = (t.size - nw) / 2;
          const ny = (t.size - nh) / 2;
          ctx.drawImage(img, nx, ny, nw, nh);
        }

        const res = await ImageEngine.exportCanvas(canvas, { format: 'image/jpeg', quality: 0.9 });
        results.push({ name: t.name, url: res.url, size: res.blob.size });
      }
      setPackResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <ShoppingBag className="w-4 h-4 text-cyan-400" />
        <span>E-commerce Image Pack Generator</span>
      </div>
      <p className="text-xs text-slate-400">Instantly generate squared catalog product crops (1000x1000 white padded), thumbnails, and zoom assets.</p>

      <button
        type="button"
        disabled={!currentFile || isProcessing}
        onClick={generatePack}
        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all"
      >
        {isProcessing ? 'Generating Pack...' : 'Generate E-commerce Pack'}
      </button>

      {packResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {packResults.map((p) => (
            <div key={p.name} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span className="truncate">{p.name}</span>
                <span className="font-mono text-cyan-400">{(p.size / 1024).toFixed(1)} KB</span>
              </div>
              <img src={p.url} alt={p.name} className="w-full h-28 object-contain rounded-xl bg-black/40 border border-white/10" />
              <a
                href={p.url}
                download={p.name}
                className="block text-center py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-300 font-medium"
              >
                Download Asset
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

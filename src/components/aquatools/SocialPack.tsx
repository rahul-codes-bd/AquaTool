import React, { useState } from 'react';
import { Share2, Download } from 'lucide-react';
import { ImageEngine } from '../../services/imageEngine';

interface SocialPackProps {
  currentFile?: File | null;
}

export const SocialPack: React.FC<SocialPackProps> = ({ currentFile }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [packResults, setPackResults] = useState<Array<{ name: string; url: string; dims: string }>>([]);

  const generateSocial = async () => {
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
        { name: 'ig-square-1080.jpg', w: 1080, h: 1080 },
        { name: 'ig-story-1080x1920.jpg', w: 1080, h: 1920 },
        { name: 'x-banner-1200x675.jpg', w: 1200, h: 675 },
        { name: 'yt-thumb-1280x720.jpg', w: 1280, h: 720 },
      ];

      const results = [];
      for (const t of targets) {
        const canvas = document.createElement('canvas');
        canvas.width = t.w;
        canvas.height = t.h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, t.w, t.h);
          const iw = img.naturalWidth || img.width;
          const ih = img.naturalHeight || img.height;
          const scale = Math.max(t.w / iw, t.h / ih);
          const nw = iw * scale;
          const nh = ih * scale;
          const nx = (t.w - nw) / 2;
          const ny = (t.h - nh) / 2;
          ctx.drawImage(img, nx, ny, nw, nh);
        }

        const res = await ImageEngine.exportCanvas(canvas, { format: 'image/jpeg', quality: 0.9 });
        results.push({ name: t.name, url: res.url, dims: `${t.w}x${t.h}` });
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
        <Share2 className="w-4 h-4 text-cyan-400" />
        <span>Social Media Pack Generator</span>
      </div>
      <p className="text-xs text-slate-400">Instantly crop & resize images for Instagram (Square & Story), X / Twitter banner, and YouTube thumbnail.</p>

      <button
        type="button"
        disabled={!currentFile || isProcessing}
        onClick={generateSocial}
        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all"
      >
        {isProcessing ? 'Generating Pack...' : 'Generate Social Pack'}
      </button>

      {packResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {packResults.map((p) => (
            <div key={p.name} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span className="truncate">{p.name}</span>
                <span className="font-mono text-cyan-400">{p.dims}</span>
              </div>
              <img src={p.url} alt={p.name} className="w-full h-24 object-cover rounded-xl border border-white/10" />
              <a
                href={p.url}
                download={p.name}
                className="block text-center py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-300 font-medium"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

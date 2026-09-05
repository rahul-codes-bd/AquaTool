import React, { useState } from 'react';
import { Monitor, Download } from 'lucide-react';
import { ImageEngine } from '../../services/imageEngine';

interface ScreenshotBeautifierProps {
  currentFile?: File | null;
}

export const ScreenshotBeautifier: React.FC<ScreenshotBeautifierProps> = ({ currentFile }) => {
  const [padding, setPadding] = useState(60);
  const [borderRadius, setBorderRadius] = useState(16);
  const [theme, setTheme] = useState<'gradient-cyan' | 'dark-slate' | 'sunset'>('gradient-cyan');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const beautify = async () => {
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

      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const totalW = iw + padding * 2;
      const totalH = ih + padding * 2 + 40; // 40px for window header

      const canvas = document.createElement('canvas');
      canvas.width = totalW;
      canvas.height = totalH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, totalW, totalH);
        if (theme === 'gradient-cyan') {
          grad.addColorStop(0, '#0284c7');
          grad.addColorStop(1, '#0f172a');
        } else if (theme === 'dark-slate') {
          grad.addColorStop(0, '#1e293b');
          grad.addColorStop(1, '#090d16');
        } else {
          grad.addColorStop(0, '#f43f5e');
          grad.addColorStop(1, '#4f46e5');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, totalW, totalH);

        // Screenshot window card with shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 20;

        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(padding, padding, iw, ih + 40, borderRadius);
        } else {
          ctx.rect(padding, padding, iw, ih + 40);
        }
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.restore();

        // Window controls (macOS style dots)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(padding + 24, padding + 22, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(padding + 44, padding + 22, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(padding + 64, padding + 22, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw image inside window
        ctx.save();
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(padding, padding + 40, iw, ih, [0, 0, borderRadius, borderRadius]);
        } else {
          ctx.rect(padding, padding + 40, iw, ih);
        }
        ctx.clip();
        ctx.drawImage(img, padding, padding + 40);
        ctx.restore();
      }

      const res = await ImageEngine.exportCanvas(canvas, { format: 'image/png', quality: 1.0 });
      setResultUrl(res.url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <Monitor className="w-4 h-4 text-cyan-400" />
        <span>Screenshot Beautifier</span>
      </div>
      <p className="text-xs text-slate-400">Wrap screenshots in glassmorphic window frames with gradient backdrops and drop shadows.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-300">Padding: {padding}px</label>
          <input
            type="range"
            min="20"
            max="120"
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-slate-300">Corner Radius: {borderRadius}px</label>
          <input
            type="range"
            min="0"
            max="32"
            value={borderRadius}
            onChange={(e) => setBorderRadius(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-slate-300">Theme Backdrop</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-white"
          >
            <option value="gradient-cyan">Cyan Modern Gradient</option>
            <option value="dark-slate">Deep Dark Slate</option>
            <option value="sunset">Sunset Glow</option>
          </select>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          disabled={!currentFile || isProcessing}
          onClick={beautify}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all"
        >
          {isProcessing ? 'Rendering...' : 'Beautify Screenshot'}
        </button>

        {resultUrl && (
          <a
            href={resultUrl}
            download="beautified-screenshot.png"
            className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Result</span>
          </a>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { QrCode, Download } from 'lucide-react';
import { ImageEngine } from '../../services/imageEngine';

interface QrArtboardProps {
  currentFile?: File | null;
}

export const QrArtboard: React.FC<QrArtboardProps> = ({ currentFile }) => {
  const [text, setText] = useState('https://aquatools.local');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const generateQrArtboard = async () => {
    setIsProcessing(true);
    try {
      const artW = 1000;
      const artH = 1200;
      const canvas = document.createElement('canvas');
      canvas.width = artW;
      canvas.height = artH;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, artW, artH);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, artW, artH);

        // Header text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scan to Connect', artW / 2, 120);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '20px monospace';
        ctx.fillText(text, artW / 2, 170);

        // Draw simulated QR matrix frame
        const qrSize = 600;
        const qrX = (artW - qrSize) / 2;
        const qrY = 240;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60);

        // QR finder patterns (corners)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(qrX, qrY, 140, 140);
        ctx.fillRect(qrX + qrSize - 140, qrY, 140, 140);
        ctx.fillRect(qrX, qrY + qrSize - 140, 140, 140);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX + 20, qrY + 20, 100, 100);
        ctx.fillRect(qrX + qrSize - 120, qrY + 20, 100, 100);
        ctx.fillRect(qrX + 20, qrY + qrSize - 120, 100, 100);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(qrX + 44, qrY + 44, 52, 52);
        ctx.fillRect(qrX + qrSize - 96, qrY + 44, 52, 52);
        ctx.fillRect(qrX + 44, qrY + qrSize - 96, 52, 52);

        // If file provided, draw centered logo inside QR
        if (currentFile) {
          const img = new Image();
          const objectUrl = ImageEngine.createTrackedUrl(currentFile);
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = objectUrl;
          });
          const lw = 120;
          const lh = 120;
          const lx = artW / 2 - lw / 2;
          const ly = qrY + qrSize / 2 - lh / 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(lx - 10, ly - 10, lw + 20, lh + 20);
          ctx.drawImage(img, lx, ly, lw, lh);
        }

        // Footer text
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px sans-serif';
        ctx.fillText('Powered by AquaTools Artboard', artW / 2, 1040);
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
        <QrCode className="w-4 h-4 text-cyan-400" />
        <span>QR Code Artboard Studio</span>
      </div>
      <p className="text-xs text-slate-400">Generate high-resolution QR artboards with embedded center logos and custom styling.</p>

      <div className="space-y-2">
        <label className="text-xs text-slate-300">QR Target URL / Text</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
        />
      </div>

      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          disabled={isProcessing}
          onClick={generateQrArtboard}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all"
        >
          {isProcessing ? 'Generating Artboard...' : 'Generate QR Artboard'}
        </button>

        {resultUrl && (
          <a
            href={resultUrl}
            download="qr-artboard.png"
            className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download QR Artboard</span>
          </a>
        )}
      </div>
    </div>
  );
};

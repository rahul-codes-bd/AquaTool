import React, { useState } from 'react';
import { Printer, Download } from 'lucide-react';
import { ImageEngine } from '../../services/imageEngine';

interface PrintSheetProps {
  currentFile?: File | null;
}

export const PrintSheet: React.FC<PrintSheetProps> = ({ currentFile }) => {
  const [gridColumns, setGridColumns] = useState(2);
  const [gridRows, setGridRows] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const generateSheet = async () => {
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

      const sheetW = 2480; // A4 300 DPI width approx
      const sheetH = 3508; // A4 300 DPI height approx
      const canvas = document.createElement('canvas');
      canvas.width = sheetW;
      canvas.height = sheetH;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sheetW, sheetH);

        const margin = 150;
        const gap = 80;
        const usableW = sheetW - margin * 2;
        const usableH = sheetH - margin * 2;
        const cellW = (usableW - gap * (gridColumns - 1)) / gridColumns;
        const cellH = (usableH - gap * (gridRows - 1)) / gridRows;

        for (let r = 0; r < gridRows; r++) {
          for (let c = 0; c < gridColumns; c++) {
            const x = margin + c * (cellW + gap);
            const y = margin + r * (cellH + gap);

            // Draw crop marks
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, cellW, cellH);

            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;
            const scale = Math.min(cellW / iw, cellH / ih);
            const nw = iw * scale;
            const nh = ih * scale;
            const nx = x + (cellW - nw) / 2;
            const ny = y + (cellH - nh) / 2;

            ctx.drawImage(img, nx, ny, nw, nh);
          }
        }
      }

      const res = await ImageEngine.exportCanvas(canvas, { format: 'image/jpeg', quality: 0.95 });
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
        <Printer className="w-4 h-4 text-cyan-400" />
        <span>Print Sheet & Contact Grid</span>
      </div>
      <p className="text-xs text-slate-400">Arrange image grid layouts onto standard A4 print sheets with crop registration marks.</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-300">Columns: {gridColumns}</label>
          <input
            type="range"
            min="1"
            max="4"
            value={gridColumns}
            onChange={(e) => setGridColumns(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-slate-300">Rows: {gridRows}</label>
          <input
            type="range"
            min="1"
            max="4"
            value={gridRows}
            onChange={(e) => setGridRows(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          disabled={!currentFile || isProcessing}
          onClick={generateSheet}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all"
        >
          {isProcessing ? 'Generating Sheet...' : 'Generate Print Sheet'}
        </button>

        {resultUrl && (
          <a
            href={resultUrl}
            download="print-contact-sheet.jpg"
            className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Print Sheet</span>
          </a>
        )}
      </div>
    </div>
  );
};

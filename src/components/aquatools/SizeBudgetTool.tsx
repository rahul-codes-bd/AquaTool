import React, { useState } from 'react';
import { FileText, Download, Check } from 'lucide-react';
import { ImageEngine } from '../../services/imageEngine';

interface SizeBudgetToolProps {
  currentFile?: File | null;
}

export const SizeBudgetTool: React.FC<SizeBudgetToolProps> = ({ currentFile }) => {
  const [targetKb, setTargetKb] = useState(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ quality: number; size: number; url: string } | null>(null);

  const optimizeToBudget = async () => {
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

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);

      const targetBytes = targetKb * 1024;
      const comp = await ImageEngine.compressToTargetSize(canvas, targetBytes, 'image/jpeg');
      setResult({ quality: comp.quality, size: comp.blob.size, url: comp.url });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <FileText className="w-4 h-4 text-cyan-400" />
        <span>File Size Budget Optimization Tool</span>
      </div>
      <p className="text-xs text-slate-400">Automated binary search compression to hit strict file size caps (e.g. for email or strict upload limits).</p>

      <div className="space-y-2">
        <label className="text-xs text-slate-300">Target File Size: {targetKb} KB</label>
        <input
          type="range"
          min="50"
          max="2000"
          step="50"
          value={targetKb}
          onChange={(e) => setTargetKb(Number(e.target.value))}
          className="w-full accent-cyan-400"
        />
      </div>

      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          disabled={!currentFile || isProcessing}
          onClick={optimizeToBudget}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all"
        >
          {isProcessing ? 'Optimizing to Budget...' : 'Optimize to Budget'}
        </button>

        {result && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-mono">
              Achieved: {(result.size / 1024).toFixed(1)} KB (Q={Math.round(result.quality * 100)}%)
            </span>
            <a
              href={result.url}
              download={`budget-${targetKb}kb.jpg`}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

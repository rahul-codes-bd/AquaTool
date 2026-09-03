import React, { useState } from 'react';
import { Cpu, Eye, ArrowRight } from 'lucide-react';
import { ImageEngine } from '../../services/imageEngine';

interface QualitySizeLabProps {
  currentFile?: File | null;
}

export const QualitySizeLab: React.FC<QualitySizeLabProps> = ({ currentFile }) => {
  const [qualities, setQualities] = useState<number[]>([0.9, 0.7, 0.5, 0.3]);
  const [results, setResults] = useState<Array<{ quality: number; size: number; url: string }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runLab = async () => {
    if (!currentFile) return;
    setIsAnalyzing(true);
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

      const resList = [];
      for (const q of qualities) {
        const res = await ImageEngine.exportCanvas(canvas, { format: 'image/jpeg', quality: q });
        resList.push({ quality: q, size: res.blob.size, url: res.url });
      }
      setResults(resList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <Cpu className="w-4 h-4 text-cyan-400" />
        <span>Quality-vs-Size Matrix Lab</span>
      </div>
      <p className="text-xs text-slate-400">Compare file sizes and compression artifacts across multiple JPEG quality tiers.</p>

      <button
        type="button"
        disabled={!currentFile || isAnalyzing}
        onClick={runLab}
        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all"
      >
        {isAnalyzing ? 'Running Matrix...' : 'Run Quality Matrix'}
      </button>

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {results.map((r) => (
            <div key={r.quality} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span>Q = {Math.round(r.quality * 100)}%</span>
                <span className="font-mono text-cyan-400">{(r.size / 1024).toFixed(1)} KB</span>
              </div>
              <img src={r.url} alt={`Quality ${r.quality}`} className="w-full h-24 object-cover rounded-xl border border-white/10" />
              <a
                href={r.url}
                download={`quality-${Math.round(r.quality * 100)}.jpg`}
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

import React, { useState } from 'react';
import { Sparkles, Zap, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface SmartRecommendationEngineProps {
  file: File;
  onApplyFormat: (format: string, quality?: number) => void;
}

export const SmartRecommendationEngine: React.FC<SmartRecommendationEngineProps> = ({
  file,
  onApplyFormat,
}) => {
  const [useCase, setUseCase] = useState<'web' | 'email' | 'archival' | 'print' | 'data'>('web');

  const getRecommendation = () => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const sizeMb = file.size / (1024 * 1024);

    if (['jpg', 'jpeg', 'png', 'bmp'].includes(ext)) {
      if (useCase === 'web') {
        return {
          targetFormat: 'webp',
          quality: 0.82,
          reason: 'WebP provides ~35% smaller file sizes than JPEG with identical visual fidelity.',
          estimatedSaving: '~30-40%',
          badge: 'Web Standard',
        };
      } else if (useCase === 'email') {
        return {
          targetFormat: 'jpg',
          quality: 0.65,
          reason: 'Compresses image below attachment threshold while preserving text readability.',
          estimatedSaving: '~50-65%',
          badge: 'Email Compact',
        };
      } else if (useCase === 'print') {
        return {
          targetFormat: 'png',
          quality: 1.0,
          reason: 'Lossless format preserving high DPI pixel precision and alpha transparency.',
          estimatedSaving: '0% (Lossless)',
          badge: 'Print Ready',
        };
      }
    } else if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
      if (useCase === 'web') {
        return {
          targetFormat: 'webm',
          quality: 0.8,
          reason: 'WebM containers render natively across all modern desktop & mobile browsers.',
          estimatedSaving: '~20-30%',
          badge: 'HTML5 Video',
        };
      } else if (useCase === 'email') {
        return {
          targetFormat: 'gif',
          quality: 0.6,
          reason: 'Loops video snippet into lightweight inline animated graphics.',
          estimatedSaving: '~40%',
          badge: 'Animated Snippet',
        };
      }
    } else if (['txt', 'csv', 'tsv', 'json'].includes(ext)) {
      if (useCase === 'data') {
        return {
          targetFormat: ext === 'json' ? 'csv' : 'json',
          quality: 1.0,
          reason: 'Tabular array transformation for instant database import/export.',
          estimatedSaving: 'N/A (Structure)',
          badge: 'Data Interchange',
        };
      }
    } else if (['epub', 'mobi', 'docx'].includes(ext)) {
      return {
        targetFormat: 'pdf',
        quality: 1.0,
        reason: 'Reflows document contents into a clean vector print-ready layout.',
        estimatedSaving: 'Normalized',
        badge: 'Universal Reader',
      };
    }

    return {
      targetFormat: 'webp',
      quality: 0.85,
      reason: 'Modern compressed format offering multi-platform speed and high clarity.',
      estimatedSaving: '~25%',
      badge: 'Balanced',
    };
  };

  const rec = getRecommendation();

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-cyan-950/20 to-slate-900 border border-cyan-500/20 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Smart Format Recommendation Engine</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
          {rec.badge}
        </span>
      </div>

      {/* Use Case Selector */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <span className="text-[11px] text-slate-400 self-center mr-1">Intended Goal:</span>
        {[
          { id: 'web', label: '🌐 Web Speed' },
          { id: 'email', label: '✉️ Email Attachment' },
          { id: 'print', label: '🖨️ High Quality Print' },
          { id: 'data', label: '📊 Developer Export' },
        ].map((uc) => (
          <button
            key={uc.id}
            onClick={() => setUseCase(uc.id as any)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              useCase === uc.id
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            {uc.label}
          </button>
        ))}
      </div>

      {/* Recommendation Summary */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Recommended Target:</span>
            <span className="text-sm font-black text-cyan-300 uppercase font-mono">{rec.targetFormat}</span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">{rec.estimatedSaving}</span>
          </div>
          <p className="text-xs text-slate-300">{rec.reason}</p>
        </div>

        <button
          onClick={() => onApplyFormat(rec.targetFormat, rec.quality)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20 whitespace-nowrap cursor-pointer"
        >
          <span>Apply</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

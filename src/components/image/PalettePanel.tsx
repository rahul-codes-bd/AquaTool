import React, { useState } from 'react';
import { Palette, Copy, Check, Sparkles, Code2 } from 'lucide-react';
import { PaletteExtractionResult, ColorSwatch } from '../../types/image';

interface PalettePanelProps {
  palette: PaletteExtractionResult;
}

export const PalettePanel: React.FC<PalettePanelProps> = ({ palette }) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const copyCssVars = () => {
    const cssText = `:root {\n${palette.swatches
      .map((s, idx) => `  --color-accent-${idx + 1}: ${s.hex}; /* ${s.rgb} */`)
      .join('\n')}\n}`;
    navigator.clipboard.writeText(cssText);
    setCopiedHex('css');
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="bg-slate-950/60 border border-white/10 rounded-3xl p-5 backdrop-blur-xl space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Palette className="w-4 h-4 text-cyan-400" />
          <span>Extracted Color Palette</span>
        </div>

        <button
          type="button"
          onClick={copyCssVars}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5"
        >
          {copiedHex === 'css' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">CSS Copied!</span>
            </>
          ) : (
            <>
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy CSS Variables</span>
            </>
          )}
        </button>
      </div>

      {/* Swatches Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {palette.swatches.map((swatch, idx) => (
          <div
            key={idx}
            onClick={() => handleCopy(swatch.hex)}
            className="group cursor-pointer rounded-2xl p-2.5 bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all flex flex-col space-y-2 shadow-lg"
          >
            <div
              style={{ backgroundColor: swatch.hex }}
              className="w-full h-14 rounded-xl shadow-inner border border-white/10 flex items-end justify-end p-1.5"
            >
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-white font-bold backdrop-blur-sm">
                {swatch.percent}%
              </span>
            </div>

            <div className="space-y-0.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white">{swatch.hex}</span>
                {copiedHex === swatch.hex ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate">{swatch.rgb}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

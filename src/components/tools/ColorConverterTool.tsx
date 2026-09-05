import React, { useState, useEffect } from 'react';
import { CryptoTools, ColorModel } from '../../services/cryptoTools';
import { CopyButton } from '../common/CopyButton';
import { ErrorAlert } from '../common/ErrorAlert';
import { Palette, Check, Shield } from 'lucide-react';

export const ColorConverterTool: React.FC = () => {
  const [inputVal, setInputVal] = useState('#06B6D4');
  const [color, setColor] = useState<ColorModel | null>(() => CryptoTools.parseColor('#06B6D4'));
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleColorUpdate = (raw: string) => {
    setInputVal(raw);
    if (!raw.trim()) {
      setError('Please enter a color code.');
      return;
    }

    const parsed = CryptoTools.parseColor(raw);
    if (parsed) {
      setColor(parsed);
      setError(null);
    } else {
      setError(`Malformed color format: "${raw}". Accepted formats: #RGB, #RRGGBB, rgb(r, g, b), rgba(r, g, b, a), hsl(h, s%, l%), hsla(h, s%, l%, a).`);
    }
  };

  // Generate 6 lightness tints & shades
  const shades = color
    ? [15, 30, 45, 60, 75, 90].map((l) => `hsl(${color.h}, ${color.s}%, ${l}%)`)
    : [];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-3">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong>Local Color Synthesis:</strong> Converts and computes color spaces (HEX, RGB, RGBA, HSL, HSLA) locally in browser memory without external APIs.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-6">
        {/* Color picker & main preview */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800">
          <div
            className="w-28 h-28 rounded-2xl border-2 border-slate-700 shadow-2xl flex items-center justify-center transition-all shrink-0"
            style={{ backgroundColor: color ? color.hex : '#1e293b' }}
          />

          <div className="space-y-3 w-full">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Enter Any Color or Pick Palette
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color ? color.hex : '#06B6D4'}
                onChange={(e) => handleColorUpdate(e.target.value.toUpperCase())}
                className="w-12 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => handleColorUpdate(e.target.value)}
                placeholder="#06B6D4, rgb(6, 182, 212), or hsl(189, 94%, 43%)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-cyan-300 font-bold focus:ring-2 focus:ring-cyan-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Supports 3/6-digit Hex, RGB(A), and HSL(A) formats.
            </p>
          </div>
        </div>

        {error && <ErrorAlert message={error} />}

        {/* Color representations */}
        {color && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono">HEX Format</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-300">{color.hex}</span>
                <CopyButton textToCopy={color.hex} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono">RGB Format</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-300">{color.rgbString}</span>
                <CopyButton textToCopy={color.rgbString} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono">HSL Format</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-300">{color.hslString}</span>
                <CopyButton textToCopy={color.hslString} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono">RGBA (with alpha)</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-300">{color.rgbaString}</span>
                <CopyButton textToCopy={color.rgbaString} />
              </div>
            </div>
          </div>
        )}

        {/* Color Shades Palette */}
        {color && shades.length > 0 && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Harmonic Lightness Tints &amp; Shades (Click to copy HSL)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {shades.map((shade, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl border border-slate-800 flex items-end justify-center p-1 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md relative group"
                  style={{ backgroundColor: shade }}
                  onClick={() => {
                    navigator.clipboard.writeText(shade);
                    setCopiedIndex(i);
                    setTimeout(() => setCopiedIndex(null), 1500);
                  }}
                  title={`Click to copy: ${shade}`}
                >
                  <span className="text-[10px] font-mono bg-slate-950/80 text-slate-200 px-1.5 py-0.5 rounded shadow">
                    {copiedIndex === i ? 'Copied!' : `${i * 15 + 15}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

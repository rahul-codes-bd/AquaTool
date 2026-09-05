import React, { useState, useRef, useEffect } from 'react';
import { FileDropzone } from '../common/FileDropzone';
import { Pipette, Copy, Check } from 'lucide-react';
import { CopyButton } from '../common/CopyButton';
import { CryptoTools } from '../../services/cryptoTools';

export const ImageColorPickerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<{
    hex: string;
    rgb: string;
    hsl: string;
  }>({
    hex: '#06b6d4',
    rgb: 'rgb(6, 182, 212)',
    hsl: 'hsl(189, 94%, 43%)',
  });
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      if (imgUrl) URL.revokeObjectURL(imgUrl);
      const url = URL.createObjectURL(files[0]);
      setImgUrl(url);

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = url;
    }
  };

  const samplePixel = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];

      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
      const rgb = `rgb(${r}, ${g}, ${b})`;
      const hslData = CryptoTools.rgbToHsl(r, g, b);
      const hsl = `hsl(${hslData.h}, ${hslData.s}%, ${hslData.l}%)`;

      setSelectedColor({ hex, rgb, hsl });
      setRecentColors((prev) => Array.from(new Set([hex, ...prev])).slice(0, 12));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          accept="image/*"
          onFilesSelected={handleFile}
          title="Upload image to sample pixel colors"
          subtitle="Click anywhere on the loaded image to extract exact HEX, RGB, and HSL codes."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Canvas view */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Pipette className="w-4 h-4 text-cyan-400" /> Click on image to pick color
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setImgUrl(null);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-400"
                >
                  Change Image
                </button>
              </div>

              <div className="relative max-h-[450px] overflow-auto rounded-xl bg-slate-950 flex items-center justify-center p-2 border border-slate-800">
                <canvas
                  ref={canvasRef}
                  onClick={samplePixel}
                  className="max-h-[400px] max-w-full cursor-crosshair object-contain"
                />
              </div>
            </div>

            {/* Color inspection card */}
            <div className="glass-panel rounded-2xl p-5 space-y-5">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Sampled Color
              </h4>

              {/* Color swatch */}
              <div
                className="w-full h-24 rounded-xl border border-slate-700 shadow-inner flex items-center justify-center transition-colors"
                style={{ backgroundColor: selectedColor.hex }}
              />

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400">HEX Code</span>
                    <p className="font-mono text-xs font-bold text-cyan-300">{selectedColor.hex}</p>
                  </div>
                  <CopyButton textToCopy={selectedColor.hex} />
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400">RGB Code</span>
                    <p className="font-mono text-xs font-bold text-cyan-300">{selectedColor.rgb}</p>
                  </div>
                  <CopyButton textToCopy={selectedColor.rgb} />
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400">HSL Code</span>
                    <p className="font-mono text-xs font-bold text-cyan-300">{selectedColor.hsl}</p>
                  </div>
                  <CopyButton textToCopy={selectedColor.hsl} />
                </div>
              </div>

              {recentColors.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400">Sampled Palette</span>
                  <div className="flex flex-wrap gap-2">
                    {recentColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const rgb = CryptoTools.hexToRgb(c);
                          if (rgb) {
                            const hslData = CryptoTools.rgbToHsl(rgb.r, rgb.g, rgb.b);
                            setSelectedColor({
                              hex: c,
                              rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
                              hsl: `hsl(${hslData.h}, ${hslData.s}%, ${hslData.l}%)`,
                            });
                          }
                        }}
                        className="w-7 h-7 rounded-lg border border-slate-700 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

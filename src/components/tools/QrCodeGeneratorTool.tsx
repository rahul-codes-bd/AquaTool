import React, { useState, useEffect } from 'react';
import { GeneratorTools, QrCodeOptions } from '../../services/generatorTools';
import { DownloadButton } from '../common/DownloadButton';
import { ErrorAlert } from '../common/ErrorAlert';
import { QrCode, Download, RefreshCw, Shield } from 'lucide-react';
import { CopyButton } from '../common/CopyButton';

export const QrCodeGeneratorTool: React.FC = () => {
  const [text, setText] = useState('https://aquatools.local');
  const [options, setOptions] = useState<QrCodeOptions>({
    width: 320,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!text.trim()) {
      setPngDataUrl('');
      setSvgString('');
      setError('Please enter text or a URL to generate a QR code.');
      return;
    }
    setError(null);
    try {
      const [png, svg] = await Promise.all([
        GeneratorTools.generateQrCodeDataUrl(text, options),
        GeneratorTools.generateQrCodeSvg(text, options),
      ]);
      setPngDataUrl(png);
      setSvgString(svg);
    } catch (e: any) {
      setError(e.message || 'QR code generation failed. Input may be too large.');
      setPngDataUrl('');
      setSvgString('');
    }
  };

  useEffect(() => {
    generate();
  }, [text, options]);

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-3">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong>Zero Network Calls:</strong> All QR matrix calculations and vector SVG render loops execute locally in browser memory using HTML5 canvas.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Content / URL / Wi-Fi Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:ring-2 focus:ring-cyan-400 focus:outline-none"
              placeholder="Enter text or URL to encode..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Foreground Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={options.color?.dark || '#0f172a'}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      color: { ...options.color, dark: e.target.value },
                    })
                  }
                  className="w-10 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300">{options.color?.dark}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={options.color?.light || '#ffffff'}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      color: { ...options.color, light: e.target.value },
                    })
                  }
                  className="w-10 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300">{options.color?.light}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Error Correction Level</label>
              <select
                value={options.errorCorrectionLevel}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    errorCorrectionLevel: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
              >
                <option value="L">L (7% error recovery - denser)</option>
                <option value="M">M (15% recovery - recommended)</option>
                <option value="Q">Q (25% recovery)</option>
                <option value="H">H (30% recovery - high redundancy)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Padding Margin</label>
              <select
                value={options.margin}
                onChange={(e) =>
                  setOptions({ ...options, margin: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
              >
                <option value="1">Small (1 module)</option>
                <option value="2">Medium (2 modules)</option>
                <option value="4">Large (4 modules)</option>
              </select>
            </div>
          </div>
        </div>

        {/* QR Preview & Download */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-between gap-5 text-center">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            QR Code Preview
          </h4>

          <div className="p-4 rounded-2xl bg-white shadow-xl flex items-center justify-center">
            {pngDataUrl && (
              <img src={pngDataUrl} alt="Generated QR Code" className="w-48 h-48 object-contain" />
            )}
          </div>

          <div className="w-full space-y-2">
            {pngDataUrl && (
              <DownloadButton
                url={pngDataUrl}
                fileName="aquatools-qrcode.png"
                label="Download PNG Image"
                className="w-full justify-center"
              />
            )}
            {svgString && (
              <DownloadButton
                blob={new Blob([svgString], { type: 'image/svg+xml' })}
                fileName="aquatools-qrcode.svg"
                label="Download Vector SVG"
                className="w-full justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

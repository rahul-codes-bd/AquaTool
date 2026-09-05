import React, { useState, useEffect } from 'react';
import { Sliders, Bookmark, Check, Save, Trash2, Zap } from 'lucide-react';

export interface PresetRecipe {
  id: string;
  name: string;
  description: string;
  targetFormat: string;
  quality: number;
  width?: number;
  height?: number;
  sampleRate?: number;
  channels?: number;
  icon: string;
}

const DEFAULT_PRESETS: PresetRecipe[] = [
  {
    id: 'web-speed',
    name: 'Web Speed Optimization',
    description: 'Converts images to WebP at 80% quality with max 1920px dimensions.',
    targetFormat: 'webp',
    quality: 0.8,
    width: 1920,
    icon: '🚀',
  },
  {
    id: 'email-shrink',
    name: 'Email Attachment Shrinker',
    description: 'Compresses photos/media max 1280px for fast email delivery.',
    targetFormat: 'jpg',
    quality: 0.65,
    width: 1280,
    icon: '✉️',
  },
  {
    id: 'print-vector',
    name: 'Print Ready Graphic',
    description: 'Preserves 100% lossy-free pixel clarity and vector DPI.',
    targetFormat: 'png',
    quality: 1.0,
    icon: '🖨️',
  },
  {
    id: 'audio-speech',
    name: 'Audio Voice Compact',
    description: 'Downmixes audio to mono 22.05 kHz WAV for fast speech processing.',
    targetFormat: 'wav',
    quality: 0.7,
    sampleRate: 22050,
    channels: 1,
    icon: '🎧',
  },
  {
    id: 'dev-bundle',
    name: 'Developer Data Export',
    description: 'Clean formatted JSON/CSV dataset with sanitized field keys.',
    targetFormat: 'json',
    quality: 1.0,
    icon: '📊',
  },
];

interface BatchPresetsStudioProps {
  onSelectPreset: (preset: PresetRecipe) => void;
  activePresetId?: string;
}

export const BatchPresetsStudio: React.FC<BatchPresetsStudioProps> = ({
  onSelectPreset,
  activePresetId,
}) => {
  const [presets, setPresets] = useState<PresetRecipe[]>(() => {
    try {
      const saved = localStorage.getItem('aquatools_custom_presets');
      if (saved) {
        return [...DEFAULT_PRESETS, ...JSON.parse(saved)];
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PRESETS;
  });

  const [showNewModal, setShowNewModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newFormat, setNewFormat] = useState('webp');
  const [newQuality, setNewQuality] = useState(0.85);

  const saveCustomPreset = () => {
    if (!newPresetName.trim()) return;
    const newRecipe: PresetRecipe = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: 'Custom local batch preset.',
      targetFormat: newFormat,
      quality: newQuality,
      icon: '⚙️',
    };
    const customOnly = presets.filter((p) => p.id.startsWith('custom-'));
    const updatedCustom = [...customOnly, newRecipe];
    localStorage.setItem('aquatools_custom_presets', JSON.stringify(updatedCustom));
    setPresets([...DEFAULT_PRESETS, ...updatedCustom]);
    setNewPresetName('');
    setShowNewModal(false);
  };

  const deleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedCustom = presets.filter((p) => p.id !== id && p.id.startsWith('custom-'));
    localStorage.setItem('aquatools_custom_presets', JSON.stringify(updatedCustom));
    setPresets([...DEFAULT_PRESETS, ...updatedCustom]);
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
          <Bookmark className="w-4 h-4 text-cyan-400" />
          <span>Universal Batch Presets</span>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
        >
          <Save className="w-3 h-3" /> Save Preset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {presets.map((p) => {
          const isActive = activePresetId === p.id;
          return (
            <div
              key={p.id}
              onClick={() => onSelectPreset(p)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer relative group ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <span>{p.icon}</span> {p.name}
                </span>
                {isActive && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                {p.id.startsWith('custom-') && (
                  <button
                    onClick={(e) => deleteCustomPreset(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">{p.description}</p>
              <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-cyan-300">
                <span className="uppercase font-bold">{p.targetFormat}</span>
                <span>• {Math.round(p.quality * 100)}% Quality</span>
                {p.width && <span>• {p.width}px</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Preset Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/10 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-cyan-400" /> Save Local Batch Preset
            </h3>

            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Preset Name</label>
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g. My Portfolio WebP Batch"
                className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Format</label>
                <select
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white bg-slate-900"
                >
                  <option value="webp">WebP</option>
                  <option value="jpg">JPG</option>
                  <option value="png">PNG</option>
                  <option value="pdf">PDF</option>
                  <option value="wav">WAV</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Quality</label>
                <select
                  value={newQuality}
                  onChange={(e) => setNewQuality(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white bg-slate-900"
                >
                  <option value={1.0}>100% (Lossless)</option>
                  <option value={0.85}>85% (Optimal)</option>
                  <option value={0.7}>70% (Compact)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomPreset}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

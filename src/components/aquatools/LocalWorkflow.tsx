import React, { useState } from 'react';
import { Layers, CheckCircle2, ArrowRight } from 'lucide-react';

export const LocalWorkflow: React.FC = () => {
  const [step, setStep] = useState(1);

  const steps = [
    { num: 1, title: 'Local File Drop', desc: 'Select or drag local images without server upload.' },
    { num: 2, title: 'Privacy Scrub', desc: 'Remove EXIF headers, GPS, and device serials.' },
    { num: 3, title: 'Smart Resize & Enhance', desc: 'Apply tone adjustments, filters, and resizing.' },
    { num: 4, title: 'Batch Export ZIP', desc: 'Download compiled package instantly.' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <Layers className="w-4 h-4 text-cyan-400" />
        <span>Local Image Workflow Guide</span>
      </div>
      <p className="text-xs text-slate-400">Step-by-step pipeline for secure, zero-persistence batch image processing.</p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
        {steps.map((s) => (
          <div
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
              step === s.num
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-lg'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center">
                {s.num}
              </span>
              {step > s.num && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="font-semibold text-xs text-white">{s.title}</div>
            <p className="text-[11px] text-slate-400">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Active Step {step}: {steps[step - 1].title}</span>
          <span className="text-[11px] text-cyan-400 font-mono">100% Client-Side Sandbox</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {step === 1 && 'Drag and drop your image files into the master workspace. Files remain entirely in browser RAM.'}
          {step === 2 && 'Use the Privacy Inspector to review embedded metadata and scrub GPS or camera identifiers.'}
          {step === 3 && 'Fine-tune exposure, contrast, saturation, or apply smart export presets and filters.'}
          {step === 4 && 'Export individual assets or package the entire batch into a compressed ZIP archive in one click.'}
        </p>

        <div className="flex justify-end gap-2 pt-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs"
            >
              Previous Step
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold text-xs flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldCheck, Cpu, Sliders, HardDrive, CheckCircle, Loader2 } from 'lucide-react';

interface PipelineVisualizerProps {
  currentStage: 'idle' | 'scanning' | 'decoding' | 'optimizing' | 'encoding' | 'completed';
  progress: number;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ currentStage, progress }) => {
  const stages = [
    { id: 'scanning', label: '1. Health & Security Scan', icon: ShieldCheck },
    { id: 'decoding', label: '2. Local Stream Decoder', icon: Cpu },
    { id: 'optimizing', label: '3. Quality Optimizer', icon: Sliders },
    { id: 'encoding', label: '4. Local Stream Encoder', icon: HardDrive },
    { id: 'completed', label: '5. URL Registration', icon: CheckCircle },
  ];

  const getStageStatus = (stageId: string) => {
    const stageOrder = ['scanning', 'decoding', 'optimizing', 'encoding', 'completed'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stageId);

    if (currentStage === 'completed') return 'completed';
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cyan-400" /> Local Conversion Pipeline
        </span>
        <span className="text-xs font-mono text-slate-400 font-semibold">{progress}%</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
        {stages.map((st) => {
          const status = getStageStatus(st.id);
          const Icon = st.icon;

          return (
            <div
              key={st.id}
              className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center text-center space-y-1.5 transition-all motion-reduce:transition-none ${
                status === 'completed'
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : status === 'active'
                  ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 animate-pulse motion-reduce:animate-none'
                  : 'bg-white/5 border-white/5 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-1">
                {status === 'active' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none text-cyan-400" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${status === 'completed' ? 'text-emerald-400' : ''}`} />
                )}
              </div>
              <span className="text-[10px] font-medium leading-tight">{st.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Film, Volume2, Image as ImageIcon, Info, Cpu, Clock } from 'lucide-react';
import { MediaEngine, MediaMetadata } from '../../services/fileconv/mediaEngine';

interface MediaTechnicalReportProps {
  file: File;
}

export const MediaTechnicalReport: React.FC<MediaTechnicalReportProps> = ({ file }) => {
  const [meta, setMeta] = useState<MediaMetadata | null>(null);

  const isAudio = file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].some((ext) => file.name.toLowerCase().endsWith('.' + ext));
  const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].some((ext) => file.name.toLowerCase().endsWith('.' + ext));

  useEffect(() => {
    let active = true;
    if (isAudio) {
      MediaEngine.getAudioMetadata(file)
        .then((m) => active && setMeta(m))
        .catch(() => {});
    } else if (isVideo) {
      MediaEngine.getVideoMetadata(file)
        .then((m) => active && setMeta(m))
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [file]);

  if (!isAudio && !isVideo) return null;

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Media Technical Inspection Report</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 uppercase">{file.type || 'Media Stream'}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase block">Duration</span>
          <span className="font-bold text-cyan-300">{meta?.duration ? `${meta.duration.toFixed(1)}s` : 'Detecting...'}</span>
        </div>

        {meta?.width && meta?.height && (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase block">Resolution</span>
            <span className="font-bold text-slate-200">{meta.width}x{meta.height}</span>
          </div>
        )}

        {meta?.audioChannels && (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase block">Channels</span>
            <span className="font-bold text-slate-200">{meta.audioChannels === 1 ? '1 (Mono)' : '2 (Stereo)'}</span>
          </div>
        )}

        {meta?.sampleRate && (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase block">Sample Rate</span>
            <span className="font-bold text-slate-200">{(meta.sampleRate / 1000).toFixed(1)} kHz</span>
          </div>
        )}

        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase block">File Size</span>
          <span className="font-bold text-slate-200">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
      </div>
    </div>
  );
};

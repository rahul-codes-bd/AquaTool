import React, { useState, useEffect } from 'react';
import { Sliders, Volume2, Video, Clock, Scissors, Film } from 'lucide-react';
import { MediaEngine, MediaMetadata } from '../../services/fileconv/mediaEngine';

interface MediaOptionsEditorProps {
  file: File;
  targetFormat: string;
  startTime?: number;
  endTime?: number;
  sampleRate?: number;
  channels?: number;
  frameTime?: number;
  onChange: (options: {
    startTime?: number;
    endTime?: number;
    sampleRate?: number;
    channels?: number;
    frameTime?: number;
  }) => void;
  disabled?: boolean;
}

export const MediaOptionsEditor: React.FC<MediaOptionsEditorProps> = ({
  file,
  targetFormat,
  startTime = 0,
  endTime,
  sampleRate = 44100,
  channels = 2,
  frameTime = 0,
  onChange,
  disabled = false,
}) => {
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const isAudio = file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].some((ext) => file.name.toLowerCase().endsWith('.' + ext));
  const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].some((ext) => file.name.toLowerCase().endsWith('.' + ext));
  const isFrameExport = isVideo && ['png', 'jpg', 'webp'].includes(targetFormat.toLowerCase());

  useEffect(() => {
    let active = true;
    if (isAudio) {
      setLoadingMeta(true);
      MediaEngine.getAudioMetadata(file)
        .then((meta) => {
          if (active) {
            setMetadata(meta);
            setLoadingMeta(false);
          }
        })
        .catch(() => {
          if (active) setLoadingMeta(false);
        });
    } else if (isVideo) {
      setLoadingMeta(true);
      MediaEngine.getVideoMetadata(file)
        .then((meta) => {
          if (active) {
            setMetadata(meta);
            setLoadingMeta(false);
          }
        })
        .catch(() => {
          if (active) setLoadingMeta(false);
        });
    }

    return () => {
      active = false;
    };
  }, [file]);

  if (!isAudio && !isVideo) {
    return null;
  }

  const duration = metadata?.duration || 0;
  const activeEnd = endTime !== undefined ? endTime : duration;
  const activeTrimLength = Math.max(0, activeEnd - startTime);
  const estimatedSizeBytes = MediaEngine.estimateMediaSize(
    activeTrimLength > 0 ? activeTrimLength : duration,
    isVideo ? 'video' : 'audio'
  );

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
          {isVideo ? <Video className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{isVideo ? 'Video Settings & Trim' : 'Audio Controls & Trim'}</span>
        </div>
        {metadata && (
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {metadata.duration.toFixed(1)}s
            </span>
            {metadata.width && metadata.height && (
              <span className="flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-slate-500" />
                {metadata.width}x{metadata.height}
              </span>
            )}
          </div>
        )}
      </div>

      {loadingMeta && (
        <div className="text-xs font-mono text-slate-500 animate-pulse">Inspecting media stream metadata...</div>
      )}

      {/* Frame Export Control for Video -> Image */}
      {isFrameExport && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label className="text-slate-300 font-medium">Extract Frame Timestamp</label>
            <span className="font-mono text-cyan-400">{frameTime.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 60}
            step={0.1}
            value={frameTime}
            disabled={disabled}
            onChange={(e) => onChange({ startTime, endTime, sampleRate, channels, frameTime: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      )}

      {/* Audio / Video Trim Controls */}
      {!isFrameExport && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Scissors className="w-3.5 h-3.5 text-cyan-400" />
            <span>Time Range Trim</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Start Time (s)</label>
              <input
                type="number"
                min={0}
                max={duration || 3600}
                step={0.5}
                value={startTime}
                disabled={disabled}
                onChange={(e) =>
                  onChange({
                    startTime: Math.max(0, parseFloat(e.target.value) || 0),
                    endTime,
                    sampleRate,
                    channels,
                    frameTime,
                  })
                }
                className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">End Time (s)</label>
              <input
                type="number"
                min={0}
                max={duration || 3600}
                step={0.5}
                value={activeEnd}
                disabled={disabled}
                onChange={(e) =>
                  onChange({
                    startTime,
                    endTime: Math.max(startTime, parseFloat(e.target.value) || 0),
                    sampleRate,
                    channels,
                    frameTime,
                  })
                }
                className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Audio Codec & Channel Settings */}
      {isAudio && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Sample Rate</label>
            <select
              value={sampleRate}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  startTime,
                  endTime,
                  sampleRate: parseInt(e.target.value, 10),
                  channels,
                  frameTime,
                })
              }
              className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value={44100} className="bg-slate-900">44.1 kHz (CD Quality)</option>
              <option value={48000} className="bg-slate-900">48.0 kHz (Studio/Video)</option>
              <option value={22050} className="bg-slate-900">22.05 kHz (Compact)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Channels</label>
            <select
              value={channels}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  startTime,
                  endTime,
                  sampleRate,
                  channels: parseInt(e.target.value, 10),
                  frameTime,
                })
              }
              className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value={2} className="bg-slate-900">Stereo (2 Channels)</option>
              <option value={1} className="bg-slate-900">Mono (1 Channel)</option>
            </select>
          </div>
        </div>
      )}

      {/* Estimate & Disclosure Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <span>Estimated Output Size: ~{(estimatedSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
        <span className="text-slate-500 font-mono">100% Local Decoding</span>
      </div>
    </div>
  );
};

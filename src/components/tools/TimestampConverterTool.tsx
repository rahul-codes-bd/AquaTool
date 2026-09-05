import React, { useState, useEffect, useMemo } from 'react';
import { CryptoTools } from '../../services/cryptoTools';
import { CopyButton } from '../common/CopyButton';
import { ErrorAlert } from '../common/ErrorAlert';
import { Clock, Play, Pause, Shield, Calendar } from 'lucide-react';

export const TimestampConverterTool: React.FC = () => {
  const [currentUnix, setCurrentUnix] = useState(() => Math.floor(Date.now() / 1000));
  const [isLive, setIsLive] = useState(true);

  // Conversion inputs
  const [inputUnix, setInputUnix] = useState<string>(() => Math.floor(Date.now() / 1000).toString());
  const [inputIso, setInputIso] = useState<string>(() => new Date().toISOString());

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setCurrentUnix(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  const parsedUnixResult = useMemo(() => {
    if (!inputUnix.trim()) return null;
    try {
      return { data: CryptoTools.parseTimestamp(inputUnix), error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Invalid Unix timestamp.' };
    }
  }, [inputUnix]);

  const parsedIsoResult = useMemo(() => {
    if (!inputIso.trim()) return null;
    try {
      return { data: CryptoTools.parseTimestamp(inputIso), error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Invalid date string or ISO format.' };
    }
  }, [inputIso]);

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-3">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong>Local Epoch Timing:</strong> All timezone and UTC epoch conversions are calculated on-device using high-precision JavaScript Date primitives without contacting any remote time servers.
        </p>
      </div>

      {/* Current live ticker */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Current Unix Epoch (Seconds)
            </span>
            <p className="text-2xl font-bold font-mono text-cyan-300">{currentUnix}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInputUnix(currentUnix.toString())}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900 transition-colors"
          >
            Use in Converter
          </button>
          <button
            type="button"
            onClick={() => setIsLive(!isLive)}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            aria-label={isLive ? 'Pause live timestamp' : 'Resume live timestamp'}
          >
            {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <CopyButton textToCopy={currentUnix.toString()} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unix to Date */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Epoch Timestamp → Human Date
          </h4>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400">Unix Timestamp (Seconds or Milliseconds)</label>
              <button
                type="button"
                onClick={() => setInputUnix('')}
                className="text-[11px] text-slate-400 hover:text-rose-400"
              >
                Clear
              </button>
            </div>
            <input
              type="text"
              value={inputUnix}
              onChange={(e) => setInputUnix(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-cyan-300 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
              placeholder="e.g. 1714567890 or 1714567890000"
            />
          </div>

          {parsedUnixResult?.error && <ErrorAlert message={parsedUnixResult.error} />}

          {parsedUnixResult?.data && (
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">ISO 8601 UTC</span>
                  <p className="font-mono text-cyan-300 font-semibold">{parsedUnixResult.data.isoUtc}</p>
                </div>
                <CopyButton textToCopy={parsedUnixResult.data.isoUtc} />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Local Browser Time ({parsedUnixResult.data.timezoneOffset})</span>
                  <p className="font-semibold text-slate-200">{parsedUnixResult.data.localFormatted}</p>
                </div>
                <CopyButton textToCopy={parsedUnixResult.data.localFormatted} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400">Day of Week</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{parsedUnixResult.data.dayOfWeek}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400">Relative Time</span>
                  <p className="font-semibold text-cyan-400 mt-0.5">{parsedUnixResult.data.relativeTime}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Date to Unix */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Human Date String → Epoch Timestamp
          </h4>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400">ISO Date, RFC 2822, or Date String</label>
              <button
                type="button"
                onClick={() => setInputIso('')}
                className="text-[11px] text-slate-400 hover:text-rose-400"
              >
                Clear
              </button>
            </div>
            <input
              type="text"
              value={inputIso}
              onChange={(e) => setInputIso(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-cyan-300 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
              placeholder="e.g. 2026-05-01T12:00:00Z or May 1, 2026"
            />
          </div>

          {parsedIsoResult?.error && <ErrorAlert message={parsedIsoResult.error} />}

          {parsedIsoResult?.data && (
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Epoch Seconds</span>
                  <p className="font-mono text-cyan-300 font-bold">{parsedIsoResult.data.unixSeconds}</p>
                </div>
                <CopyButton textToCopy={parsedIsoResult.data.unixSeconds.toString()} />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Epoch Milliseconds</span>
                  <p className="font-mono text-cyan-300 font-bold">{parsedIsoResult.data.unixMilliseconds}</p>
                </div>
                <CopyButton textToCopy={parsedIsoResult.data.unixMilliseconds.toString()} />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Normalized ISO 8601</span>
                  <p className="font-mono text-slate-300">{parsedIsoResult.data.isoUtc}</p>
                </div>
                <CopyButton textToCopy={parsedIsoResult.data.isoUtc} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

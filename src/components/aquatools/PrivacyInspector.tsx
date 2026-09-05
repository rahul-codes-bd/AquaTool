import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { ImageEngine } from '../../services/imageEngine';
import { ImageMetadataReport } from '../../types/image';

interface PrivacyInspectorProps {
  currentFile?: File | null;
}

export const PrivacyInspector: React.FC<PrivacyInspectorProps> = ({ currentFile }) => {
  const [report, setReport] = useState<ImageMetadataReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentFile) return;
    setIsLoading(true);
    ImageEngine.extractMetadata(currentFile)
      .then(setReport)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentFile]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Privacy-first Image Inspector</span>
        </div>
        <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Zero Server Upload</span>
        </div>
      </div>
      <p className="text-xs text-slate-400">Deep audit of EXIF tags, GPS coordinates, and hardware serial identifiers processed entirely in browser memory.</p>

      {isLoading && <div className="text-xs text-slate-400">Inspecting image headers...</div>}

      {report && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-xs font-semibold text-white">Audit Summary</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5">
                <div className="text-slate-400 text-[10px]">EXIF Tags Found</div>
                <div className="text-white font-mono font-bold">{report.exifTags.length}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5">
                <div className="text-slate-400 text-[10px]">GPS Coordinates</div>
                <div className={`font-bold ${report.gps ? 'text-rose-400' : 'text-emerald-400'}`}>{report.gps ? 'Detected' : 'Clean'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5">
                <div className="text-slate-400 text-[10px]">Alpha Transparency</div>
                <div className="text-white font-bold">{report.hasAlphaChannel ? 'Yes' : 'No'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5">
                <div className="text-slate-400 text-[10px]">MIME Type</div>
                <div className="text-white font-mono">{report.mimeType}</div>
              </div>
            </div>
          </div>

          {report.gps && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Privacy Risk: GPS Location Embedded</span>
              </div>
              <p className="font-mono text-xs">Latitude: {report.gps.latitude}, Longitude: {report.gps.longitude}</p>
            </div>
          )}

          {!report.gps && report.exifTags.length === 0 && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No privacy leaks found. Image metadata is clean.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

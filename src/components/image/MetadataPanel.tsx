import React, { useState } from 'react';
import { Info, ShieldCheck, MapPin, Camera, Calendar, Hash, CheckCircle2, AlertTriangle, ShieldAlert, Eye, Lock } from 'lucide-react';
import { ImageMetadataReport } from '../../types/image';

interface MetadataPanelProps {
  metadata?: ImageMetadataReport;
  onStripExif?: () => void;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ metadata, onStripExif }) => {
  const [showWarningModal, setShowWarningModal] = useState(false);

  if (!metadata) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center text-slate-400 text-xs">
        No image metadata loaded.
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Sanitize text values for display
  const sanitize = (str?: string) => {
    if (!str) return 'N/A';
    return str.replace(/[<>]/g, '');
  };

  const handleStripClick = () => {
    setShowWarningModal(true);
  };

  const confirmStrip = () => {
    setShowWarningModal(false);
    if (onStripExif) onStripExif();
  };

  return (
    <div className="bg-slate-950/70 border border-white/10 rounded-3xl p-5 backdrop-blur-xl space-y-5 shadow-2xl">
      {/* Header & Privacy Guarantee */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Image Privacy & Metadata Inspector</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>100% Transient (Zero Persistence)</span>
          </div>

          {onStripExif && (
            <button
              type="button"
              onClick={handleStripClick}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all text-xs font-medium flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Scrub Metadata</span>
            </button>
          )}
        </div>
      </div>

      {/* Warning Modal for Metadata Removal */}
      {showWarningModal && (
        <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-200 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 font-semibold text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Warning: Potential Orientation & Color Profile Changes</span>
          </div>
          <p className="text-[11px] text-amber-100/90 leading-relaxed">
            Removing metadata will permanently strip embedded camera EXIF orientation tags, timestamps, device make/model identifiers, and embedded ICC color profiles. If your camera recorded the image in portrait or landscape rotation using orientation flags rather than physical pixel rotation, the exported image may display in its raw unrotated sensor orientation.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowWarningModal(false)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmStrip}
              className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold text-xs"
            >
              Proceed & Scrub Metadata
            </button>
          </div>
        </div>
      )}

      {/* Basic Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-[10px] text-slate-400 font-medium">Dimensions</p>
          <p className="text-xs font-mono font-bold text-white mt-0.5">
            {metadata.dimensions.width} × {metadata.dimensions.height}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-[10px] text-slate-400 font-medium">File Size</p>
          <p className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
            {formatBytes(metadata.fileSizeBytes)}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-[10px] text-slate-400 font-medium">Aspect Ratio</p>
          <p className="text-xs font-mono font-bold text-teal-300 mt-0.5">
            {metadata.aspectRatioLabel || `${metadata.aspectRatio}:1`}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-[10px] text-slate-400 font-medium">Resolution</p>
          <p className="text-xs font-mono font-bold text-indigo-300 mt-0.5">
            {metadata.megapixels} MP
          </p>
        </div>
      </div>

      {/* Transparent Asset Validator & Orientation Correction Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Transparent Asset Validator</span>
          </div>
          <p className="text-[11px] text-slate-300">
            {metadata.hasAlphaChannel
              ? 'Format supports alpha transparency channel (PNG / WebP / SVG).'
              : 'Format uses opaque container (JPEG / BMP / AVIF without alpha).'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Camera className="w-3.5 h-3.5 text-teal-400" />
            <span>Orientation & Sensor Correction</span>
          </div>
          <p className="text-[11px] text-slate-300">
            {metadata.exifTags.some((t) => t.name.toLowerCase().includes('orientation'))
              ? 'EXIF orientation tag detected. Canvas normalized.'
              : 'Standard landscape orientation or normalized pixel layout.'}
          </p>
        </div>
      </div>

      {/* GPS & EXIF Display */}
      {metadata.gps && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-rose-300 font-semibold">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>Embedded GPS Coordinates Detected</span>
          </div>
          <p className="font-mono text-slate-200 text-xs">
            Latitude: {metadata.gps.latitude.toFixed(6)}, Longitude: {metadata.gps.longitude.toFixed(6)}
          </p>
          <a
            href={`https://www.google.com/maps?q=${metadata.gps.latitude},${metadata.gps.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 text-[11px] underline font-medium pt-1"
          >
            <span>Preview location in Maps (External)</span>
          </a>
        </div>
      )}

      {/* EXIF Data Fields */}
      {metadata.exifTags.length > 0 ? (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-semibold text-slate-300">Embedded EXIF Header Tags (Sanitized)</h4>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-xs">
            {metadata.exifTags.map((tag, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300"
              >
                <span className="font-medium text-slate-400">{sanitize(tag.name)}</span>
                <span className="font-mono text-cyan-200">{sanitize(String(tag.value))}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Clean image! No private EXIF tags, GPS coords, or device identifiers found.</span>
        </div>
      )}
    </div>
  );
};


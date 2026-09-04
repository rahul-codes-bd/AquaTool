import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Presentation,
  Shield,
  Clock,
  ExternalLink,
  CheckCircle2,
  Terminal,
  Laptop,
  Layers,
} from 'lucide-react';

interface OfficeConvertNoticeToolProps {
  format?: 'word' | 'excel' | 'powerpoint' | 'generic';
}

export function OfficeConvertNoticeTool({ format = 'word' }: OfficeConvertNoticeToolProps) {
  const getFormatDetails = () => {
    switch (format) {
      case 'excel':
        return {
          name: 'Excel to PDF (.xlsx / .xls)',
          icon: FileSpreadsheet,
          color: 'text-emerald-400',
          desc: 'Convert spreadsheets and tables to PDF without server uploads.',
          app: 'Microsoft Excel / Apple Numbers / LibreOffice Calc',
        };
      case 'powerpoint':
        return {
          name: 'PowerPoint to PDF (.pptx / .ppt)',
          icon: Presentation,
          color: 'text-amber-400',
          desc: 'Convert presentation slides to PDF with zero cloud tracking.',
          app: 'Microsoft PowerPoint / Apple Keynote / LibreOffice Impress',
        };
      case 'word':
      default:
        return {
          name: 'Word to PDF (.docx / .doc)',
          icon: FileText,
          color: 'text-blue-400',
          desc: 'Convert rich text documents into standard PDF format locally.',
          app: 'Microsoft Word / Apple Pages / LibreOffice Writer',
        };
    }
  };

  const details = getFormatDetails();
  const Icon = details.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Icon className={`w-5 h-5 ${details.color}`} />
            {details.name}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{details.desc}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero Server Uploads</span>
        </div>
      </div>

      {/* Honest Privacy & WASM Status Notice */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
          <Clock className="w-5 h-5" />
          <span>Why does AquaTools not convert Office files via cloud APIs?</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Proprietary Microsoft Office formats (.docx, .xlsx, .pptx) contain proprietary font metrics and XML layout schemas. Typical "Free online converters" upload your confidential business files, contracts, and spreadsheets to unsecured third-party cloud servers.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          AquaTools maintains a strict privacy guarantee: <strong className="text-slate-200">No user file is ever uploaded to a remote backend</strong>. We are actively engineering a sandboxed WebAssembly port of LibreOffice Core to render Office layouts locally in browser WebAssembly memory.
        </p>
      </div>

      {/* Local Native Offline Conversion Guides */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Laptop className="w-4 h-4 text-cyan-400" />
          <span>Privacy-Preserving Offline Conversion Methods (Available Right Now)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Method 1: Microsoft Office / Apple Native */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Native Office &quot;Save as PDF&quot;</span>
            </div>
            <ol className="text-[11px] text-slate-400 space-y-1 list-decimal pl-4">
              <li>Open your file in {details.app}.</li>
              <li>
                Click <strong>File</strong> &rarr; <strong>Save As / Export</strong>.
              </li>
              <li>
                Choose <strong>PDF (*.pdf)</strong> as format and click <strong>Save</strong>.
              </li>
            </ol>
          </div>

          {/* Method 2: System Print to PDF */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Universal &quot;Print to PDF&quot; (Windows/Mac/Linux)</span>
            </div>
            <ol className="text-[11px] text-slate-400 space-y-1 list-decimal pl-4">
              <li>Open document in any editor or browser.</li>
              <li>
                Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-200">Ctrl + P</kbd> / <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-200">Cmd + P</kbd>.
              </li>
              <li>
                Set Printer Destination to <strong>&quot;Save as PDF&quot;</strong>.
              </li>
            </ol>
          </div>

          {/* Method 3: LibreOffice Offline CLI */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>LibreOffice Local Terminal CLI</span>
            </div>
            <div className="bg-black/50 p-2 rounded-lg font-mono text-[10px] text-slate-300 overflow-x-auto">
              soffice --headless --convert-to pdf document.docx
            </div>
          </div>

          {/* Method 4: Once converted, use AquaTools */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Edit with AquaTools PDF Workstation</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Once you have your PDF, drop it into AquaTools to merge, compress, protect, annotate, watermark, or reorganize pages with complete in-browser privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

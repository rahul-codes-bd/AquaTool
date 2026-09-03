import React from 'react';
import { FILE_CONVERSION_TOOLS } from '../../registry/fileConvRegistry';
import { Check, Clock, ShieldAlert } from 'lucide-react';

export const ConversionMatrix: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md">
      <h3 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
        <span>Valid Conversion Matrix</span>
        <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          Client-Side Verified
        </span>
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Capability matrix dynamically generated from registered client-side parsers and encoders.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
              <th className="py-2.5 px-3">Tool Name</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Input Formats</th>
              <th className="py-2.5 px-3">Output Formats</th>
              <th className="py-2.5 px-3">Mode</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
            {FILE_CONVERSION_TOOLS.map((tool) => (
              <tr key={tool.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-100">{tool.title}</td>
                <td className="py-2.5 px-3 text-cyan-400 capitalize">{tool.category}</td>
                <td className="py-2.5 px-3 text-slate-400 truncate max-w-[150px]">
                  {tool.acceptedExtensions.join(', ').toUpperCase()}
                </td>
                <td className="py-2.5 px-3 text-emerald-400 truncate max-w-[150px]">
                  {tool.outputFormats.join(', ').toUpperCase()}
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                    {tool.processingMode}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  {tool.status === 'ready' && (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-sans font-semibold">
                      <Check className="w-3.5 h-3.5" /> Ready
                    </span>
                  )}
                  {tool.status === 'beta' && (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-sans font-semibold">
                      <Clock className="w-3.5 h-3.5" /> Beta
                    </span>
                  )}
                  {tool.status === 'coming-soon' && (
                    <span className="inline-flex items-center gap-1 text-slate-500 font-sans font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5" /> Coming Soon
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

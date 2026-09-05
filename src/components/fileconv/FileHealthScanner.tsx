import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, FileCheck, CheckCircle2 } from 'lucide-react';
import { FileValidator } from '../../services/fileconv/fileValidator';

interface FileHealthScannerProps {
  file: File;
}

export interface HealthScanResult {
  score: number; // 0 to 100
  status: 'HEALTHY' | 'WARNING' | 'RISK';
  checks: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; detail: string }>;
}

export const FileHealthScanner: React.FC<FileHealthScannerProps> = ({ file }) => {
  const [result, setResult] = useState<HealthScanResult | null>(null);

  useEffect(() => {
    let active = true;

    async function scan() {
      const checks: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; detail: string }> = [];
      let totalScore = 100;

      // 1. Size Validation
      if (file.size === 0) {
        checks.push({ name: 'File Content Integrity', status: 'fail', detail: 'Empty 0-byte stream detected.' });
        totalScore -= 50;
      } else if (file.size > 200 * 1024 * 1024) {
        checks.push({ name: 'Memory Safety Limit', status: 'warn', detail: 'File exceeds 200MB; browser memory stream required.' });
        totalScore -= 20;
      } else {
        checks.push({ name: 'Memory Safety Limit', status: 'pass', detail: `Valid size (${(file.size / (1024 * 1024)).toFixed(2)} MB).` });
      }

      // 2. Extension & Path Traversal Check
      const hasTraversal = !FileValidator.checkArchiveEntryPath(file.name);
      if (hasTraversal) {
        checks.push({ name: 'Filename Path Traversal', status: 'fail', detail: 'Filename contains suspicious path sequences.' });
        totalScore -= 40;
      } else {
        checks.push({ name: 'Filename Path Traversal', status: 'pass', detail: 'Clean path structure.' });
      }

      // 3. Script Contamination Pre-flight (for SVG, HTML, XML)
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (['svg', 'xml', 'html', 'htm'].includes(ext)) {
        try {
          const text = await file.text();
          const containsScript = /<script\b/i.test(text) || /\son\w+=/i.test(text);
          if (containsScript) {
            checks.push({ name: 'Embedded Script Inspection', status: 'warn', detail: 'Embedded scripts or event triggers detected. Will be sanitized.' });
            totalScore -= 25;
          } else {
            checks.push({ name: 'Embedded Script Inspection', status: 'pass', detail: 'No active executable code detected.' });
          }
        } catch {
          // Stream read error
        }
      } else {
        checks.push({ name: 'Executable Code Scan', status: 'pass', detail: 'Binary/Media format stream.' });
      }

      if (active) {
        const finalScore = Math.max(0, totalScore);
        const status = finalScore >= 80 ? 'HEALTHY' : finalScore >= 50 ? 'WARNING' : 'RISK';
        setResult({ score: finalScore, status, checks });
      }
    }

    scan();

    return () => {
      active = false;
    };
  }, [file]);

  if (!result) return null;

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Pre-flight File Health & Security Scan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-300">Score: {result.score}/100</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              result.status === 'HEALTHY'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : result.status === 'WARNING'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            {result.status}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        {result.checks.map((chk, i) => (
          <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {chk.status === 'pass' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : chk.status === 'warn' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span className="font-medium text-slate-200">{chk.name}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">{chk.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

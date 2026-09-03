import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle, FileCheck, EyeOff, Info, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface PdfSecurityDisclaimersProps {
  toolType?: 'protect' | 'unlock' | 'metadata' | 'password' | 'general' | 'signature';
  compact?: boolean;
}

export const PdfSecurityDisclaimers: React.FC<PdfSecurityDisclaimersProps> = ({
  toolType = 'general',
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Privacy, Security & Legal Disclaimers
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Client-Side
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Zero server telemetry, zero storage persistence, and strict cryptographic transparency.
            </p>
          </div>
        </div>

        {compact && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800/80">
          {/* Item 1: Local volatile memory execution */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zero Storage & Telemetry</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Passwords, secret keys, and decrypted content reside purely in volatile browser RAM. They are <strong>never</strong> recorded in <code className="text-cyan-300">localStorage</code>, <code className="text-cyan-300">IndexedDB</code>, cookies, URL parameters, or network logs.
            </p>
          </div>

          {/* Item 2: No Cracking or Bypassing */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>No Password Cracking Policy</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              AquaTools adheres to responsible security standards. We do <strong>not</strong> implement brute-force dictionary attacks, hash recovery, or unauthorized password bypasses. Document unlocking strictly requires the authentic password.
            </p>
          </div>

          {/* Item 3: Legal Signature Notice */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Signature & Compliance Notice</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Visual signatures and stamps created here are graphical representations. They do <strong>not</strong> include X.509 PKI cryptographic certificates or constitute Qualified Electronic Signatures (QES) under eIDAS or ESIGN Act regulations.
            </p>
          </div>

          {/* Item 4: Web Crypto CSPRNG */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
              <span>Web Crypto API & Sanitization</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              All random numbers and entropy are generated via <code className="text-emerald-300">crypto.getRandomValues</code> CSPRNG. Metadata removal scrubs all author tags, modification dates, and creator fingerprints directly in memory.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

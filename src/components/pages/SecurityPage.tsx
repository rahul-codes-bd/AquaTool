import React from 'react';
import {
  Shield,
  Key,
  Cpu,
  Trash2,
  CheckCircle2,
  FileLock2,
  Code2,
  Zap,
  Lock,
  Boxes,
  AlertOctagon,
  Eye,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';

export const SecurityPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-8 space-y-4 border-cyan-500/20 text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_30px_rgba(6,182,212,0.3)]">
          <FileLock2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Security Architecture & Threat Model
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
          How {APP_CONFIG.name} ensures memory isolation, hardware-accelerated cryptography, and cross-site scripting (XSS) defense without cloud dependencies.
        </p>
      </div>

      {/* 4 Core Pillars of Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-100">Browser-Sandboxed Execution</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            All code runs inside the browser’s standard JavaScript & WebAssembly security sandbox. The application operates under strict origin isolation and has no access to your file system beyond the specific files you explicitly select via the HTML5 File Dropzone.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Key className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-100">Hardware Web Crypto CSPRNG</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            All random identifiers (UUID v4), passphrases, PINs, and cryptographic hash digests (SHA-256, SHA-512) are computed using <code>window.crypto.getRandomValues()</code> and <code>window.crypto.subtle</code>, backed by the operating system’s cryptographic entropy pool.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-100">Proactive Object URL Revocation</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            To prevent confidential data lingering in browser RAM, all generated Blob URLs (<code>blob:https://...</code>) are explicitly released with <code>URL.revokeObjectURL()</code> as soon as files are closed or reset, returning memory immediately to browser garbage collection.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Code2 className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-100">Strict Iframe & Preview Sandboxing</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            All interactive HTML, SVG, and code previews are rendered inside sandboxed iframes (<code>sandbox="allow-scripts"</code> without <code>allow-same-origin</code>) or escaped text containers, preventing untrusted scripts from accessing parent DOM, cookies, or storage.
          </p>
        </div>
      </div>

      {/* Cryptographic Standards */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border-cyan-500/20">
        <h2 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span>Cryptographic Primitives & Specifications</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
            <div className="text-cyan-400 font-mono font-bold">UUID v4 (RFC 4122)</div>
            <div className="text-slate-400">122 bits of CSPRNG entropy via Web Crypto Uint8Array buffers.</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
            <div className="text-cyan-400 font-mono font-bold">SHA-256 / SHA-512</div>
            <div className="text-slate-400">FIPS 180-4 secure hashing standard via native SubtleCrypto engine.</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
            <div className="text-cyan-400 font-mono font-bold">Diceware Entropy</div>
            <div className="text-slate-400">EFF wordlists with rejection sampling for unbiased password generation.</div>
          </div>
        </div>
      </div>

      {/* Threat Model & Mitigations */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Boxes className="w-4 h-4 text-cyan-400" />
          <span>Threat Analysis & Mitigations</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Threat: Data Interception in Transit (Man-in-the-Middle)</span>
            </div>
            <p className="text-slate-400 leading-relaxed pl-6">
              <strong>Mitigation:</strong> There is no data in transit. File payloads, text inputs, and converted outputs never leave the user's browser, eliminating interception vectors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Threat: Cross-Site Scripting (XSS) via File Ingestion</span>
            </div>
            <p className="text-slate-400 leading-relaxed pl-6">
              <strong>Mitigation:</strong> SVG files and user-provided HTML are either parsed via isolated DOMParser with script stripping or executed within isolated iframes with restricted sandboxing (no <code>allow-same-origin</code> and no <code>allow-top-navigation</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Threat: Malicious Third-Party Scripts / Telemetry Leakage</span>
            </div>
            <p className="text-slate-400 leading-relaxed pl-6">
              <strong>Mitigation:</strong> Zero external third-party tracking scripts, advertising trackers, or telemetry beacons are embedded in the application bundle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

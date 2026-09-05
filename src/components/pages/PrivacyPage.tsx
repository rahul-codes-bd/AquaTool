import React from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  ServerOff,
  WifiOff,
  Terminal,
  CheckCircle2,
  XCircle,
  Database,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Hero Header */}
      <div className="glass-panel rounded-3xl p-8 space-y-4 border-cyan-500/20 text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto shadow-[0_0_30px_rgba(20,184,166,0.3)]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Privacy Policy & In-Browser Guarantee
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
          {APP_CONFIG.name} is designed to process supported files locally in your browser and does not intentionally upload file contents to a backend server.
          <strong className="text-cyan-300"> Local in-browser processing. Zero server uploads. Zero telemetry.</strong>
        </p>
      </div>

      {/* Core Privacy Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ServerOff className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">Zero Server Uploads</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unlike traditional conversion sites that upload your confidential PDFs, contracts, employee records, and private images to remote backend servers, {APP_CONFIG.name} executes all conversions inside your local device's JavaScript engine and WebAssembly runtime.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">Zero Tracking or Analytics</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            There are no Google Analytics, tracking pixels, Facebook Pixel, advertising SDKs, session replay recorders (e.g. Hotjar), or fingerprinting cookies installed. Your usage habits remain strictly private to you.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">No Login or Accounts</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            You do not need to register, create an account, enter an email address, or provide billing details. All utilities are immediately unlocked and available without authorization gates.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <WifiOff className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">100% Offline Capability</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Once loaded in your browser cache, you can disconnect your network (enable Airplane Mode) and convert files, generate passwords, format code, and merge PDFs without needing internet access.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Architecture Comparison: {APP_CONFIG.name} vs. Traditional Converters</span>
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3">Privacy Dimension</th>
                <th className="p-3 text-cyan-400">{APP_CONFIG.name} (Client-Side)</th>
                <th className="p-3 text-rose-400">Standard Online Converters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-3 font-semibold text-slate-200">Where files are processed</td>
                <td className="p-3 text-cyan-300">Your browser's local RAM</td>
                <td className="p-3 text-slate-400">Remote cloud servers</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-200">Network egress / uploads</td>
                <td className="p-3 text-emerald-400 font-bold">0 Bytes (Zero)</td>
                <td className="p-3 text-rose-300">Full file uploaded over HTTP</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-200">Data retention on disk</td>
                <td className="p-3 text-emerald-400 font-bold">Never stored on any server</td>
                <td className="p-3 text-rose-300">Stored on cloud disks for 1-24 hours</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-200">Third-party telemetry</td>
                <td className="p-3 text-emerald-400 font-bold">None (0 trackers)</td>
                <td className="p-3 text-rose-300">Analytics, advertising trackers, cookies</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-200">Offline functionality</td>
                <td className="p-3 text-emerald-400 font-bold">Works 100% in Airplane mode</td>
                <td className="p-3 text-rose-300">Fails without internet connection</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Storage Policy Breakdown */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Local Storage Policy Disclosure</span>
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          {APP_CONFIG.name} only uses your browser's local <code>localStorage</code> for your explicitly selected user preferences. Here is our complete, transparent storage inventory:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>What We Store Locally (Small metadata only)</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>Theme preference (<code>dark</code> / <code>light</code> / <code>system</code>)</li>
              <li>Reduced motion preference</li>
              <li>List of favorited tool slug identifiers (e.g. <code>["image-converter"]</code>)</li>
              <li>Optional list of recently visited tool slugs (if enabled)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-500/30 space-y-2">
            <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>What We NEVER Store (0 Bytes)</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>No document or file contents</li>
              <li>No uploaded image or PDF blobs</li>
              <li>No generated passwords, PINs, or hash values</li>
              <li>No personal information, IP addresses, or location data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* How to verify in DevTools */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border-cyan-500/30">
        <h2 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span>How to Verify Our Privacy Guarantee Yourself</span>
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          You don't need to trust our claims blindly. Modern web browsers provide built-in developer tools that reveal every byte sent over the network:
        </p>

        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">
              1
            </span>
            <div className="text-xs text-slate-300 leading-relaxed">
              Open your browser's Developer Tools by pressing <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">F12</kbd> (Windows/Linux) or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">Cmd + Option + I</kbd> (macOS).
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">
              2
            </span>
            <div className="text-xs text-slate-300 leading-relaxed">
              Navigate to the <strong>Network</strong> tab in the DevTools window and check the <strong>Fetch/XHR</strong> filter.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">
              3
            </span>
            <div className="text-xs text-slate-300 leading-relaxed">
              Drop any sensitive PDF, contract, image, or text file into an AquaTools tool and click convert or format.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">
              4
            </span>
            <div className="text-xs text-emerald-300 font-semibold leading-relaxed">
              Confirm that exactly <strong>0 network requests</strong> are initiated. All computation occurred in your computer's local memory.
            </div>
          </div>
        </div>
      </div>

      {/* Privacy FAQ */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h3 className="font-semibold text-slate-200">Can AquaTools see my confidential documents?</h3>
            <p className="text-slate-400 leading-relaxed">
              No. We have no backend servers processing files. There is literally no database or storage server configured to receive files.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h3 className="font-semibold text-slate-200">Is it safe to convert financial PDFs and legal contracts here?</h3>
            <p className="text-slate-400 leading-relaxed">
              Yes. Because the document parsing is performed inside your local browser via WebAssembly and PDF-Lib, your files never traverse the internet.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h3 className="font-semibold text-slate-200">How do I purge all local data?</h3>
            <p className="text-slate-400 leading-relaxed">
              Visit the <a href="#settings" className="text-cyan-400 underline font-medium">Settings page</a> at any time and click <strong>Clear All Local Application Data</strong>. You can also inspect the exact stored keys and byte sizes in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Cross-Link Strip */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-200">Legal Agreement & Security Specifications</div>
          <p className="text-xs text-slate-400">Read our terms of service, as-is provisions, and sandbox isolation architecture.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="#terms"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700/80 transition-colors"
          >
            Terms & Conditions
          </a>
          <a
            href="#security"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-700/80 transition-colors"
          >
            Security Architecture
          </a>
        </div>
      </div>
    </div>
  );
};

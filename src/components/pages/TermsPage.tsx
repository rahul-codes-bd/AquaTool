import React from 'react';
import {
  FileText,
  ShieldCheck,
  Scale,
  Cpu,
  AlertTriangle,
  Lock,
  Code2,
  CheckCircle2,
  HelpCircle,
  HardDrive,
  Globe,
  Layers,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';

interface TermsPageProps {
  onNavigate?: (view: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  const lastUpdated = 'September 2026';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-8 space-y-4 border-cyan-500/20 text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_30px_rgba(6,182,212,0.25)]">
          <Scale className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
            LEGAL AGREEMENT &bull; LAST REVISED: {lastUpdated}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Terms & Conditions of Use
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully. By accessing or using {APP_CONFIG.name}, you agree to be bound by the conditions described herein governing client-side execution, data ownership, and limitations of liability.
          </p>
        </div>
      </div>

      {/* Quick Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 space-y-2 border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400">
            <HardDrive className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">100% Client-Side</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All file processing, cryptography, conversions, and format operations occur entirely within your local browser memory.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-2 border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Your Data is Yours</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            You retain 100% ownership and intellectual property rights of all files, documents, and code ingested or exported.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-2 border-slate-800">
          <div className="flex items-center gap-2 text-teal-400">
            <Cpu className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Provided &ldquo;As-Is&rdquo;</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Offered free of charge without warranties. Always verify critical cryptographic outputs and keep backups of source files.
          </p>
        </div>
      </div>

      {/* Terms Body Sections */}
      <div className="space-y-6">
        {/* Section 1 */}
        <section className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-100 pb-2 border-b border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
              1
            </span>
            <h2 className="text-sm font-semibold">Acceptance of Terms</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            By opening, browsing, or utilizing any component or utility of {APP_CONFIG.name} (the &ldquo;Service&rdquo;), you accept and agree to comply with these Terms and Conditions. If you do not agree with any part of these terms, you should discontinue using the application.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            These terms apply equally to all individual users, developers, systems engineers, organizations, and visitors accessing the platform across desktop and mobile devices.
          </p>
        </section>

        {/* Section 2 */}
        <section className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-100 pb-2 border-b border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
              2
            </span>
            <h2 className="text-sm font-semibold">Description of Service & Architecture</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {APP_CONFIG.name} provides a comprehensive suite of offline-first document utilities, image converters, cryptographic hash and token generators, code formatters, and developer productivity tools.
          </p>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-xs text-cyan-200/90 leading-relaxed space-y-2">
            <div className="font-semibold text-cyan-300 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>Architectural Guarantee:</span>
            </div>
            <p>
              Unlike legacy web converters, {APP_CONFIG.name} does <strong>not</strong> upload your files to any remote backend server. All computational transformations (PDF merging, image resizing, WebP encoding, hash calculation, JSON formatting) execute entirely on your device via standard browser Web APIs (HTML5 Canvas, Web Crypto, WebAssembly, and JavaScript runtimes).
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-100 pb-2 border-b border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
              3
            </span>
            <h2 className="text-sm font-semibold">User Data Ownership & Privacy</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You retain sole and exclusive intellectual property rights, copyright, and title to all documents, images, text snippets, and data that you process using the Service.
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>We do not claim any ownership, licensing, or commercial rights over content processed in your browser.</li>
            <li>No copies, telemetry, or diagnostic snapshots of your files are transmitted to our servers or third parties.</li>
            <li>Your browser&rsquo;s local storage is only utilized for user-selected UI settings (e.g., theme, bookmark identifiers), which you can clear at any time via the Settings page.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-100 pb-2 border-b border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
              4
            </span>
            <h2 className="text-sm font-semibold">Disclaimer of Warranties (&ldquo;As-Is&rdquo; Provision)</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Service and all associated utilities are provided on an <strong>&ldquo;AS IS&rdquo;</strong> and <strong>&ldquo;AS AVAILABLE&rdquo;</strong> basis without warranties of any kind, whether express, implied, statutory, or otherwise, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Critical Output Verification Advisory:</span>
            </div>
            <p>
              While all tools are built on rigorous algorithms (PDF-Lib, Web Crypto CSPRNG, lossless canvas pipelines), client-side memory limits, browser versions, and device hardware constraints can vary. Users are advised to verify critical outputs (such as cryptographic checksums, compressed production images, and legal document layouts) before deploying them in mission-critical or commercial production systems.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-100 pb-2 border-b border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
              5
            </span>
            <h2 className="text-sm font-semibold">Acceptable Use Policy</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You agree to use {APP_CONFIG.name} in compliance with all applicable local, state, national, and international laws, statutes, and regulations. You agree NOT to:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-rose-300">&times; Malicious Activity</span>
              <p className="text-slate-400">Use generated files, payloads, or formatters to author, transmit, or distribute malware, spyware, or malicious payloads.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-rose-300">&times; Infrastructure Abuse</span>
              <p className="text-slate-400">Attempt to flood, disrupt, or launch denial-of-service attacks against the web application host infrastructure.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-rose-300">&times; Copyright Infringement</span>
              <p className="text-slate-400">Convert, alter, or remove copyright watermarks from intellectual property you do not possess legal authorization to modify.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-rose-300">&times; Misrepresentation</span>
              <p className="text-slate-400">Falsely imply formal endorsement or affiliation between your transformed assets and {APP_CONFIG.name}.</p>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-100 pb-2 border-b border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
              6
            </span>
            <h2 className="text-sm font-semibold">Limitation of Liability</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In no event shall the creators, developers, contributors, or hosting providers of {APP_CONFIG.name} be liable for any direct, indirect, incidental, special, consequential, or punitive damages (including, without limitation, loss of data, loss of profits, business interruption, or corruption of local files) arising out of or in connection with your use or inability to use the tools.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Because all file manipulations happen locally in your web browser, it is solely the user&rsquo;s responsibility to maintain secure off-site backups of all original source files prior to destructive or irreversible in-place operations.
          </p>
        </section>

        {/* Section 7 */}
        <section className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-100 pb-2 border-b border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
              7
            </span>
            <h2 className="text-sm font-semibold">Open Source Software & Third-Party Dependencies</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The application incorporates reliable open-source libraries (including PDF-Lib, JSZip, PapaParse, and Lucide React). These components are licensed under their respective MIT, Apache 2.0, or BSD licenses. You agree to respect the individual licensing terms governing each respective library.
          </p>
        </section>

        {/* Section 8 */}
        <section className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-100 pb-2 border-b border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
              8
            </span>
            <h2 className="text-sm font-semibold">Modifications to Terms & Services</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            We reserve the right to revise, modify, or update these Terms and Conditions at any time. When updates occur, the revision date at the top of this document will be updated. Continued use of the Service following published updates constitutes your agreement to the revised terms.
          </p>
        </section>

        {/* Section 9 */}
        <section className="glass-panel rounded-2xl p-6 space-y-3 border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-100 pb-2 border-b border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
              9
            </span>
            <h2 className="text-sm font-semibold">Questions & Feedback</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            If you have any questions, legal inquiries, or architectural feedback regarding these Terms and Conditions or our client-side processing practices, please visit our{' '}
            <a
              href="#contact"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('contact');
                }
              }}
              className="text-cyan-400 hover:text-cyan-300 underline font-semibold transition-colors"
            >
              Contact & Feedback Page
            </a>
            .
          </p>
        </section>
      </div>

      {/* Navigation Footer Strip */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-200">Related Legal & Privacy Resources</div>
          <p className="text-xs text-slate-400">Review our zero-upload guarantee and security architecture model.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="#privacy"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('privacy');
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700/80 transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#security"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('security');
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-700/80 transition-colors"
          >
            Security Model
          </a>
        </div>
      </div>
    </div>
  );
};

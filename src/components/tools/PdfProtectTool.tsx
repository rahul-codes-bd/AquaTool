import React, { useState } from 'react';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfCrypt } from '../../services/pdfCrypt';
import { CryptoTools } from '../../services/cryptoTools';
import { PdfDocumentSummary } from '../../types/pdf';
import { FileDropzone } from '../common/FileDropzone';
import { DownloadButton } from '../common/DownloadButton';
import { CopyButton } from '../common/CopyButton';
import { PdfSecurityDisclaimers } from './PdfSecurityDisclaimers';
import {
  Lock,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Copy,
  Edit3,
  Sparkles,
} from 'lucide-react';

export const PdfProtectTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<PdfDocumentSummary | null>(null);
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useSeparateOwner, setUseSeparateOwner] = useState(false);

  // Permissions
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(false);
  const [allowAnnotating, setAllowAnnotating] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [protectedResult, setProtectedResult] = useState<{
    downloadUrl: string;
    fileName: string;
    fileSizeBytes: number;
    pageCount: number;
  } | null>(null);

  // Calculate password strength
  const entropy = CryptoTools.calculateEntropy(userPassword);

  const handleFileSelect = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setErrorMsg(null);
    setProtectedResult(null);

    try {
      const s = await PdfEngine.inspectPdf(selected);
      setSummary(s);
      if (s.isEncrypted) {
        setErrorMsg('This document is already encrypted or password-protected.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to inspect PDF file.');
    }
  };

  const handleGeneratePassword = () => {
    const res = CryptoTools.generatePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
    });
    setUserPassword(res.password);
    setShowPassword(true);
  };

  const handleProtect = async () => {
    if (!file) {
      setErrorMsg('Please select a PDF file first.');
      return;
    }
    if (!userPassword.trim()) {
      setErrorMsg('Please specify a password to protect the document.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setProgressPct(10);
    setProgressMsg('Initializing cryptographic security cipher...');

    try {
      const result = await PdfCrypt.protectWithPassword(
        file,
        {
          userPassword: userPassword.trim(),
          ownerPassword: useSeparateOwner && ownerPassword.trim() ? ownerPassword.trim() : userPassword.trim(),
          allowPrinting,
          allowCopying,
          allowAnnotating,
        },
        (pct, msg) => {
          setProgressPct(pct);
          setProgressMsg(msg);
        }
      );

      setProtectedResult({
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
        fileSizeBytes: result.fileSizeBytes,
        pageCount: result.pageCount,
      });
      setIsProcessing(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to apply password protection.');
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSummary(null);
    setUserPassword('');
    setOwnerPassword('');
    setProtectedResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* File Selection */}
      {!file ? (
        <div className="space-y-4">
          <FileDropzone
            accept=".pdf,application/pdf"
            maxSizeMB={50}
            onFilesSelected={handleFileSelect}
            title="Upload PDF to Password Protect"
            subtitle="Encrypt your PDF document client-side with standard user password protection"
          />
          <PdfSecurityDisclaimers toolType="protect" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Header */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{file.name}</h3>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {summary?.pageCount || 'Unknown'} pages
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Choose Different File
            </button>
          </div>

          {/* Password Settings Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-slate-200">Set Document Password</h4>
              </div>

              <button
                type="button"
                onClick={handleGeneratePassword}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Generate Strong Password</span>
              </button>
            </div>

            {/* User Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                User Password (Required to Open PDF)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Enter a strong password to lock this PDF..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 pr-24 font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {userPassword && <CopyButton textToCopy={userPassword} />}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Meter */}
              {userPassword && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Strength: <strong className={entropy.color}>{entropy.level}</strong> ({entropy.entropyBits} bits)
                    </span>
                    <span className="text-slate-500">Crack Time: {entropy.crackTimeEstimate}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        entropy.score <= 1
                          ? 'bg-rose-500 w-1/4'
                          : entropy.score === 2
                          ? 'bg-amber-500 w-2/4'
                          : entropy.score === 3
                          ? 'bg-cyan-500 w-3/4'
                          : 'bg-emerald-500 w-full'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Separate Master / Owner Password Option */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={useSeparateOwner}
                  onChange={(e) => setUseSeparateOwner(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20"
                />
                <span>Set separate Master / Owner Password (for administrative permission changes)</span>
              </label>

              {useSeparateOwner && (
                <div className="pl-6 space-y-1">
                  <input
                    type="text"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Enter owner / master password..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500">
                    Owner password overrides document restrictions without changing the user viewing password.
                  </p>
                </div>
              )}
            </div>

            {/* Document Permissions */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-300">Document Usage Permissions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPrinting}
                    onChange={(e) => setAllowPrinting(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                  />
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">Allow Printing</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCopying}
                    onChange={(e) => setAllowCopying(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                  />
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">Allow Copying Text</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAnnotating}
                    onChange={(e) => setAllowAnnotating(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                  />
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">Allow Comments</span>
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{progressMsg}</span>
                <span className="text-cyan-400 font-semibold">{progressPct}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Result Card */}
          {protectedResult && (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-200">PDF Successfully Protected!</h4>
                  <p className="text-xs text-slate-400">
                    The document is encrypted with standard 128-bit security. Recipients must enter your password to view it.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <DownloadButton
                  url={protectedResult.downloadUrl}
                  fileName={protectedResult.fileName}
                  label="Download Protected PDF"
                />
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Protect Another Document
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!protectedResult && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleProtect}
                disabled={isProcessing || !userPassword.trim()}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
              >
                <Lock className="w-4 h-4" />
                <span>{isProcessing ? 'Encrypting PDF...' : 'Protect & Download PDF'}</span>
              </button>
            </div>
          )}

          {/* Disclaimers */}
          <PdfSecurityDisclaimers toolType="protect" compact />
        </div>
      )}
    </div>
  );
};

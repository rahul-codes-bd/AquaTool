import React, { useState } from 'react';
import { PdfCrypt } from '../../services/pdfCrypt';
import { FileDropzone } from '../common/FileDropzone';
import { DownloadButton } from '../common/DownloadButton';
import { PdfSecurityDisclaimers } from './PdfSecurityDisclaimers';
import {
  Unlock,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  FileText,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const PdfUnlockTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState<boolean | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unlockResult, setUnlockResult] = useState<{
    downloadUrl: string;
    fileName: string;
    fileSizeBytes: number;
    pageCount: number;
  } | null>(null);

  const handleFileSelect = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setErrorMsg(null);
    setUnlockResult(null);
    setPassword('');

    try {
      const buffer = await selected.arrayBuffer();
      const encrypted = await PdfCrypt.isPdfEncrypted(buffer);
      setIsEncrypted(encrypted);
    } catch {
      setIsEncrypted(true);
    }
  };

  const handleUnlock = async () => {
    if (!file) {
      setErrorMsg('Please select a PDF file first.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter the password to unlock this document.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setProgressPct(15);
    setProgressMsg('Verifying credentials and decrypting security stream...');

    try {
      const res = await PdfCrypt.unlockWithPassword(file, password.trim(), (pct, msg) => {
        setProgressPct(pct);
        setProgressMsg(msg);
      });

      if (res.success && res.downloadUrl && res.fileName) {
        setUnlockResult({
          downloadUrl: res.downloadUrl,
          fileName: res.fileName,
          fileSizeBytes: res.fileSizeBytes || 0,
          pageCount: res.pageCount || 1,
        });
      }
      setIsProcessing(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to unlock PDF. Please verify your password and try again.');
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword('');
    setIsEncrypted(null);
    setUnlockResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <div className="space-y-4">
          <FileDropzone
            accept=".pdf,application/pdf"
            maxSizeMB={50}
            onFilesSelected={handleFileSelect}
            title="Upload Locked PDF to Decrypt"
            subtitle="Remove password protection from your PDF when you know the authorized password"
          />
          <PdfSecurityDisclaimers toolType="unlock" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Header */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{file.name}</h3>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB •{' '}
                  <span className="text-amber-400 font-medium">Password Protected</span>
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

          {/* Password Prompt Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-semibold text-slate-200">Enter Document Password</h4>
            </div>
            <p className="text-xs text-slate-400">
              Provide the valid user or owner password for this document to decrypt and export an unencrypted copy.
            </p>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && password.trim() && !isProcessing) {
                      handleUnlock();
                    }
                  }}
                  placeholder="Enter authorized PDF password..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 pr-12 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
          {unlockResult && (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-200">PDF Successfully Unlocked!</h4>
                  <p className="text-xs text-slate-400">
                    Encryption and password restrictions have been completely removed from this {unlockResult.pageCount}-page document.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <DownloadButton
                  url={unlockResult.downloadUrl}
                  fileName={unlockResult.fileName}
                  label="Download Unlocked PDF"
                />
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Unlock Another File
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!unlockResult && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleUnlock}
                disabled={isProcessing || !password.trim()}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
              >
                <Unlock className="w-4 h-4" />
                <span>{isProcessing ? 'Decrypting...' : 'Unlock & Download Clean PDF'}</span>
              </button>
            </div>
          )}

          {/* Policy Callout & Disclaimers */}
          <PdfSecurityDisclaimers toolType="unlock" compact />
        </div>
      )}
    </div>
  );
};

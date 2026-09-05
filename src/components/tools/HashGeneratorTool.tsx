import React, { useState } from 'react';
import { CryptoTools, HashAlgorithm } from '../../services/cryptoTools';
import { CopyButton } from '../common/CopyButton';
import { FileDropzone } from '../common/FileDropzone';
import { Hash, Shield, FileCode, Check } from 'lucide-react';

export const HashGeneratorTool: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState('AquaTools Privacy First Browser Utility Platform');
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [isHashing, setIsHashing] = useState(false);
  const [fileName, setFileName] = useState('');

  const generateTextHashes = async (text: string) => {
    setInputText(text);
    if (!text) {
      setHashes({});
      return;
    }
    const [sha256, sha384, sha512] = await Promise.all([
      CryptoTools.hashText(text, 'SHA-256'),
      CryptoTools.hashText(text, 'SHA-384'),
      CryptoTools.hashText(text, 'SHA-512'),
    ]);
    setHashes({ 'SHA-256': sha256, 'SHA-384': sha384, 'SHA-512': sha512 });
  };

  React.useEffect(() => {
    if (mode === 'text') {
      generateTextHashes(inputText);
    }
  }, [mode]);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFileName(f.name);
    setIsHashing(true);

    try {
      const [sha256, sha384, sha512] = await Promise.all([
        CryptoTools.hashFile(f, 'SHA-256'),
        CryptoTools.hashFile(f, 'SHA-384'),
        CryptoTools.hashFile(f, 'SHA-512'),
      ]);
      setHashes({ 'SHA-256': sha256, 'SHA-384': sha384, 'SHA-512': sha512 });
    } catch (e) {
      console.error(e);
    } finally {
      setIsHashing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy & Hashing vs Encryption Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-3">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong>Local Web Crypto Execution:</strong> Digests are computed in-memory via the native browser <code>window.crypto.subtle.digest</code> API. No data or files ever leave your machine.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-3">
          <Hash className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-0.5">Hashing vs. Encryption:</strong>
            <span className="text-indigo-300/90">
              <strong>Hashing</strong> is a one-way, irreversible mathematical digest (fixed-size fingerprint). It cannot be "decrypted". <strong>Encryption</strong> is a two-way reversible cipher (e.g., AES-GCM) that scrambles data with a secret key so it can be decrypted later.
            </span>
          </div>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('text');
              setHashes({});
              generateTextHashes(inputText);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'text'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hash Text Input
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('file');
              setHashes({});
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'file'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hash File Checksum
          </button>
        </div>
      </div>

      {mode === 'text' ? (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <label className="text-xs font-semibold text-slate-300 uppercase">Input Text</label>
          <textarea
            value={inputText}
            onChange={(e) => generateTextHashes(e.target.value)}
            rows={4}
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-200 font-mono text-xs focus:ring-2 focus:ring-cyan-400 focus:outline-none"
            placeholder="Type text to compute cryptographic hash digest..."
          />
        </div>
      ) : (
        <div className="space-y-4">
          <FileDropzone
            maxSizeMB={200}
            onFilesSelected={handleFile}
            title="Upload any file to calculate SHA checksum digests"
            subtitle="Processes file in memory using window.crypto.subtle."
          />
          {fileName && (
            <div className="text-xs text-cyan-400 font-medium text-center">
              Selected File: {fileName}
            </div>
          )}
          {isHashing && (
            <div className="text-center text-xs text-cyan-300 animate-pulse">
              Computing crypto digests...
            </div>
          )}
        </div>
      )}

      {/* Hashes output cards */}
      {Object.keys(hashes).length > 0 && (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-400" />
            <span>Cryptographic Digest Checksums</span>
          </h4>

          <div className="space-y-3">
            {Object.entries(hashes).map(([algo, hashValue]) => (
              <div
                key={algo}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1 overflow-hidden">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                    {algo}
                  </span>
                  <p className="font-mono text-xs text-slate-200 break-all select-all pt-1">
                    {hashValue}
                  </p>
                </div>
                <CopyButton textToCopy={hashValue} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

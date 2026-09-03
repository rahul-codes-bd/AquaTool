import React, { useState, useEffect } from 'react';
import { CryptoTools, PasswordOptions, EntropyResult } from '../../services/cryptoTools';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import { ShieldCheck, RefreshCw, KeyRound, Lock, RotateCcw, AlertTriangle, Hash, FileText } from 'lucide-react';

export const PasswordGeneratorTool: React.FC = () => {
  const [mode, setMode] = useState<'password' | 'passphrase' | 'pin'>('password');

  // Password options
  const defaultPasswordOptions: PasswordOptions = {
    length: 20,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: false,
  };
  const [options, setOptions] = useState<PasswordOptions>(defaultPasswordOptions);

  // Passphrase options
  const [passphraseWords, setPassphraseWords] = useState(4);
  const [passphraseSeparator, setPassphraseSeparator] = useState('-');
  const [passphraseNumber, setPassphraseNumber] = useState(true);
  const [passphraseCapitalize, setPassphraseCapitalize] = useState(true);

  // PIN options
  const [pinLength, setPinLength] = useState(6);

  const [generatedSecret, setGeneratedSecret] = useState('');
  const [entropy, setEntropy] = useState<EntropyResult>(() => CryptoTools.calculateEntropy(''));

  const handleGenerate = () => {
    if (mode === 'password') {
      const res = CryptoTools.generatePassword(options);
      setGeneratedSecret(res.password);
      setEntropy(CryptoTools.calculateEntropy(res.password));
    } else if (mode === 'passphrase') {
      const phrase = CryptoTools.generatePassphrase({
        wordCount: passphraseWords,
        separator: passphraseSeparator,
        includeNumber: passphraseNumber,
        capitalize: passphraseCapitalize,
      });
      setGeneratedSecret(phrase);
      setEntropy(CryptoTools.calculateEntropy(phrase));
    } else {
      const pin = CryptoTools.generatePin(pinLength);
      setGeneratedSecret(pin);
      setEntropy(CryptoTools.calculateEntropy(pin));
    }
  };

  const handleReset = () => {
    setOptions(defaultPasswordOptions);
    setPassphraseWords(4);
    setPassphraseSeparator('-');
    setPassphraseNumber(true);
    setPassphraseCapitalize(true);
    setPinLength(6);
  };

  useEffect(() => {
    handleGenerate();
  }, [mode, options, passphraseWords, passphraseSeparator, passphraseNumber, passphraseCapitalize, pinLength]);

  const credentialReport = `=========================================
AquaTools Cryptographic Secret Generator
Generated: ${new Date().toISOString()}
=========================================
Type: ${mode.toUpperCase()}
Secret: ${generatedSecret}
Entropy: ${entropy.entropyBits} bits (${entropy.level})
Estimated Crack Time: ${entropy.crackTimeEstimate}
Method: Client-Side Web Crypto API CSPRNG
Notice: Never share this file or store it in unencrypted plain text.
=========================================`;

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex items-center justify-center">
        <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setMode('password')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'password'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Random Password</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('passphrase')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'passphrase'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>Memorable Passphrase</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('pin')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'pin'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-teal-400" />
            <span>Numeric PIN</span>
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-6">
        {/* Output Box */}
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-mono text-base sm:text-lg font-bold text-cyan-300 break-all select-all tracking-wider">
              {generatedSecret}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="regenerate-secret-btn"
                onClick={handleGenerate}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors"
                title="Regenerate"
                aria-label="Generate new secret"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <CopyButton textToCopy={generatedSecret} label="Copy Secret" />
              <DownloadButton
                content={credentialReport}
                fileName={`secret-${Date.now()}.txt`}
                mimeType="text/plain"
                label="Save"
              />
            </div>
          </div>

          {/* Entropy strength meter */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap justify-between items-center text-xs gap-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Entropy Strength: <strong style={{ color: entropy.color }}>{entropy.strength}</strong>
                <span className="text-slate-500">({entropy.crackTimeEstimate})</span>
              </span>
              <span className="font-mono text-slate-400">{entropy.entropyBits} bits of entropy</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (entropy.entropyBits / 128) * 100)}%`,
                  backgroundColor: entropy.color,
                }}
              />
            </div>
          </div>
        </div>

        {/* Configuration Controls */}
        {mode === 'password' && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Password Length</span>
                <span className="font-mono text-cyan-400 font-bold">{options.length} characters</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={options.length}
                onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <input
                  type="checkbox"
                  checked={options.includeUppercase}
                  onChange={(e) => setOptions({ ...options, includeUppercase: e.target.checked })}
                  className="accent-cyan-400 rounded"
                />
                <span>Uppercase Letters (A-Z)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <input
                  type="checkbox"
                  checked={options.includeLowercase}
                  onChange={(e) => setOptions({ ...options, includeLowercase: e.target.checked })}
                  className="accent-cyan-400 rounded"
                />
                <span>Lowercase Letters (a-z)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <input
                  type="checkbox"
                  checked={options.includeNumbers}
                  onChange={(e) => setOptions({ ...options, includeNumbers: e.target.checked })}
                  className="accent-cyan-400 rounded"
                />
                <span>Numbers (0-9)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <input
                  type="checkbox"
                  checked={options.includeSymbols}
                  onChange={(e) => setOptions({ ...options, includeSymbols: e.target.checked })}
                  className="accent-cyan-400 rounded"
                />
                <span>Special Symbols (!@#$%)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-3 rounded-xl bg-slate-900/60 border border-slate-800 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={options.excludeAmbiguous}
                  onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
                  className="accent-cyan-400 rounded"
                />
                <span>Exclude Ambiguous Characters (e.g. 1, l, I, 0, O, o)</span>
              </label>
            </div>
          </div>
        )}

        {mode === 'passphrase' && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Number of Words</span>
                <span className="font-mono text-cyan-400 font-bold">{passphraseWords} words</span>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                value={passphraseWords}
                onChange={(e) => setPassphraseWords(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Word Separator</label>
                <select
                  value={passphraseSeparator}
                  onChange={(e) => setPassphraseSeparator(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                >
                  <option value="-">Hyphen (-)</option>
                  <option value="_">Underscore (_)</option>
                  <option value=".">Period (.)</option>
                  <option value=" ">Space ( )</option>
                  <option value="/">Slash (/)</option>
                  <option value="#">Hash (#)</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passphraseCapitalize}
                    onChange={(e) => setPassphraseCapitalize(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Title Case (Capitalize)</span>
                </label>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passphraseNumber}
                    onChange={(e) => setPassphraseNumber(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Append random number</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {mode === 'pin' && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>PIN Code Length</span>
                <span className="font-mono text-cyan-400 font-bold">{pinLength} digits</span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                value={pinLength}
                onChange={(e) => setPinLength(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
            </div>
            <div className="flex gap-2">
              {[4, 6, 8, 10, 12].map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => setPinLength(len)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    pinLength === len
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {len} Digits
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Footer & Reset */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Security Disclaimer */}
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-400">
          <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-cyan-300">Web Crypto CSPRNG Verification & Privacy Notice</span>
            <p>
              Secrets are generated locally inside your active browser session using the Web Crypto API
              (<code className="text-cyan-300">crypto.getRandomValues</code>). No generated credentials or parameters
              are ever transmitted over the network or logged. Please copy and store your credentials immediately into a
              secure password manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

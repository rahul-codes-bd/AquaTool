import React, { useState } from 'react';
import { OutputCard } from '../common/OutputCard';
import { ErrorAlert } from '../common/ErrorAlert';
import { TextTools } from '../../services/textTools';
import { FileDropzone } from '../common/FileDropzone';
import { Binary, Upload, FileCode } from 'lucide-react';

export const Base64Tool: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode' | 'file'>('encode');
  const [inputText, setInputText] = useState('Hello, AquaTools private browser suite!');
  const [outputText, setOutputText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleProcess = () => {
    setError(null);
    try {
      if (mode === 'encode') {
        setOutputText(TextTools.textToBase64(inputText));
      } else if (mode === 'decode') {
        setOutputText(TextTools.base64ToText(inputText));
      }
    } catch (err: any) {
      setError(err.message || 'Base64 decoding failed. Check input string.');
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length > 0) {
      try {
        const base64Data = await TextTools.fileToBase64(files[0]);
        setOutputText(base64Data);
      } catch (err: any) {
        setError('Failed to read file into Base64 data URI.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy & Encoding vs Encryption Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-3">
          <Binary className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong>100% Client-Side Processing:</strong> All encoding and decoding runs in-memory in your browser using standard UTF-8 binary buffers.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
          <FileCode className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-0.5">Encoding vs. Encryption:</strong>
            <span className="text-amber-300/90">
              <strong>Base64 is an encoding format</strong> designed to safely transport binary data across text-only protocols. It is <em>not</em> encryption and offers zero security or confidentiality. Anyone can instantly decode Base64 without a key.
            </span>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('encode');
              setOutputText('');
              setError(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'encode'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Text to Base64
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('decode');
              setOutputText('');
              setError(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'decode'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Base64 to Text
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('file');
              setOutputText('');
              setError(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'file'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            File to Data URI
          </button>
        </div>
      </div>

      {mode === 'file' ? (
        <div className="space-y-6">
          <FileDropzone
            maxSizeMB={25}
            onFilesSelected={handleFileUpload}
            title="Upload any file (image, font, document) to encode into Base64 Data URI"
          />
          {outputText && (
            <OutputCard
              title="Base64 Data URI"
              resultText={outputText}
              onReset={() => setOutputText('')}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase">
                {mode === 'encode' ? 'Plain Text String' : 'Base64 Encoded String'}
              </span>
              <button
                type="button"
                onClick={() => setInputText('')}
                className="text-xs text-slate-400 hover:text-rose-400"
              >
                Clear
              </button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={12}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-200 font-mono text-xs focus:ring-2 focus:ring-cyan-400 focus:outline-none resize-y"
              placeholder={mode === 'encode' ? 'Type text...' : 'Paste base64 string...'}
            />

            <button
              type="button"
              id="process-base64-btn"
              onClick={handleProcess}
              className="w-full py-3 rounded-xl aqua-glow-button text-white text-xs font-semibold shadow-lg"
            >
              {mode === 'encode' ? 'Encode to Base64' : 'Decode to Plain Text'}
            </button>
          </div>

          <div className="space-y-4">
            {error && <ErrorAlert message={error} />}

            {outputText ? (
              <OutputCard
                title={mode === 'encode' ? 'Base64 Result' : 'Decoded Text'}
                resultText={outputText}
                onReset={() => setOutputText('')}
              />
            ) : (
              <div className="glass-panel rounded-2xl p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center min-h-[300px]">
                <Binary className="w-8 h-8 text-slate-600 mb-2" />
                <span>Result will appear here.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

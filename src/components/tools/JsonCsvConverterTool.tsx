import React, { useState } from 'react';
import { OutputCard } from '../common/OutputCard';
import { ErrorAlert } from '../common/ErrorAlert';
import { TextTools } from '../../services/textTools';
import { ArrowLeftRight, Upload, FileText } from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';

export const JsonCsvConverterTool: React.FC = () => {
  const [direction, setDirection] = useState<'json2csv' | 'csv2json'>('json2csv');
  const [inputText, setInputText] = useState(`[
  { "id": 1, "name": "AquaTools", "category": "Utilities", "offline": true },
  { "id": 2, "name": "PDF Merger", "category": "Documents", "offline": true },
  { "id": 3, "name": "Image Compressor", "category": "Converters", "offline": true }
]`);
  const [delimiter, setDelimiter] = useState(',');
  const [resultText, setResultText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConvert = () => {
    setError(null);
    try {
      if (direction === 'json2csv') {
        const csv = TextTools.jsonToCsv(inputText, delimiter);
        setResultText(csv);
      } else {
        const json = TextTools.csvToJson(inputText, delimiter);
        setResultText(json);
      }
    } catch (err: any) {
      setError(err.message || 'Conversion failed. Please verify syntax.');
    }
  };

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInputText(content);
        // auto detect direction
        if (file.name.endsWith('.csv')) {
          setDirection('csv2json');
        } else if (file.name.endsWith('.json')) {
          setDirection('json2csv');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setDirection('json2csv');
              setResultText('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              direction === 'json2csv'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            JSON → CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setDirection('csv2json');
              setResultText('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              direction === 'csv2json'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CSV → JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              {direction === 'json2csv' ? 'Input JSON Array' : 'Input CSV String'}
            </h4>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-400">Delimiter:</label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="	">Tab (\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={14}
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:ring-2 focus:ring-cyan-400 focus:outline-none resize-y"
            placeholder={direction === 'json2csv' ? 'Paste JSON here...' : 'Paste CSV text here...'}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
              <Upload className="w-3.5 h-3.5" />
              <span>Load file</span>
              <input
                type="file"
                accept={direction === 'json2csv' ? '.json,application/json' : '.csv,text/csv'}
                onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
                className="hidden"
              />
            </label>

            <button
              type="button"
              id="convert-json-csv-btn"
              onClick={handleConvert}
              className="px-5 py-2 rounded-xl aqua-glow-button text-white text-xs font-semibold shadow-lg"
            >
              Convert to {direction === 'json2csv' ? 'CSV' : 'JSON'}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="space-y-4">
          {error && <ErrorAlert message={error} />}

          {resultText ? (
            <OutputCard
              title={direction === 'json2csv' ? 'Generated CSV' : 'Generated JSON'}
              resultText={resultText}
              fileName={direction === 'json2csv' ? 'converted.csv' : 'converted.json'}
              blob={
                new Blob([resultText], {
                  type: direction === 'json2csv' ? 'text/csv' : 'application/json',
                })
              }
              onReset={() => setResultText('')}
            />
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center min-h-[350px]">
              <FileText className="w-8 h-8 text-slate-600 mb-2" />
              <span>Click "Convert" to view formatted output here.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

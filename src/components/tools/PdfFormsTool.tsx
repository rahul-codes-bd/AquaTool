import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  FormInput,
  Plus,
  Trash2,
  Download,
  FileText,
  Layers,
  Settings,
  AlertCircle,
  Eye,
  Shield,
  FilePlus,
  Check,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { DownloadButton } from '../common/DownloadButton';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfFormFieldInfo, PdfNewFormField, PdfEngineResult } from '../../types/pdf';

interface PdfFormsToolProps {
  initialMode?: 'fill' | 'create';
}

export function PdfFormsTool({ initialMode = 'fill' }: PdfFormsToolProps) {
  const [activeTab, setActiveTab] = useState<'fill' | 'create'>(initialMode);
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<PdfFormFieldInfo[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [flattenOnSave, setFlattenOnSave] = useState<boolean>(false);

  // Form Builder state
  const [createFromBlank, setCreateFromBlank] = useState<boolean>(false);
  const [blankPageCount, setBlankPageCount] = useState<number>(1);
  const [blankPageSize, setBlankPageSize] = useState<'a4' | 'letter'>('a4');
  const [blankOrientation, setBlankOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [newFields, setNewFields] = useState<PdfNewFormField[]>([
    {
      id: 'f-1',
      name: 'fullName',
      type: 'text',
      label: 'Full Name',
      pageIndex: 0,
      x: 50,
      y: 700,
      width: 250,
      height: 28,
      isRequired: true,
    },
    {
      id: 'f-2',
      name: 'emailAddress',
      type: 'text',
      label: 'Email Address',
      pageIndex: 0,
      x: 50,
      y: 650,
      width: 250,
      height: 28,
      isRequired: true,
    },
    {
      id: 'f-3',
      name: 'agreeTerms',
      type: 'checkbox',
      label: 'I Agree to Terms',
      pageIndex: 0,
      x: 50,
      y: 600,
      width: 18,
      height: 18,
      defaultValue: false,
    },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [result, setResult] = useState<PdfEngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (files: File[]) => {
    if (!files.length) return;
    const selected = files[0];
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF document.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setFile(selected);
      setResult(null);

      // Load form fields if filling
      const detected = await PdfEngine.getFormFields(selected);
      setFields(detected);

      // Populate initial values
      const initialMap: Record<string, any> = {};
      for (const f of detected) {
        initialMap[f.name] = f.value ?? '';
      }
      setFieldValues(initialMap);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to inspect PDF form fields.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldValueChange = (name: string, value: any) => {
    setFieldValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit Fill Form
  const handleSaveFilledForm = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);
      setProgressMsg('Updating interactive AcroForm fields...');

      const res = await PdfEngine.fillFormFields(file, fieldValues, flattenOnSave, (pct, msg) => {
        setProgressMsg(msg);
      });

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fill PDF form.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Create Form
  const handleGenerateCreatedForm = async () => {
    if (!file && !createFromBlank) {
      setError('Please either upload a base PDF or enable "Create from Blank Canvas".');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgressMsg('Generating AcroForm document structure...');

      const res = await PdfEngine.createForm(
        createFromBlank ? null : file,
        newFields,
        {
          pageCount: blankPageCount,
          size: blankPageSize,
          orientation: blankOrientation,
        },
        (pct, msg) => {
          setProgressMsg(msg);
        }
      );

      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to generate interactive form.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addNewFieldRow = (type: 'text' | 'checkbox' | 'dropdown' | 'button') => {
    const id = `f-${Date.now()}`;
    const name = `field_${newFields.length + 1}`;
    setNewFields((prev) => [
      ...prev,
      {
        id,
        name,
        type,
        label: `Field ${prev.length + 1}`,
        pageIndex: 0,
        x: 50,
        y: Math.max(100, 750 - prev.length * 50),
        width: type === 'checkbox' ? 18 : type === 'button' ? 100 : 200,
        height: type === 'checkbox' ? 18 : 28,
        options: type === 'dropdown' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
      },
    ]);
  };

  const removeFieldRow = (id: string) => {
    setNewFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFieldRow = (id: string, updates: Partial<PdfNewFormField>) => {
    setNewFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FormInput className="w-5 h-5 text-cyan-400" />
            PDF Interactive Forms & AcroForm Builder
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Fill fillable PDF forms without Adobe Acrobat, or design new interactive fields from scratch.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>No Data Stored or Transmitted</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('fill');
            setResult(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'fill'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Fill Form Fields
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('create');
            setResult(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'create'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Plus className="w-4 h-4" />
          Create Interactive Form
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-center gap-3 text-sm text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: FILL FORM FIELDS */}
      {activeTab === 'fill' && (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              accept=".pdf,application/pdf"
              maxSizeMB={50}
              onFilesSelected={handleFileSelect}
              title="Upload Fillable PDF Form"
              subtitle="Automatically scans and extracts AcroForm interactive fields"
            />
          ) : (
            <div className="space-y-6 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Document</span>
                  <p className="text-slate-200 font-medium text-sm mt-0.5">{file.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-lg font-mono">
                    {fields.length} Field{fields.length === 1 ? '' : 's'} Detected
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setFields([]);
                      setResult(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {fields.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800/80">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                  <p className="text-slate-300 text-sm font-medium">No Interactive AcroForm Fields Detected</p>
                  <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                    This document appears to be a flat or scanned PDF without native interactive form tags. You can switch to the "Create Interactive Form" tab to add interactive form fields to it!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map((field) => (
                      <div
                        key={field.name}
                        className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                            <span className="text-cyan-400 font-mono">{field.name}</span>
                            {field.isRequired && <span className="text-red-400 font-bold">*</span>}
                          </label>
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded uppercase">
                            {field.type}
                          </span>
                        </div>

                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={fieldValues[field.name] || ''}
                            onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
                            disabled={field.isReadOnly}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                          />
                        )}

                        {field.type === 'checkbox' && (
                          <label className="flex items-center gap-2 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              checked={!!fieldValues[field.name]}
                              onChange={(e) => handleFieldValueChange(field.name, e.target.checked)}
                              disabled={field.isReadOnly}
                              className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                            />
                            <span className="text-xs text-slate-400">Checked / Selected</span>
                          </label>
                        )}

                        {field.type === 'dropdown' && (
                          <select
                            value={fieldValues[field.name] || ''}
                            onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
                            disabled={field.isReadOnly}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                          >
                            <option value="">-- Select --</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {field.type === 'radio' && (
                          <div className="space-y-1.5 pt-1">
                            {field.options?.map((opt) => (
                              <label key={opt} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                <input
                                  type="radio"
                                  name={field.name}
                                  value={opt}
                                  checked={fieldValues[field.name] === opt}
                                  onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
                                  className="text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Form Flattening Option */}
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={flattenOnSave}
                        onChange={(e) => setFlattenOnSave(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">Flatten Form after filling</span>
                        <span className="text-[11px] text-slate-400 block">
                          Converts filled values into immutable vector graphics so they cannot be edited in other viewers.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveFilledForm}
                      disabled={isProcessing}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? progressMsg || 'Saving...' : 'Save & Download Filled PDF'}
                    </button>
                  </div>
                </div>
              )}

              {result && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-emerald-200 block">Filled PDF Ready!</span>
                    <span className="text-xs text-emerald-400/80 font-mono">
                      {result.fileName} ({(result.fileSizeBytes / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <DownloadButton
                    url={result.downloadUrl}
                    fileName={result.fileName}
                    label="Download Filled PDF"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE INTERACTIVE FORM */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-6">
            {/* Canvas Source Option */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Document Canvas Source</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Attach form controls to an existing PDF or generate a fresh multi-page form document.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setCreateFromBlank(false)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    !createFromBlank ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Overlay Existing PDF
                </button>
                <button
                  type="button"
                  onClick={() => setCreateFromBlank(true)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    createFromBlank ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Blank Form
                </button>
              </div>
            </div>

            {!createFromBlank && !file && (
              <FileDropzone
                accept=".pdf,application/pdf"
                maxSizeMB={50}
                onFilesSelected={handleFileSelect}
                title="Upload Base PDF Document"
                subtitle="We'll inject interactive AcroForm fields onto its pages"
              />
            )}

            {createFromBlank && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Page Count</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={blankPageCount}
                    onChange={(e) => setBlankPageCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Paper Size</label>
                  <select
                    value={blankPageSize}
                    onChange={(e) => setBlankPageSize(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  >
                    <option value="a4">A4 (210 × 297 mm)</option>
                    <option value="letter">Letter (8.5 × 11 in)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Orientation</label>
                  <select
                    value={blankOrientation}
                    onChange={(e) => setBlankOrientation(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            )}

            {/* Field Definitions Grid */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Interactive Form Fields ({newFields.length})
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addNewFieldRow('text')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Text Field
                  </button>
                  <button
                    type="button"
                    onClick={() => addNewFieldRow('checkbox')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Checkbox
                  </button>
                  <button
                    type="button"
                    onClick={() => addNewFieldRow('dropdown')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Dropdown
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {newFields.map((f, idx) => (
                  <div
                    key={f.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-400 font-mono">#{idx + 1}</span>
                        <span className="text-xs font-medium text-slate-200 uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {f.type}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFieldRow(f.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="Delete Field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">Field Key / Name</label>
                        <input
                          type="text"
                          value={f.name}
                          onChange={(e) => updateFieldRow(f.id, { name: e.target.value.replace(/\s+/g, '_') })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Position (X, Y) pt</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={f.x}
                            onChange={(e) => updateFieldRow(f.id, { x: parseInt(e.target.value, 10) || 0 })}
                            className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
                            placeholder="X"
                          />
                          <input
                            type="number"
                            value={f.y}
                            onChange={(e) => updateFieldRow(f.id, { y: parseInt(e.target.value, 10) || 0 })}
                            className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
                            placeholder="Y"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Size (W × H) pt</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={f.width}
                            onChange={(e) => updateFieldRow(f.id, { width: parseInt(e.target.value, 10) || 100 })}
                            className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
                            placeholder="W"
                          />
                          <input
                            type="number"
                            value={f.height}
                            onChange={(e) => updateFieldRow(f.id, { height: parseInt(e.target.value, 10) || 28 })}
                            className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
                            placeholder="H"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!f.isRequired}
                            onChange={(e) => updateFieldRow(f.id, { isRequired: e.target.checked })}
                            className="rounded text-cyan-600 bg-slate-900 border-slate-700"
                          />
                          <span className="text-slate-300">Required</span>
                        </label>
                        {f.type === 'text' && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!f.isMultiline}
                              onChange={(e) => updateFieldRow(f.id, { isMultiline: e.target.checked })}
                              className="rounded text-cyan-600 bg-slate-900 border-slate-700"
                            />
                            <span className="text-slate-300">Multiline</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {f.type === 'dropdown' && (
                      <div className="text-xs">
                        <label className="text-slate-400 block mb-1">Options (comma-separated)</label>
                        <input
                          type="text"
                          value={f.options?.join(', ') || ''}
                          onChange={(e) =>
                            updateFieldRow(f.id, {
                              options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                          placeholder="Apple, Banana, Orange"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleGenerateCreatedForm}
                disabled={isProcessing || (!createFromBlank && !file)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isProcessing ? progressMsg || 'Generating...' : 'Build Interactive AcroForm PDF'}
              </button>
            </div>

            {result && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-semibold text-emerald-200 block">Form PDF Generated!</span>
                  <span className="text-xs text-emerald-400/80 font-mono">
                    {result.fileName} ({(result.fileSizeBytes / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <DownloadButton
                  url={result.downloadUrl}
                  fileName={result.fileName}
                  label="Download AcroForm PDF"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

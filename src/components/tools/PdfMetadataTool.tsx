import React, { useState, useEffect } from 'react';
import { FileDropzone } from '../common/FileDropzone';
import { ErrorAlert } from '../common/ErrorAlert';
import { ProgressBar } from '../common/ProgressBar';
import { DownloadButton } from '../common/DownloadButton';
import { CopyButton } from '../common/CopyButton';
import { PdfEngine } from '../../services/pdfEngine';
import { FileInfoTools } from '../../services/fileInfoTools';
import { PdfDocumentSummary } from '../../types/pdf';
import { PdfSecurityDisclaimers } from './PdfSecurityDisclaimers';
import {
  FileText,
  Lock,
  RotateCcw,
  AlertTriangle,
  Info,
  Layers,
  Search,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  CheckCircle2,
  Trash2,
  Tag,
  Calendar,
  User,
  BookOpen,
} from 'lucide-react';

interface PdfMetadataToolProps {
  initialTab?: 'inspect' | 'edit' | 'remove';
}

export const PdfMetadataTool: React.FC<PdfMetadataToolProps> = ({ initialTab = 'inspect' }) => {
  const [activeTab, setActiveTab] = useState<'inspect' | 'edit' | 'remove'>(initialTab);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<PdfDocumentSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pageSearch, setPageSearch] = useState('');
  const [pageViewPage, setPageViewPage] = useState(1);
  const PAGES_PER_VIEW = 12;

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editKeywords, setEditKeywords] = useState('');
  const [editCreator, setEditCreator] = useState('');
  const [editProducer, setEditProducer] = useState('');

  // Result state
  const [processedResult, setProcessedResult] = useState<{
    downloadUrl: string;
    fileName: string;
    fileSizeBytes: number;
    actionType: 'edit' | 'sanitize';
  } | null>(null);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const uploaded = files[0];
    setFile(uploaded);
    setIsProcessing(true);
    setError(null);
    setProcessedResult(null);
    setProgress(20);
    setStageText('Reading PDF structure and metadata catalog...');

    try {
      const data = await PdfEngine.inspectPdf(uploaded);
      setSummary(data);

      // Pre-fill edit fields
      setEditTitle(data.title || '');
      setEditAuthor(data.author || '');
      setEditSubject(data.subject || '');
      setEditKeywords(data.keywords || '');
      setEditCreator(data.creator || '');
      setEditProducer(data.producer || '');
    } catch (err: any) {
      setError(err.message || 'Failed to inspect PDF metadata.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyEdit = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(30);
    setStageText('Updating PDF metadata dictionary...');

    try {
      const res = await PdfEngine.updateMetadata(
        file,
        {
          title: editTitle,
          author: editAuthor,
          subject: editSubject,
          keywords: editKeywords,
          creator: editCreator,
          producer: editProducer,
        },
        (pct, msg) => {
          setProgress(pct);
          setStageText(msg);
        }
      );

      setProcessedResult({
        downloadUrl: res.downloadUrl,
        fileName: res.fileName,
        fileSizeBytes: res.fileSizeBytes,
        actionType: 'edit',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save updated metadata.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripMetadata = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(30);
    setStageText('Scrubbing all embedded metadata and fingerprints...');

    try {
      const res = await PdfEngine.stripMetadata(file, (pct, msg) => {
        setProgress(pct);
        setStageText(msg);
      });

      setProcessedResult({
        downloadUrl: res.downloadUrl,
        fileName: res.fileName,
        fileSizeBytes: res.fileSizeBytes,
        actionType: 'sanitize',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to strip metadata.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSummary(null);
    setProcessedResult(null);
    setError(null);
    setProgress(0);
    setStageText('');
    setPageSearch('');
    setPageViewPage(1);
  };

  const filteredPages = summary?.pages.filter((p) => {
    if (!pageSearch.trim()) return true;
    const q = pageSearch.toLowerCase();
    return (
      String(p.pageNumber).includes(q) ||
      p.standardSize.toLowerCase().includes(q) ||
      p.orientation.toLowerCase().includes(q)
    );
  }) || [];

  const paginatedPages = filteredPages.slice(
    (pageViewPage - 1) * PAGES_PER_VIEW,
    pageViewPage * PAGES_PER_VIEW
  );
  const totalViewPages = Math.ceil(filteredPages.length / PAGES_PER_VIEW);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-center">
        <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('inspect')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'inspect'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Inspect Metadata</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'edit'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Edit Document Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('remove')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'remove'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Remove Metadata (Sanitize)</span>
          </button>
        </div>
      </div>

      {!file ? (
        <div className="space-y-4">
          <FileDropzone
            accept=".pdf,application/pdf"
            maxSizeMB={100}
            onFilesSelected={handleFile}
            title={
              activeTab === 'remove'
                ? 'Drop PDF to Sanitize & Remove All Metadata'
                : activeTab === 'edit'
                ? 'Drop PDF to Edit Document Info'
                : 'Drop PDF to Inspect Metadata & Page Dimensions'
            }
            subtitle="Extracts or cleans document title, author, dates, producer tags, and page metrics 100% locally in browser memory."
          />
          <PdfSecurityDisclaimers toolType="metadata" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header File Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{file.name}</h3>
                <p className="text-xs text-slate-400">
                  {FileInfoTools.formatBytes(file.size)} • {summary?.pageCount || 0} pages{' '}
                  {summary?.pdfVersion && `• ${summary.pdfVersion}`}
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

          {/* In-progress status */}
          {isProcessing && (
            <ProgressBar progress={progress} stageText={stageText || 'Processing PDF document...'} />
          )}

          {error && <ErrorAlert message={error} />}

          {/* Processed Download Banner */}
          {processedResult && (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-200">
                    {processedResult.actionType === 'sanitize'
                      ? 'PDF Metadata Scrubbed Clean!'
                      : 'PDF Document Info Updated!'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {processedResult.actionType === 'sanitize'
                      ? 'All author names, modification timestamps, creator software signatures, and XMP streams have been permanently removed.'
                      : 'The document dictionary has been saved with your customized metadata values.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <DownloadButton
                  url={processedResult.downloadUrl}
                  fileName={processedResult.fileName}
                  label={
                    processedResult.actionType === 'sanitize'
                      ? 'Download Sanitized PDF'
                      : 'Download Updated PDF'
                  }
                />
              </div>
            </div>
          )}

          {/* Tab 1: INSPECT METADATA */}
          {activeTab === 'inspect' && summary && (
            <div className="space-y-6">
              {/* Document Overview Metadata */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Document Information Dictionary</span>
                  </h4>
                  <CopyButton
                    textToCopy={JSON.stringify(summary, null, 2)}
                    label="Copy JSON"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Title</span>
                    <span className="text-slate-200 font-medium font-mono">{summary.title || '<Not set>'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Author</span>
                    <span className="text-slate-200 font-medium font-mono">{summary.author || '<Not set>'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Subject</span>
                    <span className="text-slate-200 font-medium font-mono">{summary.subject || '<Not set>'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Keywords</span>
                    <span className="text-slate-200 font-medium font-mono">{summary.keywords || '<None>'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Creator Application</span>
                    <span className="text-slate-200 font-medium font-mono">{summary.creator || '<Not set>'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">PDF Producer</span>
                    <span className="text-slate-200 font-medium font-mono">{summary.producer || '<Not set>'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Creation Date</span>
                    <span className="text-slate-200 font-medium font-mono">
                      {summary.creationDate ? String(summary.creationDate) : '<Unknown>'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Modification Date</span>
                    <span className="text-slate-200 font-medium font-mono">
                      {summary.modificationDate ? String(summary.modificationDate) : '<Unknown>'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Encryption Status</span>
                    <span className={`font-semibold ${summary.isEncrypted ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {summary.isEncrypted ? 'Password Protected / Encrypted' : 'Unencrypted (Standard)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Page Metrics */}
              {summary.pages.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Page Layouts & Geometry ({summary.pages.length} Pages)</span>
                    </h4>

                    {summary.pages.length > PAGES_PER_VIEW && (
                      <div className="relative w-full sm:w-60">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={pageSearch}
                          onChange={(e) => {
                            setPageSearch(e.target.value);
                            setPageViewPage(1);
                          }}
                          placeholder="Filter pages..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {paginatedPages.map((p) => (
                      <div
                        key={p.pageNumber}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs">
                            Page {p.pageNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-300">
                            {p.standardSize}
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-400">
                          <div className="flex justify-between">
                            <span>Orientation:</span>
                            <span className="text-slate-200 font-medium">{p.orientation}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Dimensions:</span>
                            <span className="text-cyan-300 font-mono">
                              {p.widthMm} × {p.heightMm} mm
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Points / Rotation:</span>
                            <span className="text-slate-400 font-mono">
                              {Math.round(p.widthPt)}×{Math.round(p.heightPt)} pt • {p.rotation}°
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalViewPages > 1 && (
                    <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                      <span>
                        Showing {((pageViewPage - 1) * PAGES_PER_VIEW) + 1} -{' '}
                        {Math.min(pageViewPage * PAGES_PER_VIEW, filteredPages.length)} of{' '}
                        {filteredPages.length} pages
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={pageViewPage === 1}
                          onClick={() => setPageViewPage((p) => Math.max(1, p - 1))}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <span className="px-2 font-mono text-cyan-400">
                          {pageViewPage} / {totalViewPages}
                        </span>
                        <button
                          type="button"
                          disabled={pageViewPage === totalViewPages}
                          onClick={() => setPageViewPage((p) => Math.min(totalViewPages, p + 1))}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: EDIT METADATA */}
          {activeTab === 'edit' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-semibold text-slate-200">Edit PDF Document Information</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Document Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Quarterly Financial Report"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Author Name</label>
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Subject / Description</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="e.g. Executive Summary & Audits"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={editKeywords}
                    onChange={(e) => setEditKeywords(e.target.value)}
                    placeholder="e.g. finance, quarterly, report, 2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Creator Software</label>
                  <input
                    type="text"
                    value={editCreator}
                    onChange={(e) => setEditCreator(e.target.value)}
                    placeholder="e.g. AquaTools Suite"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">PDF Producer</label>
                  <input
                    type="text"
                    value={editProducer}
                    onChange={(e) => setEditProducer(e.target.value)}
                    placeholder="e.g. AquaTools PDF Engine"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleApplyEdit}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Saving Metadata...' : 'Save & Download PDF'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: REMOVE / SANITIZE METADATA */}
          {activeTab === 'remove' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-semibold text-slate-200">1-Click Metadata Sanitization (Privacy Scrub)</h4>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Wipes all identifying author metadata, software signatures, creation timestamps, and tracking properties from your PDF before sharing or public publishing.
              </p>

              {/* Checklist of what will be stripped */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {[
                  'Document Title & Author Names',
                  'Subject & Keywords Tags',
                  'Creator Application Signature',
                  'PDF Producer & Print Software',
                  'Original Creation Timestamps',
                  'XMP Metadata Packet Stream',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-slate-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleStripMetadata}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-rose-600/20"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Scrubbing Metadata...' : 'Sanitize & Download Clean PDF'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Disclaimers */}
          <PdfSecurityDisclaimers toolType="metadata" compact />
        </div>
      )}
    </div>
  );
};

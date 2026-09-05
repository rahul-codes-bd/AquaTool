import React, { useState } from 'react';
import { OutputCard } from '../common/OutputCard';
import { TextTools } from '../../services/textTools';
import { BookOpen, Code, Eye, Download } from 'lucide-react';
import { CopyButton } from '../common/CopyButton';

export const MarkdownPreviewTool: React.FC = () => {
  const [markdown, setMarkdown] = useState(`# Welcome to AquaTools 🌊

AquaTools is a **privacy-first**, client-side suite of developer & file utilities.

### Key Highlights
- **100% In-Browser Execution**: Zero cloud uploads.
- **Fast & Lightweight**: Powered by pure client-side Web APIs.
- **No Login**: No tracking, no cookies, no accounts.

> "True privacy means the server never even knows what files you processed."

\`\`\`typescript
const privacy = {
  localExecution: true,
  uploadedBytes: 0,
  speed: "Instant"
};
\`\`\`
`);

  const [tab, setTab] = useState<'preview' | 'html'>('preview');

  const htmlOutput = TextTools.markdownToHtml(markdown);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase">
              Markdown Editor
            </span>
            <button
              type="button"
              onClick={() => setMarkdown('')}
              className="text-xs text-slate-400 hover:text-rose-400"
            >
              Clear
            </button>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={16}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-200 font-mono text-xs focus:ring-2 focus:ring-cyan-400 focus:outline-none resize-y"
            placeholder="Type your markdown here..."
          />
        </div>

        {/* Live Preview / HTML output */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTab('preview')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  tab === 'preview'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('html')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  tab === 'html'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML Code</span>
              </button>
            </div>

            <CopyButton textToCopy={htmlOutput} label="Copy HTML" />
          </div>

          {tab === 'preview' ? (
            <div
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 min-h-[350px] overflow-auto prose prose-invert text-xs max-w-none text-slate-200"
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
          ) : (
            <textarea
              readOnly
              value={htmlOutput}
              rows={16}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
};

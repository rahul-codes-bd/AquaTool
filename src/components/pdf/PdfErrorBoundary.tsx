import * as React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';
import { PdfEngine } from '../../services/pdfEngine';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class PdfErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('AquaTools PDF module caught an unhandled error:', error, errorInfo);
    // Cleanup any memory buffers/URLs tracked in PdfEngine
    PdfEngine.cleanupAllTrackedUrls();
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    PdfEngine.cleanupAllTrackedUrls();
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleBackToHub = () => {
    PdfEngine.cleanupAllTrackedUrls();
    window.location.hash = 'pdf';
  };

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      const isCorruptError =
        this.state.error?.message?.toLowerCase().includes('corrupt') ||
        this.state.error?.message?.toLowerCase().includes('header') ||
        this.state.error?.message?.toLowerCase().includes('xref');

      return (
        <div className="bg-slate-900/80 border border-red-500/30 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center my-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {this.props.fallbackTitle || 'PDF Engine Encountered an Issue'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isCorruptError
                ? 'The provided PDF structure could not be parsed safely by the client-side engine. The document may be password-protected, linearized, or have corrupted object tables.'
                : 'An unexpected runtime state occurred during in-memory processing. Your files remain completely secure on your local device.'}
            </p>
          </div>

          {this.state.error && (
            <div className="max-w-xl mx-auto p-4 rounded-2xl bg-black/40 border border-white/10 text-left font-mono text-xs text-red-300 overflow-x-auto select-all">
              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Sanitized Diagnostic</span>
              {this.state.error.name}: {this.state.error.message || 'Unknown PDF stream parse failure'}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Operation</span>
            </button>

            <button
              type="button"
              onClick={this.handleBackToHub}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-medium text-xs transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to PDF Hub</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

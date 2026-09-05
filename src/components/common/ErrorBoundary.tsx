import * as React from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';
import { StorageService } from '../../services/storage';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
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
    console.error('AquaTools unhandled error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '';
    window.location.reload();
  };

  private handleClearDataAndReset = () => {
    StorageService.clearAll();
    window.location.hash = '';
    window.location.reload();
  };

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-6 select-none relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-lg w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 relative z-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Something Went Wrong</h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                An unexpected error occurred in this local utility session. Your privacy and local files remain completely safe.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-black/40 border border-white/5 rounded-xl p-3.5 text-xs font-mono text-red-300 overflow-x-auto max-h-32">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearDataAndReset}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-medium text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Clear Cache & Reset</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.hash = '';
                this.setState({ hasError: false, error: null, errorInfo: null });
              }}
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to AquaTools Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


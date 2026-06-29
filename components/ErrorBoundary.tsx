import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  info: ErrorInfo | null;
}

/**
 * Top-level error boundary — prevents a single component crash from
 * taking down the whole app. Renders a friendly fallback with reload
 * and reset actions. Logs to console for diagnostics.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info });
    this.props.onError?.(error, info);
    if (typeof console !== 'undefined') {
      console.error('[ErrorBoundary] Caught:', error, info.componentStack);
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null, info: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-navy-950 text-slate-200 p-6">
          <div className="max-w-md w-full bg-navy-900 border border-red-700/50 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-300 font-bold text-lg">
                !
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Une erreur est survenue</h1>
                <p className="text-xs text-slate-400">JAD2FX — Données de change indicatives</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              L'application a rencontré un problème inattendu. Vos données de navigation sont préservées.
            </p>
            {this.state.error && (
              <pre className="text-[11px] text-red-300 bg-navy-950 border border-red-900/50 rounded p-2 mb-4 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.reset}
                className="flex-1 px-4 py-2 bg-gold-500 text-navy-950 font-bold text-sm rounded hover:bg-gold-400 transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-navy-700 text-slate-300 text-sm font-medium rounded hover:bg-navy-800 transition-colors"
              >
                Recharger
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 text-center">
              Si le problème persiste, contactez{' '}
              <a href="https://jad2advisory.com" className="text-gold-400 hover:underline">
                JAD2 Advisory
              </a>
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { reportError } from '../../utils/monitoring';
import { claimChunkReload, isChunkLoadError } from '../../utils/chunkError';

interface BoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  /** Changing it clears a caught error, so leaving a broken page recovers the next one. */
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class Boundary extends Component<BoundaryProps, State> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PageErrorBoundary caught:', error, info);
    if (isChunkLoadError(error)) {
      // A page opened before a deploy asks for chunks that no longer exist
      let storage: Storage | null = null;
      try { storage = window.sessionStorage; } catch { storage = null; }
      if (claimChunkReload(storage)) {
        window.location.reload();
        return;
      }
    }
    reportError(error, { componentStack: info.componentStack, boundary: 'page' });
  }

  componentDidUpdate(previous: BoundaryProps) {
    if (this.state.hasError && previous.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {this.props.fallbackMessage || 'Algo correu mal'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-2xl font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-2xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Ir para Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Keyed by pathname so navigating away from a crashed page does not leave the error on screen. */
export const PageErrorBoundary: React.FC<{ children: ReactNode; fallbackMessage?: string }> = ({ children, fallbackMessage }) => {
  const { pathname } = useLocation();
  return <Boundary resetKey={pathname} fallbackMessage={fallbackMessage}>{children}</Boundary>;
};

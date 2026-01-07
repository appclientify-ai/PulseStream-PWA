
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    // Clear potentially corrupted module data but keep auth
    const keysToKeep = ['clientify_token'];
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        // We only clear compliance data if it's likely the cause
        if (key.includes('filing') || key.includes('mock')) {
          localStorage.removeItem(key);
        }
      }
    });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-rose-100 text-rose-600 shadow-xl shadow-rose-100">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Vault Access Interrupted</h2>
          <p className="mt-4 max-w-md text-lg font-medium text-slate-500">
            A synchronization error occurred while processing your client data. This is usually caused by corrupted local cache.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-slate-900 px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-slate-800"
            >
              Retry Sync
            </button>
            <button
              onClick={this.handleReset}
              className="rounded-2xl border-2 border-rose-200 bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-rose-600 transition-all hover:bg-rose-50"
            >
              Reset Data Cache
            </button>
          </div>
          <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Error Log: {this.state.error?.message || 'Unknown Exception'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

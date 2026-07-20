import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 flex flex-col items-center justify-center text-center">
          <div className="bg-red-50 text-red-500 p-4 rounded-xl font-black uppercase tracking-widest text-sm mb-4">
            Module Error
          </div>
          <p className="text-slate-600 mb-4 max-w-md">There was an error loading this view. Please try again or navigate to a different section.</p>
          <pre className="text-left bg-slate-100 p-4 rounded-xl text-[10px] text-slate-500 overflow-auto max-w-2xl whitespace-pre-wrap">
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-full font-black uppercase tracking-widest text-[11px] shadow hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

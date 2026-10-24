import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by CitationWatch ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem("citation_watch_throwaway_key");
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100"
        >
          <div className="w-full max-w-lg rounded-2xl border border-rose-800/80 bg-slate-900 p-8 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="h-8 w-8 flex-shrink-0" aria-hidden="true" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Something went wrong</h1>
                <p className="text-xs text-rose-300 font-medium">CitationWatch encountered an unexpected UI exception</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-300 break-words">
              {this.state.error?.message || "An unknown rendering error occurred."}
            </div>

            <p className="mt-4 text-xs text-slate-400 leading-relaxed">
              Your preview session state may have become desynchronized. You can reload the application or reset your local preview state.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex min-h-[44px] items-center space-x-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-white"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex min-h-[44px] items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800 hover:border-slate-500 text-slate-200 font-medium px-4 py-2 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>Reset to Overview</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center transition-colors duration-250">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mb-6 text-rose-500 shadow-md">
            <AlertTriangle size={36} />
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 font-poppins">Oops! Something went wrong</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold max-w-md mb-8 leading-relaxed">
            The application encountered an unexpected error. Don't worry, your trip plans and itineraries are safely backed up on our servers.
          </p>

          <button
            onClick={this.handleReset}
            className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-brand hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
          >
            <RotateCcw size={16} />
            Reload Application
          </button>

          {process.env.NODE_ENV !== "production" && this.state.error && (
            <div className="mt-10 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left max-w-lg overflow-auto max-h-44 shadow-sm">
              <p className="text-xs font-mono text-rose-600 dark:text-rose-400 whitespace-pre-wrap leading-relaxed">
                {this.state.error.toString()}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

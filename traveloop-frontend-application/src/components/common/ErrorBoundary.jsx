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
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center pt-safe pb-safe">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6 text-red-500 animate-bounce">
            <AlertTriangle size={32} />
          </div>
          
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-slate-500 text-xs font-semibold max-w-sm mb-6 leading-relaxed">
            The application encountered an unexpected error. Don't worry, your trip plans are safe!
          </p>

          <button
            onClick={this.handleReset}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm shadow-md active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
          >
            <RotateCcw size={16} />
            Reload Application
          </button>

          {process.env.NODE_ENV !== "production" && this.state.error && (
            <div className="mt-8 p-4 rounded-xl bg-slate-100 border border-slate-200 text-left max-w-md overflow-auto max-h-40">
              <p className="text-[10px] font-mono text-red-600 whitespace-pre-wrap">
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

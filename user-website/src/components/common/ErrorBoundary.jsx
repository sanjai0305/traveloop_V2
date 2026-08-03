import React, { Component } from "react";
import ErrorWidget from "./ErrorWidget";

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
      if (ErrorWidget) {
        return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center transition-colors duration-250">
            <ErrorWidget
              error={this.state.error}
              onReload={this.handleReset}
            />
          </div>
        );
      }

      // Defensive fallback if ErrorWidget component is missing
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            The application encountered an unexpected error.
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 rounded-xl bg-teal-600 text-white font-bold text-sm"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

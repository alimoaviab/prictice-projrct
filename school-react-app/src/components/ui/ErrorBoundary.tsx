import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  title?: string;
  message?: string;
  fullScreen?: boolean;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.MODE !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary] Caught error:", error, info);
    }
    this.props.onError?.(error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      return (
        <ErrorFallback
          title={this.props.title ?? "This section ran into a problem"}
          message={
            this.props.message ??
            "Try refreshing this part of the page. If the issue continues, please contact support."
          }
          onRetry={this.handleReset}
          fullScreen={this.props.fullScreen}
        />
      );
    }
    return this.props.children;
  }
}

"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Optional custom fallback. Receives the error and a reset function. */
    fallback?: (error: Error, reset: () => void) => ReactNode;
    /** Optional title shown by the default fallback. */
    title?: string;
    /** Optional message shown by the default fallback. */
    message?: string;
    /** Whether to render a full-screen fallback (used by top-level shells). */
    fullScreen?: boolean;
    /** Hook for telemetry / Sentry. */
    onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * React error boundary used to wrap admin / teacher / parent / student
 * shells so a runtime error in one widget never blanks the whole page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Local logging for debugging; quiet in production.
        if (process.env.NODE_ENV !== "production") {
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

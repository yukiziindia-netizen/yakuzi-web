"use client";
import React, { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Error boundary caught:", error, info);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.resetError) || (
          <div className="min-h-screen flex items-center justify-center p-4 bg-destructive/5">
            <div className="max-w-md w-full space-y-4 bg-white dark:bg-slate-950 rounded-lg p-6 border border-destructive/20">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-foreground">Something went wrong</h2>
                  <p className="text-sm text-muted-foreground mt-1">{this.state.error.message}</p>
                </div>
              </div>
              <Button
                onClick={this.resetError}
                className="w-full"
              >
                Try again
              </Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

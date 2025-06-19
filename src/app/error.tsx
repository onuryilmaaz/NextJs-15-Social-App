"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, MessageCircle } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to error reporting service (Sentry, LogRocket, etc.)
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        {/* Error icon */}
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-destructive" />
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Something Disrupted the Echo
          </h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Don't worry, our team has been
            notified.
          </p>
        </div>

        {/* Error details for development */}
        {process.env.NODE_ENV === "development" && (
          <details className="rounded-lg bg-muted p-4 text-left">
            <summary className="cursor-pointer text-sm font-semibold">
              Error Details (Development Only)
            </summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
              {error.message}
              {error.stack && "\n\nStack trace:\n" + error.stack}
            </pre>
          </details>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Support information */}
        <div className="rounded-lg border bg-card p-4 text-left">
          <h3 className="mb-2 font-medium">Need help?</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>If this error persists:</p>
            <ul className="ml-4 space-y-1">
              <li>• Try refreshing the page</li>
              <li>• Check your internet connection</li>
              <li>• Clear your browser cache</li>
              <li>• Contact our support team</li>
            </ul>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mt-3 flex items-center gap-2"
          >
            <Link href="/support">
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </Link>
          </Button>
        </div>

        {/* Error ID for support */}
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Every echo eventually finds its way. We'll fix this soon.
        </p>
      </div>
    </div>
  );
}

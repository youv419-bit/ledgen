'use client';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
        <a
          href="/dashboard"
          className="flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground mt-4">Error ID: {error.digest}</p>
      )}
    </div>
  );
}

import Link from 'next/link';
import { Target } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <Target className="w-10 h-10 text-blue-500" />
      </div>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-3">Page Not Found</h2>
      <p className="text-muted-foreground text-sm mb-8 max-w-sm">
        This page doesn't exist. Head back to the dashboard to find your leads.
      </p>
      <Link
        href="/dashboard"
        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

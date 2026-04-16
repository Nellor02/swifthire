"use client";

import Link from "next/link";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-red-700 bg-slate-800 p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-100">
          Something went wrong
        </h1>

        <p className="mt-3 text-slate-300">
          An unexpected error occurred while loading this page.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="inline-block rounded-lg bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-600"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
import Link from "next/link";

export default function GlobalNotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-100">
          Page Not Found
        </h1>

        <p className="mt-3 text-slate-300">
          The page you are looking for does not exist or may have been moved.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to Home
          </Link>

          <Link
            href="/login"
            className="inline-block rounded-lg bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-600"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
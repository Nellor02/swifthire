import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-6 py-10 text-slate-100">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 p-10 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
          404 Error
        </p>

        <h1 className="mt-4 text-5xl font-bold text-slate-100">
          Page Not Found
        </h1>

        <p className="mt-6 text-lg leading-8 text-slate-300">
          The page you are looking for does not exist, may have been moved,
          or the link may be incorrect.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Go Home
          </Link>

          <Link
            href="/jobs"
            className="rounded-xl border border-slate-600 bg-slate-900 px-6 py-3 font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
          >
            Browse Jobs
          </Link>

          <Link
            href="/contact"
            className="rounded-xl border border-slate-600 bg-slate-900 px-6 py-3 font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
          >
            Contact Support
          </Link>
        </div>

        <div className="mt-10 border-t border-slate-700 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} SwiftHire
        </div>
      </div>
    </main>
  );
}
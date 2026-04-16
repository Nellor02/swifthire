export default function GlobalLoadingPage() {
  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-500 border-t-blue-500" />
          <div>
            <h1 className="text-xl font-semibold text-slate-100">
              Loading...
            </h1>
            <p className="mt-1 text-slate-300">
              Please wait while the page is being prepared.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
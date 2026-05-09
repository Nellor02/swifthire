import Link from "next/link";

export const metadata = {
  title: "Contact | SwiftHire",
  description: "Contact SwiftHire support.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-900 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Home
        </Link>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-blue-400">
            Contact
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-100">
            Get in Touch
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            Have questions, feedback, bug reports, partnership inquiries, or
            support requests? Reach out and we’ll respond as soon as possible.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <p className="text-sm font-medium uppercase tracking-wide text-blue-400">
                Support Email
              </p>

              <a
                href="mailto:support@useswifthire.com"
                className="mt-3 block break-all text-lg font-semibold text-slate-100 hover:text-blue-400"
              >
                support@useswifthire.com
              </a>

              <p className="mt-3 text-sm text-slate-400">
                Best for platform support, account issues, and technical help.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <p className="text-sm font-medium uppercase tracking-wide text-blue-400">
                Direct Email
              </p>

              <a
                href="mailto:nellorchamp@gmail.com"
                className="mt-3 block break-all text-lg font-semibold text-slate-100 hover:text-blue-400"
              >
                nellorchamp@gmail.com
              </a>

              <p className="mt-3 text-sm text-slate-400">
                For direct communication, partnerships, and business inquiries.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <p className="text-sm font-medium uppercase tracking-wide text-blue-400">
                Telephone
              </p>

              <a
                href="tel:+886979165872"
                className="mt-3 block text-lg font-semibold text-slate-100 hover:text-blue-400"
              >
                +886 979 165 872
              </a>

              <p className="mt-3 text-sm text-slate-400">
                Available for urgent matters and business communication.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-blue-800 bg-blue-950/30 p-6">
            <h2 className="text-xl font-semibold text-slate-100">
              Response Times
            </h2>

            <p className="mt-3 leading-7 text-slate-300">
              We aim to respond to most support requests within 24–72 hours,
              depending on volume and complexity.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
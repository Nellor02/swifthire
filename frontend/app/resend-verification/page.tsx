"use client";

import Link from "next/link";
import { useState } from "react";

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setSending(true);

    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        "http://127.0.0.1:8000";

      const res = await fetch(
        `${apiBaseUrl}/api/accounts/resend-verification-email/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Could not send verification email.");
      }

      setMessage(data?.message || "Verification email sent successfully.");
      setEmail("");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not send verification email."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-md">
        <Link
          href="/login"
          className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Login
        </Link>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-100">
            Resend Verification Email
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Enter the email address you used to create your SwiftHire account.
            If the account exists and is not verified, we will send a new
            verification link.
          </p>

          {message && (
            <div className="mt-6 rounded-lg border border-green-700 bg-green-950/40 px-4 py-3 text-sm text-green-200">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-lg border border-red-700 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Resend Verification Email"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
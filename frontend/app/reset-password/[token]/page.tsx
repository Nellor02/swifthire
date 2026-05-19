"use client";

import { useState } from "react";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function ResetPasswordPage({
  params,
}: PageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const resolvedParams = await params;

      const api =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://127.0.0.1:8000";

      const res = await fetch(
        `${api}/api/accounts/password-reset/${resolvedParams.token}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Reset failed.");
      }

      setMessage("Password reset successfully.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Reset failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h1 className="mb-4 text-2xl font-bold text-white">
          Reset Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white"
          />

          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-slate-300">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
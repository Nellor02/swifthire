"use client";

import Link from "next/link";
import { useState } from "react";
import { authFetch } from "../../../lib/api";
import { getStoredUser } from "../../../lib/auth";
import StatusCard from "../../../components/StatusCard";

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export default function DeleteAccountPage() {
  const user = getStoredUser();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDeleteAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    if (confirmation.trim().toUpperCase() !== "DELETE") {
      setError("Type DELETE to confirm account deletion.");
      return;
    }

    setDeleting(true);

    try {
      const res = await authFetch("/api/accounts/delete-account/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          confirmation,
        }),
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete account.");
      }

      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      window.location.href = "/?account_deleted=1";
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-3xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to delete your account."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Home
        </Link>

        <div className="mt-6 rounded-xl border border-red-800 bg-slate-800 p-8 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-red-400">
            Danger Zone
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-100">
            Delete Account
          </h1>

          <p className="mt-4 leading-7 text-slate-300">
            This action permanently deletes your SwiftHire account and related
            account data. This cannot be undone.
          </p>

          <div className="mt-6 rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
            Deleting your account may remove your profile, applications,
            company records, jobs, conversations, and notifications depending on
            your account type.
          </div>

          {error && (
            <div className="mt-6">
              <StatusCard title="Error" message={error} variant="error" />
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleDeleteAccount}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-red-500"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Type DELETE to confirm
              </label>

              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-red-500"
                placeholder="DELETE"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={deleting}
                className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Permanently Delete Account"}
              </button>

              <Link
                href="/"
                className="rounded-lg bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-600"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
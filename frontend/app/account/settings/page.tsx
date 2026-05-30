"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "../../../lib/api";
import StatusCard from "../../../components/StatusCard";

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  email_verified?: boolean;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export default function AccountSettingsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await authFetch("/api/accounts/me/");
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load account details.");
        }

        setUser(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load account details."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function resendVerification() {
    if (!user?.email) return;

    setMessage("");
    setError("");
    setResending(true);

    try {
      const res = await authFetch("/api/accounts/resend-verification-email/", {
        method: "POST",
        body: JSON.stringify({ email: user.email }),
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Could not resend verification email.");
      }

      setMessage(data?.message || "Verification email sent.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not resend verification email."
      );
    } finally {
      setResending(false);
    }
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

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-8">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="mt-2 text-slate-300">
            Manage your SwiftHire account, security, and account actions.
          </p>

          {loading ? (
            <div className="mt-6">
              <StatusCard
                title="Loading"
                message="Loading account details..."
                variant="info"
              />
            </div>
          ) : error ? (
            <div className="mt-6">
              <StatusCard title="Error" message={error} variant="error" />
            </div>
          ) : user ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-5">
                <h2 className="text-lg font-semibold">Account Information</h2>

                <div className="mt-4 space-y-3 text-sm">
                  <p>
                    <span className="text-slate-400">Username:</span>{" "}
                    <span className="font-medium text-slate-100">
                      {user.username}
                    </span>
                  </p>

                  <p>
                    <span className="text-slate-400">Email:</span>{" "}
                    <span className="font-medium text-slate-100">
                      {user.email || "No email set"}
                    </span>
                  </p>

                  <p>
                    <span className="text-slate-400">Role:</span>{" "}
                    <span className="font-medium capitalize text-slate-100">
                      {user.role}
                    </span>
                  </p>

                  <p>
                    <span className="text-slate-400">Email status:</span>{" "}
                    {user.email_verified ? (
                      <span className="font-medium text-green-400">Verified</span>
                    ) : (
                      <span className="font-medium text-yellow-400">
                        Not verified
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {message && (
                <StatusCard title="Success" message={message} variant="success" />
              )}

              {error && <StatusCard title="Error" message={error} variant="error" />}

              <div className="rounded-lg border border-slate-700 bg-slate-900 p-5">
                <h2 className="text-lg font-semibold">Security</h2>

                <div className="mt-4 flex flex-wrap gap-3">
                  {!user.email_verified && (
                    <button
                      type="button"
                      onClick={resendVerification}
                      disabled={resending}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {resending ? "Sending..." : "Resend Verification Email"}
                    </button>
                  )}

                  <Link
                    href="/forgot-password"
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
                  >
                    Reset Password
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-red-800 bg-red-950/30 p-5">
                <h2 className="text-lg font-semibold text-red-200">
                  Danger Zone
                </h2>

                <p className="mt-2 text-sm text-red-100">
                  Permanently delete your SwiftHire account and related account
                  data.
                </p>

                <Link
                  href="/account/delete"
                  className="mt-4 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Delete Account
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
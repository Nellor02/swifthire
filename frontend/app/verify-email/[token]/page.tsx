"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function VerifyEmailPage({ params }: PageProps) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    async function verifyEmail() {
      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "http://127.0.0.1:8000";

        const response = await fetch(
          `${apiBaseUrl}/api/accounts/verify-email/${token}/`
        );

        const data = await response.json();

        if (response.ok) {
          setSuccess(true);
          setMessage(data.message || "Email verified successfully.");
        } else {
          setSuccess(false);
          setMessage(data.error || "Verification failed.");
        }
      } catch (error) {
        console.error(error);
        setSuccess(false);
        setMessage("Something went wrong while verifying your email.");
      } finally {
        setLoading(false);
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-20">
      <div className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-xl">
        <h1 className="mb-4 text-3xl font-bold text-white">
          Email Verification
        </h1>

        <p
          className={`mb-8 text-sm ${
            loading ? "text-slate-300" : success ? "text-green-400" : "text-red-400"
          }`}
        >
          {loading ? "Please wait..." : message}
        </p>

        <Link
          href="/login"
          className={`inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white transition ${
            success ? "bg-green-600 hover:bg-green-700" : "bg-slate-700 hover:bg-slate-600"
          }`}
        >
          {success ? "Continue to Login" : "Back to Login"}
        </Link>
      </div>
    </main>
  );
}
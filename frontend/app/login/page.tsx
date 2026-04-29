"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import StatusCard from "../../components/StatusCard";
import { useSearchParams } from "next/navigation";


type LoginForm = {
  username: string;
  password: string;
};

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

type EmployerApplication = {
  status: string;
  legacy_account?: boolean;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function extractErrorMessage(data: Record<string, unknown>) {
  if (!data || typeof data !== "object") {
    return "Login failed.";
  }

  if (typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  return "Login failed.";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const registered = searchParams.get("registered");
  const employerPending = searchParams.get("employer_pending");

  const [form, setForm] = useState<LoginForm>({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const tokenRes = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const tokenData = await parseResponseSafely(tokenRes);

      if (!tokenRes.ok) {
        throw new Error(extractErrorMessage(tokenData as Record<string, unknown>));
      }

      const access = tokenData?.access;
      const refresh = tokenData?.refresh;

      if (!access || !refresh) {
        throw new Error("Login failed. Missing authentication tokens.");
      }

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      const meRes = await fetch("http://127.0.0.1:8000/api/accounts/me/", {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      const meData = await parseResponseSafely(meRes);

      if (!meRes.ok) {
        throw new Error(meData?.error || "Failed to load account details.");
      }

      const user = meData as CurrentUser;

      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "seeker") {
        router.push("/seeker");
        return;
      }

      if (user.role === "admin") {
        router.push("/admin/employer-applications");
        return;
      }

      if (user.role === "employer") {
        const appRes = await fetch(
          "http://127.0.0.1:8000/api/accounts/employer-application/me/",
          {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          }
        );

        const appData = await parseResponseSafely(appRes);

        if (!appRes.ok) {
          router.push("/employer/jobs");
          return;
        }

        const employerApp = appData as EmployerApplication;

        if (employerApp.status === "approved" || employerApp.legacy_account) {
          router.push("/employer/jobs");
          return;
        }

        router.push("/employer/application-status");
        return;
      }

      router.push("/");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex flex-col items-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
              SH
            </div>
            <span className="mt-2 text-lg font-semibold text-slate-100">
              SwiftHire
            </span>
          </div>

          <h1 className="text-4xl font-bold text-slate-100">
            Welcome to SwiftHire
          </h1>
          <p className="mt-2 text-slate-300">
            Fast connections. Better careers. Stronger teams.
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            SwiftHire is a modern hiring platform built to connect job seekers
            with their next opportunity and employers with their next valuable
            employee: quickly, clearly, and with less friction.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <StatusCard title="Login Error" message={error} variant="error" />
          </div>
        )}

        {registered === "1" && (
          <div className="mb-6">
            <StatusCard
              title="Account Created"
              message="Your account was created successfully. Please log in."
              variant="success"
            />
          </div>
        )}

        {employerPending === "1" && (
          <div className="mb-6">
            <StatusCard
              title="Employer Application Submitted"
              message="Your employer application was submitted successfully. You can log in to track its status while it is under review."
              variant="success"
            />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-300">
          New here?{" "}
          <Link href="/register" className="font-medium text-blue-400 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "../../../lib/api";
import StatusCard from "../../../components/StatusCard";

type CompletionStatus = {
  complete: boolean;
  percentage: number;
  missing: string[];
};

const fieldLabels: Record<string, string> = {
  full_name: "Full name",
  headline: "Headline",
  bio: "Bio",
  location: "Location",
  skills: "Skills",
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export default function SeekerOnboardingPage() {
  const [status, setStatus] = useState<CompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCompletionStatus() {
      try {
        const res = await authFetch("/api/profiles/completion-status/");
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load profile status.");
        }

        setStatus(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load profile status."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCompletionStatus();
  }, []);

  return (
    <main className="min-h-screen bg-slate-900 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/seeker"
          className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-8">
          <h1 className="text-3xl font-bold">
            Complete Your Seeker Profile
          </h1>

          <p className="mt-3 leading-7 text-slate-300">
            A complete profile helps employers understand your skills,
            background, and job preferences. Finish the required fields before
            using the full seeker dashboard.
          </p>

          {loading ? (
            <div className="mt-6">
              <StatusCard
                title="Checking Profile"
                message="Please wait while we check your onboarding status."
                variant="info"
              />
            </div>
          ) : error ? (
            <div className="mt-6">
              <StatusCard title="Error" message={error} variant="error" />
            </div>
          ) : status ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold">
                    Profile Completion
                  </h2>

                  <span className="text-sm font-semibold text-blue-300">
                    {status.percentage}%
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${status.percentage}%` }}
                  />
                </div>

                {status.complete ? (
                  <div className="mt-5">
                    <StatusCard
                      title="Profile Complete"
                      message="Your required seeker profile fields are complete."
                      variant="success"
                      actionHref="/seeker"
                      actionLabel="Go to Dashboard"
                    />
                  </div>
                ) : (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-200">
                      Missing required fields:
                    </p>

                    <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-300">
                      {status.missing.map((field) => (
                        <li key={field}>
                          {fieldLabels[field] || field}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-900 p-5">
                <h2 className="text-lg font-semibold">
                  What to complete
                </h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(fieldLabels).map(([field, label]) => {
                    const missing = status.missing.includes(field);

                    return (
                      <div
                        key={field}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                          missing
                            ? "border-yellow-700 bg-yellow-950/30 text-yellow-100"
                            : "border-green-700 bg-green-950/30 text-green-100"
                        }`}
                      >
                        {missing ? "Missing" : "Complete"}: {label}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/profile"
                    className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Edit Profile
                  </Link>

                  {status.complete && (
                    <Link
                      href="/seeker"
                      className="rounded-lg bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-600"
                    >
                      Continue to Dashboard
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
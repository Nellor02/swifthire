"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../lib/auth";
import { authFetch } from "../../lib/api";
import StatusCard from "../../components/StatusCard";

type Application = {
  id: number;
  job: number;
  job_title: string;
  applicant: number;
  applicant_username: string;
  applicant_email: string;
  applicant_profile_id?: number | null;
  cover_letter: string;
  cv?: string | null;
  status: string;
  employer_notes?: string;
  created_at: string;
};

type StoredUser = {
  username: string;
  role: string;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function formatStatus(status: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "Pending";
    case "reviewed":
      return "Reviewed";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return status || "Unknown";
  }
}

function getStatusClasses(status: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "bg-blue-900 text-blue-200 border border-blue-700";
    case "reviewed":
      return "bg-yellow-900 text-yellow-200 border border-yellow-700";
    case "accepted":
      return "bg-green-900 text-green-200 border border-green-700";
    case "rejected":
      return "bg-red-900 text-red-200 border border-red-700";
    default:
      return "bg-slate-700 text-slate-200 border border-slate-600";
  }
}

function truncateText(text?: string, maxLength = 180) {
  if (!text) return "No cover letter provided.";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export default function MyApplicationsPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);

    if (!storedUser || storedUser.role !== "seeker") {
      setLoading(false);
      return;
    }

    authFetch("http://127.0.0.1:8000/api/applications/my/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load applications.");
        }

        return data;
      })
      .then((data: Application[]) => {
        setApplications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Could not load applications."
        );
        setLoading(false);
      });
  }, []);

  if (!userChecked) {
    return null;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to view your applications."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        </div>
      </main>
    );
  }

  if (user.role !== "seeker") {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Access Restricted"
            message="Only seekers can view this page."
            variant="error"
            actionHref="/"
            actionLabel="Back to Home"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              My Applications
            </h1>
            <p className="mt-1 text-slate-300">
              Review all jobs you have applied for.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/seeker"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to Dashboard
            </Link>

            <Link
              href="/"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Browse Jobs
            </Link>
          </div>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Applications"
            message="Please wait while your applications are being loaded."
            variant="info"
          />
        ) : error ? (
          <StatusCard title="Error" message={error} variant="error" />
        ) : applications.length === 0 ? (
          <StatusCard
            title="No Applications Yet"
            message="You have not applied for any jobs yet."
            variant="neutral"
            actionHref="/"
            actionLabel="Browse Jobs"
          />
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">
                      Application #{application.id}
                    </p>

                    <Link
                      href={`/my-applications/${application.id}`}
                      className="mt-2 block text-2xl font-semibold text-blue-400 hover:underline"
                    >
                      {application.job_title}
                    </Link>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                      <span
                        className={`rounded px-3 py-1 font-semibold uppercase tracking-wide ${getStatusClasses(
                          application.status
                        )}`}
                      >
                        {formatStatus(application.status)}
                      </span>

                      <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                        Applied on:{" "}
                        {new Date(application.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                        Cover Letter Preview
                      </h3>
                      <p className="whitespace-pre-line text-slate-200">
                        {truncateText(application.cover_letter)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 md:ml-6">
                    <Link
                      href={`/my-applications/${application.id}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      View Details
                    </Link>

                    <Link
                      href={`/jobs/${application.job}`}
                      className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                    >
                      View Job
                    </Link>

                    {application.cv && (
                      <a
                        href={application.cv}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        View CV
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
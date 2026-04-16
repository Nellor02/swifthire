"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../lib/auth";
import { authFetch } from "../../lib/api";
import StatusCard from "../../components/StatusCard";

type SavedJob = {
  id: number;
  job: number;
  job_title: string;
  company_name: string;
  location: string;
  job_type: string;
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

function formatJobType(jobType: string) {
  switch (jobType) {
    case "full_time":
      return "Full-time";
    case "part_time":
      return "Part-time";
    case "contract":
      return "Contract";
    case "internship":
      return "Internship";
    default:
      return jobType || "Not specified";
  }
}

export default function SavedJobsPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);

    if (!storedUser || storedUser.role !== "seeker") {
      setLoading(false);
      return;
    }

    authFetch("http://127.0.0.1:8000/api/saved-jobs/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load saved jobs.");
        }

        return data;
      })
      .then((data: SavedJob[]) => {
        setSavedJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load saved jobs.");
        setLoading(false);
      });
  }, []);

  async function handleRemoveSavedJob(jobId: number) {
    setRemovingId(jobId);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/saved-jobs/${jobId}/`, {
        method: "DELETE",
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to remove saved job.");
      }

      setSavedJobs((prev) => prev.filter((item) => item.job !== jobId));
      setSuccess("Saved job removed.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to remove saved job.");
    } finally {
      setRemovingId(null);
    }
  }

  if (!userChecked) {
    return null;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to view saved jobs."
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
            message="Only seekers can view saved jobs."
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
            <h1 className="text-3xl font-bold text-slate-100">Saved Jobs</h1>
            <p className="mt-1 text-slate-300">
              Revisit jobs you saved for later.
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

        {success && (
          <div className="mb-6">
            <StatusCard title="Success" message={success} variant="success" />
          </div>
        )}

        {loading ? (
          <StatusCard
            title="Loading Saved Jobs"
            message="Please wait while your saved jobs are being loaded."
            variant="info"
          />
        ) : error ? (
          <StatusCard title="Error" message={error} variant="error" />
        ) : savedJobs.length === 0 ? (
          <StatusCard
            title="No Saved Jobs"
            message="You have not saved any jobs yet."
            variant="neutral"
            actionHref="/"
            actionLabel="Browse Jobs"
          />
        ) : (
          <div className="space-y-4">
            {savedJobs.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
              >
                <h2 className="text-2xl font-semibold text-slate-100">
                  {item.job_title}
                </h2>

                <p className="mt-1 text-slate-300">
                  {item.company_name} • {item.location}
                </p>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                  <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                    {formatJobType(item.job_type)}
                  </span>

                  <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                    Saved on: {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/jobs/${item.job}`}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    View Job
                  </Link>

                  <button
                    onClick={() => handleRemoveSavedJob(item.job)}
                    disabled={removingId === item.job}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {removingId === item.job ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
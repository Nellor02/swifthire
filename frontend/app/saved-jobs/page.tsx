"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authFetch } from "../../lib/api";
import { getStoredUser } from "../../lib/auth";
import StatusCard from "../../components/StatusCard";

type SavedJobItem = {
  id: number;
  job: number;
  saved_at?: string;
};

type Job = {
  id: number;
  company: number;
  company_name: string;
  title: string;
  description?: string;
  location: string;
  job_type: string;
  salary_min?: number | null;
  salary_max?: number | null;
  status: string;
  created_at?: string;
};

type ApplicationItem = {
  id: number;
  job: number;
  job_title: string;
  status: string;
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

function formatSalary(job: Job) {
  const min = job.salary_min;
  const max = job.salary_max;

  if (min && max) return `${min} - ${max}`;
  if (min) return `${min}+`;
  if (max) return `Up to ${max}`;
  return "Not specified";
}

function truncateText(text?: string, maxLength = 180) {
  if (!text) return "No description provided.";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function formatApplicationStatus(status: string) {
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
      return status || "Applied";
  }
}

function getApplicationStatusClasses(status: string) {
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

export default function SavedJobsPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);

    if (!storedUser || storedUser.role !== "seeker") {
      setLoading(false);
      return;
    }

    Promise.all([
      authFetch("http://127.0.0.1:8000/api/saved-jobs/").then(async (res) => {
        const data = await parseResponseSafely(res);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load saved jobs.");
        }
        return Array.isArray(data) ? (data as SavedJobItem[]) : [];
      }),
      fetch("http://127.0.0.1:8000/api/jobs/?page=1&page_size=100").then(async (res) => {
        const data = await parseResponseSafely(res);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load jobs.");
        }
        if (Array.isArray(data)) return data as Job[];
        return Array.isArray(data.results) ? (data.results as Job[]) : [];
      }),
    ])
      .then(([savedData, jobsData]) => {
        setSavedJobs(savedData);
        setJobs(jobsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load saved jobs.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user || user.role !== "seeker") {
      setApplications([]);
      return;
    }

    setApplicationsLoading(true);

    authFetch("http://127.0.0.1:8000/api/applications/my/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load applications.");
        }
        return Array.isArray(data) ? (data as ApplicationItem[]) : [];
      })
      .then((data) => {
        setApplications(data);
        setApplicationsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setApplications([]);
        setApplicationsLoading(false);
      });
  }, [user]);

  const applicationsByJobId = useMemo(() => {
    const map = new Map<number, ApplicationItem>();
    for (const application of applications) {
      map.set(application.job, application);
    }
    return map;
  }, [applications]);

  const savedJobCards = useMemo(() => {
    const jobMap = new Map<number, Job>();
    for (const job of jobs) {
      jobMap.set(job.id, job);
    }

    return savedJobs
      .map((savedItem) => ({
        saved: savedItem,
        job: jobMap.get(savedItem.job) || null,
      }))
      .filter((item) => item.job !== null) as { saved: SavedJobItem; job: Job }[];
  }, [savedJobs, jobs]);

  async function handleRemoveSaved(jobId: number) {
    setActionLoadingId(jobId);
    setError("");

    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/saved-jobs/${jobId}/`, {
        method: "DELETE",
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to remove saved job.");
      }

      setSavedJobs((prev) => prev.filter((item) => item.job !== jobId));
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to remove saved job."
      );
    } finally {
      setActionLoadingId(null);
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
              Keep track of opportunities you want to revisit.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Browse Jobs
            </Link>

            <Link
              href="/my-applications"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              My Applications
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <StatusCard title="Error" message={error} variant="error" />
          </div>
        )}

        {loading ? (
          <StatusCard
            title="Loading Saved Jobs"
            message="Please wait while your saved jobs are loading."
            variant="info"
          />
        ) : savedJobCards.length === 0 ? (
          <StatusCard
            title="No Saved Jobs Yet"
            message="Save jobs you are interested in so you can return to them later."
            variant="neutral"
            actionHref="/"
            actionLabel="Browse Jobs"
          />
        ) : (
          <div className="space-y-4">
            {savedJobCards.map(({ saved, job }) => {
              const existingApplication = applicationsByJobId.get(job.id);

              return (
                <div
                  key={saved.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-2xl font-semibold text-blue-400 hover:underline"
                        >
                          {job.title}
                        </Link>

                        {existingApplication && (
                          <span
                            className={`rounded px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getApplicationStatusClasses(
                              existingApplication.status
                            )}`}
                          >
                            {formatApplicationStatus(existingApplication.status)}
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        <Link
                          href={`/companies/${job.company}`}
                          className="text-slate-300 hover:text-blue-400 hover:underline"
                        >
                          {job.company_name}
                        </Link>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                        <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                          {job.location || "No location"}
                        </span>

                        <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                          {formatJobType(job.job_type)}
                        </span>

                        <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                          Salary: {formatSalary(job)}
                        </span>

                        {saved.saved_at && (
                          <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                            Saved: {new Date(saved.saved_at).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                          Description
                        </h3>
                        <p className="whitespace-pre-line text-slate-200">
                          {truncateText(job.description)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 md:ml-6">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        View Job
                      </Link>

                      <Link
                        href={`/companies/${job.company}`}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                      >
                        View Company
                      </Link>

                      {applicationsLoading ? (
                        <span className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300">
                          Checking...
                        </span>
                      ) : existingApplication ? (
                        <Link
                          href={`/my-applications/${existingApplication.id}`}
                          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                        >
                          Applied
                        </Link>
                      ) : (
                        <Link
                          href={`/jobs/${job.id}/apply`}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          Apply Now
                        </Link>
                      )}

                      <button
                        onClick={() => handleRemoveSaved(job.id)}
                        disabled={actionLoadingId === job.id}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoadingId === job.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
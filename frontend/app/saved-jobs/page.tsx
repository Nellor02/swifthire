"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authFetch, getFileUrl } from "../../lib/api";
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
  company_logo?: string | null;
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
      authFetch("/api/saved-jobs/").then(async (res) => {
        const data = await parseResponseSafely(res);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load saved jobs.");
        }
        return Array.isArray(data) ? data : [];
      }),
      fetch("/api/jobs/?page=1&page_size=100").then(async (res) => {
        const data = await parseResponseSafely(res);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load jobs.");
        }
        if (Array.isArray(data)) return data;
        return Array.isArray(data.results) ? data.results : [];
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

    authFetch("/api/applications/my/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load applications.");
        }
        return Array.isArray(data) ? data : [];
      })
      .then((data) => {
        setApplications(data);
        setApplicationsLoading(false);
      })
      .catch(() => {
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
      const res = await authFetch(`/api/saved-jobs/${jobId}/`, {
        method: "DELETE",
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to remove saved job.");
      }

      setSavedJobs((prev) => prev.filter((item) => item.job !== jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove saved job.");
    } finally {
      setActionLoadingId(null);
    }
  }

  if (!userChecked) return null;

  if (!user || user.role !== "seeker") {
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
        <h1 className="text-3xl font-bold text-slate-100 mb-6">Saved Jobs</h1>

        {loading ? (
          <StatusCard title="Loading" message="Loading saved jobs..." variant="info" />
        ) : savedJobCards.length === 0 ? (
          <StatusCard title="No Saved Jobs" message="Save jobs to see them here." variant="neutral" />
        ) : (
          <div className="space-y-4">
            {savedJobCards.map(({ saved, job }) => {
              const logoUrl = getFileUrl(job.company_logo);
              const existingApplication = applicationsByJobId.get(job.id);

              return (
                <div key={saved.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                  <div className="flex gap-4">
                    {/* LOGO */}
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
                      {logoUrl ? (
                        <img src={logoUrl} className="h-full w-full object-cover" />
                      ) : (
                        job.company_name.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1">
                      <Link href={`/jobs/${job.id}`} className="text-xl text-blue-400">
                        {job.title}
                      </Link>

                      <p className="text-slate-300">{job.company_name}</p>

                      <p className="text-slate-400 mt-2">
                        {formatJobType(job.job_type)} • {job.location}
                      </p>

                      <p className="text-slate-400">
                        Salary: {formatSalary(job)}
                      </p>

                      {existingApplication && (
                        <span className={`mt-2 inline-block px-2 py-1 text-xs ${getApplicationStatusClasses(existingApplication.status)}`}>
                          {formatApplicationStatus(existingApplication.status)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveSaved(job.id)}
                      className="bg-red-600 px-3 py-2 rounded text-white"
                    >
                      Remove
                    </button>
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
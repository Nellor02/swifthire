"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthStatus from "../components/AuthStatus";
import Pagination from "../components/Pagination";
import StatusCard from "../components/StatusCard";
import { authFetch } from "../lib/api";
import { getStoredUser } from "../lib/auth";

type Job = {
  id: number;
  title: string;
  description?: string;
  company_name: string;
  location: string;
  job_type: string;
  salary_min?: number | null;
  salary_max?: number | null;
  status: string;
  created_at?: string;
};

type PaginatedJobsResponse = {
  count?: number;
  total_pages?: number;
  current_page?: number;
  next?: number | null;
  previous?: number | null;
  results?: Job[];
};

type SavedJobItem = {
  id: number;
  job: number;
};

type StoredUser = {
  username: string;
  role: string;
};

function normalizeLocation(location: string) {
  return (location || "").trim();
}

function normalizeJobType(jobType: string) {
  return (jobType || "").trim();
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

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

const PAGE_SIZE = 4;

export default function HomePage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);
  const [user, setUser] = useState<StoredUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);
  const [savingJobId, setSavingJobId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch(`http://127.0.0.1:8000/api/jobs/?page=1&page_size=100`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load jobs.");
        }

        return data;
      })
      .then((data: PaginatedJobsResponse | Job[]) => {
        const results = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : [];

        setAllJobs(results);
      })
      .catch((err) => {
        console.error(err);
        setAllJobs([]);
      });
  }, []);

  useEffect(() => {
    if (user?.role !== "seeker") {
      setSavedJobIds([]);
      return;
    }

    setSavedJobsLoading(true);
    setSaveError("");

    authFetch("http://127.0.0.1:8000/api/saved-jobs/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load saved jobs.");
        }

        return data;
      })
      .then((data: SavedJobItem[]) => {
        const ids = Array.isArray(data)
          ? data
              .map((item) => Number(item.job))
              .filter((id) => Number.isFinite(id))
          : [];
        setSavedJobIds(ids);
        setSavedJobsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setSavedJobsLoading(false);
      });
  }, [user]);

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch(`http://127.0.0.1:8000/api/jobs/?page=${currentPage}&page_size=${PAGE_SIZE}`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load jobs.");
        }

        return data;
      })
      .then((data: PaginatedJobsResponse | Job[]) => {
        const results = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : [];

        let filteredJobs = [...results];

        if (searchTerm.trim()) {
          const q = searchTerm.trim().toLowerCase();
          filteredJobs = filteredJobs.filter((job) =>
            (job.title || "").toLowerCase().includes(q)
          );
        }

        if (selectedLocation) {
          filteredJobs = filteredJobs.filter(
            (job) => normalizeLocation(job.location) === selectedLocation
          );
        }

        if (selectedJobType) {
          filteredJobs = filteredJobs.filter(
            (job) => normalizeJobType(job.job_type) === selectedJobType
          );
        }

        switch (sortBy) {
          case "salary_high":
            filteredJobs.sort(
              (a, b) =>
                (b.salary_max || b.salary_min || 0) -
                (a.salary_max || a.salary_min || 0)
            );
            break;
          case "salary_low":
            filteredJobs.sort(
              (a, b) =>
                (a.salary_min || a.salary_max || 0) -
                (b.salary_min || b.salary_max || 0)
            );
            break;
          case "title_asc":
            filteredJobs.sort((a, b) =>
              (a.title || "").localeCompare(b.title || "")
            );
            break;
          case "title_desc":
            filteredJobs.sort((a, b) =>
              (b.title || "").localeCompare(a.title || "")
            );
            break;
          case "newest":
          default:
            filteredJobs.sort(
              (a, b) =>
                new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime()
            );
            break;
        }

        setJobs(filteredJobs);

        const total =
          Array.isArray(data) ? filteredJobs.length : data.count ?? filteredJobs.length;
        const pages =
          Array.isArray(data)
            ? Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE))
            : data.total_pages ?? 1;

        setTotalCount(total);
        setTotalPages(pages);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load jobs.");
        setJobs([]);
        setTotalCount(0);
        setTotalPages(1);
        setLoading(false);
      });
  }, [currentPage, searchTerm, selectedLocation, selectedJobType, sortBy]);

  const locations = useMemo(() => {
    if (!Array.isArray(allJobs)) return [];

    const uniqueLocations = Array.from(
      new Set(allJobs.map((job) => normalizeLocation(job.location)).filter(Boolean))
    );

    return uniqueLocations.sort((a, b) => a.localeCompare(b));
  }, [allJobs]);

  const jobTypes = useMemo(() => {
    if (!Array.isArray(allJobs)) return [];

    const uniqueJobTypes = Array.from(
      new Set(allJobs.map((job) => normalizeJobType(job.job_type)).filter(Boolean))
    );

    return uniqueJobTypes.sort((a, b) => a.localeCompare(b));
  }, [allJobs]);

  async function handleToggleSave(jobId: number) {
    if (user?.role !== "seeker") {
      setSaveError("Only seekers can save jobs.");
      return;
    }

    setSavingJobId(jobId);
    setSaveError("");

    const isSaved = savedJobIds.includes(jobId);

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/saved-jobs/${jobId}/`,
        {
          method: isSaved ? "DELETE" : "POST",
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update saved job.");
      }

      setSavedJobIds((prev) =>
        isSaved ? prev.filter((id) => id !== jobId) : [...prev, jobId]
      );
    } catch (err) {
      console.error(err);
      setSaveError(
        err instanceof Error ? err.message : "Failed to update saved job."
      );
    } finally {
      setSavingJobId(null);
    }
  }

  function goToPreviousPage() {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }

  function goToNextPage() {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }

  function openJobDetail(jobId: number) {
    router.push(`/jobs/${jobId}`);
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-7xl">
        <AuthStatus />

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-100">Find Your Next Job</h1>
          <p className="mt-2 text-slate-300">
            Browse available opportunities and apply in just a few clicks.
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <input
            type="text"
            placeholder="Search jobs by title..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 md:col-span-2"
          />

          <select
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          <select
            value={selectedJobType}
            onChange={(e) => {
              setSelectedJobType(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
          >
            <option value="">All Job Types</option>
            {jobTypes.map((jobType) => (
              <option key={jobType} value={jobType}>
                {formatJobType(jobType)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-300">
            Showing {jobs.length} of {totalCount} job{totalCount !== 1 ? "s" : ""}
          </p>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 outline-none focus:border-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="salary_high">Highest Salary</option>
            <option value="salary_low">Lowest Salary</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
          </select>
        </div>

        {saveError && (
          <div className="mb-6">
            <StatusCard title="Save Error" message={saveError} variant="error" />
          </div>
        )}

        {loading ? (
          <StatusCard
            title="Loading Jobs"
            message="Please wait while jobs are loading."
            variant="info"
          />
        ) : error ? (
          <StatusCard title="Error" message={error} variant="error" />
        ) : jobs.length === 0 ? (
          <StatusCard
            title="No Jobs Found"
            message="No jobs matched your current filters."
            variant="neutral"
          />
        ) : (
          <>
            <div className="grid gap-4">
              {jobs.map((job) => {
                const isSaved = savedJobIds.includes(job.id);

                return (
                  <div
                    key={job.id}
                    onClick={() => openJobDetail(job.id)}
                    className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm transition hover:border-slate-500 hover:bg-slate-800/90"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openJobDetail(job.id);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <h2 className="text-2xl font-semibold text-slate-100">
                          {job.title}
                        </h2>

                        <p className="mt-1 text-slate-300">{job.company_name}</p>

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
                        </div>

                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                              Description
                            </h3>

                            <span className="text-xs text-blue-400">
                              Click card for full details
                            </span>
                          </div>

                          <p className="whitespace-pre-line text-slate-200">
                            {truncateText(job.description)}
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex flex-wrap gap-3 md:ml-6"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/jobs/${job.id}`}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          View Job
                        </Link>

                        {user?.role === "seeker" && (
                          <button
                            onClick={() => handleToggleSave(job.id)}
                            disabled={savingJobId === job.id || savedJobsLoading}
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                              isSaved
                                ? "bg-yellow-600 hover:bg-yellow-700"
                                : "bg-slate-700 hover:bg-slate-600"
                            }`}
                          >
                            {savingJobId === job.id
                              ? "Saving..."
                              : isSaved
                              ? "Saved"
                              : "Save"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          </>
        )}
      </div>
    </main>
  );
}
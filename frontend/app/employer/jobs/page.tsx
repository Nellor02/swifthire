"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../../lib/auth";
import { authFetch } from "../../../lib/api";
import StatusCard from "../../../components/StatusCard";
import Pagination from "../../../components/Pagination";

type Job = {
  id: number;
  title: string;
  description?: string;
  company: number;
  company_name: string;
  location: string;
  job_type: string;
  status: string;
};

type PaginatedEmployerJobsResponse = {
  count: number;
  total_pages: number;
  current_page: number;
  next: number | null;
  previous: number | null;
  results: Job[];
};

type Stats = {
  total_jobs: number;
  total_applications: number;
  total_shortlisted: number;
};

type EmployerApplicationStatus = {
  status: string;
  legacy_account?: boolean;
};

type Company = {
  id: number;
  owner: number;
  owner_username: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  description: string;
  jobs_count: number;
};

function getJobTypeClasses(jobType: string) {
  switch (jobType?.toLowerCase()) {
    case "full_time":
      return "bg-blue-900 text-blue-200 border border-blue-700";
    case "part_time":
      return "bg-purple-900 text-purple-200 border border-purple-700";
    case "contract":
      return "bg-yellow-900 text-yellow-200 border border-yellow-700";
    case "internship":
      return "bg-green-900 text-green-200 border border-green-700";
    default:
      return "bg-slate-700 text-slate-200 border border-slate-600";
  }
}

function getStatusClasses(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-900 text-green-200 border border-green-700";
    case "draft":
      return "bg-yellow-900 text-yellow-200 border border-yellow-700";
    case "closed":
      return "bg-red-900 text-red-200 border border-red-700";
    default:
      return "bg-slate-700 text-slate-200 border border-slate-600";
  }
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
      return jobType;
  }
}

function truncateText(text?: string, maxLength = 220) {
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

const PAGE_SIZE = 5;

export default function EmployerJobsPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);
  const [isApprovedEmployer, setIsApprovedEmployer] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState(true);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState<Stats>({
    total_jobs: 0,
    total_applications: 0,
    total_shortlisted: 0,
  });

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      setUserChecked(true);
      setIsLoggedIn(false);
      setIsEmployer(false);
      setLoading(false);
      setApprovalLoading(false);
      setCompanyLoading(false);
      return;
    }

    setUserChecked(true);
    setIsLoggedIn(true);

    if (!["employer", "admin"].includes(user.role)) {
      setIsEmployer(false);
      setLoading(false);
      setApprovalLoading(false);
      setCompanyLoading(false);
      return;
    }

    setIsEmployer(true);

    if (user.role === "admin") {
      setIsApprovedEmployer(true);
      setApprovalLoading(false);
      return;
    }

    authFetch("http://127.0.0.1:8000/api/accounts/employer-application/me/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          setIsApprovedEmployer(true);
          setApprovalLoading(false);
          return;
        }

        const typed = data as EmployerApplicationStatus;

        if (typed.legacy_account || typed.status === "approved") {
          setIsApprovedEmployer(true);
        } else {
          setIsApprovedEmployer(false);
        }

        setApprovalLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsApprovedEmployer(true);
        setApprovalLoading(false);
      });
  }, []);

  useEffect(() => {
    if (
      !userChecked ||
      !isLoggedIn ||
      !isEmployer ||
      approvalLoading ||
      !isApprovedEmployer
    ) {
      if (!approvalLoading && !isApprovedEmployer) {
        setLoading(false);
        setCompanyLoading(false);
      }
      return;
    }

    setLoading(true);
    setError("");

    authFetch(
      `http://127.0.0.1:8000/api/jobs/employer/?page=${currentPage}&page_size=${PAGE_SIZE}`
    )
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to fetch employer jobs.");
        }

        return data;
      })
      .then((data: PaginatedEmployerJobsResponse) => {
        setJobs(Array.isArray(data.results) ? data.results : []);
        setTotalCount(data.count || 0);
        setTotalPages(data.total_pages || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load jobs.");
        setLoading(false);
      });
  }, [userChecked, isLoggedIn, isEmployer, approvalLoading, isApprovedEmployer, currentPage]);

  useEffect(() => {
    if (
      !userChecked ||
      !isLoggedIn ||
      !isEmployer ||
      approvalLoading ||
      !isApprovedEmployer
    ) {
      return;
    }

    authFetch("http://127.0.0.1:8000/api/jobs/dashboard/stats/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);
        if (!res.ok) {
          return;
        }
        setStats(data as Stats);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [userChecked, isLoggedIn, isEmployer, approvalLoading, isApprovedEmployer]);

  useEffect(() => {
    if (
      !userChecked ||
      !isLoggedIn ||
      !isEmployer ||
      approvalLoading ||
      !isApprovedEmployer
    ) {
      return;
    }

    setCompanyLoading(true);

    authFetch("http://127.0.0.1:8000/api/companies/me/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load company profile.");
        }
        return data;
      })
      .then((data: Company) => {
        setCompany(data);
        setCompanyLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setCompany(null);
        setCompanyLoading(false);
      });
  }, [userChecked, isLoggedIn, isEmployer, approvalLoading, isApprovedEmployer]);

  async function handleDelete(jobId: number) {
    const confirmDelete = confirm("Are you sure you want to delete this job?");
    if (!confirmDelete) return;

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/jobs/${jobId}/delete/`,
        {
          method: "DELETE",
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete job.");
      }

      const newCount = totalCount - 1;
      const newTotalPages = Math.max(1, Math.ceil(newCount / PAGE_SIZE));

      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      } else {
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
        setTotalCount(newCount);
        setTotalPages(newTotalPages);
      }

      setStats((prev) => ({
        ...prev,
        total_jobs: Math.max(0, prev.total_jobs - 1),
      }));

      setCompany((prev) =>
        prev
          ? {
              ...prev,
              jobs_count: Math.max(0, prev.jobs_count - 1),
            }
          : prev
      );
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function goToPreviousPage() {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }

  function goToNextPage() {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }

  if (!userChecked) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-6xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to view employer dashboard."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        </div>
      </main>
    );
  }

  if (!isEmployer) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-6xl">
          <StatusCard
            title="Access Restricted"
            message="Only employers and admins can access this page."
            variant="error"
            actionHref="/"
            actionLabel="Back to Home"
          />
        </div>
      </main>
    );
  }

  if (approvalLoading) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-6xl">
          <StatusCard
            title="Checking Account Status"
            message="Please wait while we verify your employer account approval."
            variant="info"
          />
        </div>
      </main>
    );
  }

  if (!isApprovedEmployer) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-6xl">
          <StatusCard
            title="Employer Access Locked"
            message="Your employer account is pending approval or has been rejected. Review your application status for more details."
            variant="warning"
            actionHref="/employer/application-status"
            actionLabel="View Application Status"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Employer Dashboard
            </h1>
            <p className="mt-1 text-slate-300">
              Manage your job postings and track performance.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to Home
            </Link>

            <Link
              href="/talent"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Talent Search
            </Link>

            <Link
              href="/employer/accepted"
              className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
            >
              Accepted Candidates
            </Link>

            <Link
              href="/employer/jobs/new"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Create Job
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <p className="text-sm text-slate-400">Jobs Posted</p>
            <h2 className="text-2xl font-bold text-white">
              {stats.total_jobs}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <p className="text-sm text-slate-400">Applications</p>
            <h2 className="text-2xl font-bold text-white">
              {stats.total_applications}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <p className="text-sm text-slate-400">Accepted Candidates</p>
            <h2 className="text-2xl font-bold text-white">
              {stats.total_shortlisted}
            </h2>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                Company Profile
              </h2>
              <p className="mt-1 text-slate-300">
                Manage how your company appears to candidates on SwiftHire.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/employer/company"
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
              >
                Edit Company
              </Link>

              {company && (
                <Link
                  href={`/companies/${company.id}`}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                >
                  View Public Profile
                </Link>
              )}
            </div>
          </div>

          {companyLoading ? (
            <p className="mt-4 text-slate-300">Loading company profile...</p>
          ) : company ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-3 text-slate-300">
                <p>
                  <span className="font-semibold text-slate-100">Name:</span>{" "}
                  {company.name || "Not provided"}
                </p>
                <p>
                  <span className="font-semibold text-slate-100">Email:</span>{" "}
                  {company.email || "Not provided"}
                </p>
                <p>
                  <span className="font-semibold text-slate-100">Phone:</span>{" "}
                  {company.phone || "Not provided"}
                </p>
              </div>

              <div className="space-y-3 text-slate-300">
                <p>
                  <span className="font-semibold text-slate-100">Website:</span>{" "}
                  {company.website || "Not provided"}
                </p>
                <p>
                  <span className="font-semibold text-slate-100">Jobs Live:</span>{" "}
                  {company.jobs_count}
                </p>
                <p>
                  <span className="font-semibold text-slate-100">Address:</span>{" "}
                  {company.address || "Not provided"}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="font-semibold text-slate-100">Description:</p>
                <p className="mt-2 whitespace-pre-line text-slate-300">
                  {company.description || "No description provided yet."}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-slate-400">
              Company profile could not be loaded.
            </p>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-300">
            Showing {jobs.length} of {totalCount} job
            {totalCount !== 1 ? "s" : ""}
          </p>

          <p className="text-sm text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Jobs"
            message="Please wait while your jobs are loading."
            variant="info"
          />
        ) : error ? (
          <StatusCard title="Error" message={error} variant="error" />
        ) : jobs.length === 0 ? (
          <StatusCard
            title="No Jobs Found"
            message="You haven't posted any jobs yet."
            variant="neutral"
            actionHref="/employer/jobs/new"
            actionLabel="Create Your First Job"
          />
        ) : (
          <>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-slate-100">
                        {job.title}
                      </h2>

                      <p className="mt-1 text-slate-300">
                        {job.company_name} • {job.location}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        <span
                          className={`rounded px-3 py-1 font-semibold ${getJobTypeClasses(
                            job.job_type
                          )}`}
                        >
                          {formatJobType(job.job_type)}
                        </span>

                        <span
                          className={`rounded px-3 py-1 font-semibold ${getStatusClasses(
                            job.status
                          )}`}
                        >
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
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
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                      >
                        View Details
                      </Link>

                      <Link
                        href={`/employer/jobs/${job.id}/applicants`}
                        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                      >
                        View Applicants
                      </Link>

                      <Link
                        href={`/employer/jobs/${job.id}/edit`}
                        className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                      >
                        Edit Job
                      </Link>

                      <button
                        onClick={() => handleDelete(job.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
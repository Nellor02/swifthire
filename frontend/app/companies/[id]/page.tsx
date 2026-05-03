"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import StatusCard from "../../../components/StatusCard";
import { getStoredUser } from "../../../lib/auth";
import { authFetch, getFileUrl } from "../../../lib/api";

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
  logo?: string | null;
  jobs_count: number;
};

type Job = {
  id: number;
  company: number;
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

export default function CompanyDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const companyId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (!companyId) return;

    setLoading(true);
    setError("");

    fetch(`http://127.0.0.1:8000/api/companies/${companyId}/`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load company.");
        }

        return data;
      })
      .then((data: Company) => {
        setCompany(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load company.");
        setLoading(false);
      });
  }, [companyId]);

  useEffect(() => {
    if (!company) return;

    setJobsLoading(true);

    fetch("http://127.0.0.1:8000/api/jobs/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load jobs.");
        }

        return data;
      })
      .then((data: Job[]) => {
        const items = Array.isArray(data) ? data : [];
        const relatedJobs = items.filter((job) => job.company === company.id);
        setJobs(relatedJobs);
        setJobsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setJobsLoading(false);
      });
  }, [company]);

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

        return data;
      })
      .then((data: ApplicationItem[]) => {
        setApplications(Array.isArray(data) ? data : []);
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-6xl">
          <StatusCard
            title="Loading Company"
            message="Please wait while the company profile is loading."
            variant="info"
          />
        </div>
      </main>
    );
  }

  if (error || !company) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-6xl">
          <StatusCard
            title="Error"
            message={error || "Company not found."}
            variant="error"
            actionHref="/companies"
            actionLabel="Back to Companies"
          />
        </div>
      </main>
    );
  }

  const companyLogoUrl = getFileUrl(company.logo);

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-xl font-bold text-slate-300">
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt={`${company.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                company.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div>
              <h1 className="text-4xl font-bold text-slate-100">{company.name}</h1>
              <p className="mt-2 text-slate-300">
                Explore this company and the jobs they are hiring for.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/companies"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to Companies
            </Link>

            <Link
              href="/"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Back to Jobs
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-100">Company Profile</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3 text-slate-300">
              <p>
                <span className="font-semibold text-slate-100">Email:</span>{" "}
                {company.email || "Not provided"}
              </p>
              <p>
                <span className="font-semibold text-slate-100">Phone:</span>{" "}
                {company.phone || "Not provided"}
              </p>
              <p>
                <span className="font-semibold text-slate-100">Website:</span>{" "}
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {company.website}
                  </a>
                ) : (
                  "Not provided"
                )}
              </p>
            </div>

            <div className="space-y-3 text-slate-300">
              <p>
                <span className="font-semibold text-slate-100">Address:</span>{" "}
                {company.address || "Not provided"}
              </p>
              <p>
                <span className="font-semibold text-slate-100">Open Jobs:</span>{" "}
                {company.jobs_count}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 text-lg font-semibold text-slate-100">About</h3>
            <p className="whitespace-pre-line text-slate-200">
              {company.description || "No company description provided."}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-100">Open Jobs</h2>

          {jobsLoading ? (
            <p className="mt-4 text-slate-300">Loading company jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="mt-4 text-slate-400">
              This company has no public jobs available right now.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {jobs.map((job) => {
                const existingApplication = applicationsByJobId.get(job.id);

                return (
                  <div
                    key={job.id}
                    className="rounded-lg border border-slate-700 bg-slate-900 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="text-xl font-semibold text-blue-400 hover:underline"
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

                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                          <span className="rounded border border-slate-600 bg-slate-800 px-3 py-1">
                            {job.location || "No location"}
                          </span>

                          <span className="rounded border border-slate-600 bg-slate-800 px-3 py-1">
                            {formatJobType(job.job_type)}
                          </span>

                          <span className="rounded border border-slate-600 bg-slate-800 px-3 py-1">
                            Salary: {formatSalary(job)}
                          </span>
                        </div>

                        <div className="mt-4">
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

                        {user?.role === "seeker" &&
                          (applicationsLoading ? (
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
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getStoredUser } from "../../../lib/auth";
import { authFetch, getFileUrl } from "../../../lib/api";
import StatusCard from "../../../components/StatusCard";

type ApplicationDetail = {
  id: number;
  job: number;
  job_title: string;
  company_name?: string;
  company_logo?: string | null;
  applicant: number;
  applicant_username: string;
  applicant_email: string;
  applicant_profile_id?: number | null;
  applicant_profile_picture?: string | null;
  cover_letter: string;
  cv?: string | null;
  status: string;
  employer_notes?: string;
  created_at: string;
};

type JobDetail = {
  id: number;
  title: string;
  description?: string;
  company_name?: string;
  company_logo?: string | null;
  location?: string;
  job_type?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  status?: string;
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
  return { error: text || `Request failed (${res.status})` };
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

function formatJobType(jobType?: string) {
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

function formatSalary(job: JobDetail) {
  if (job.salary_min && job.salary_max) {
    return `${job.salary_min} - ${job.salary_max}`;
  }
  if (job.salary_min) return `${job.salary_min}+`;
  if (job.salary_max) return `Up to ${job.salary_max}`;
  return "Not specified";
}

export default function SeekerApplicationDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const applicationId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [jobLoading, setJobLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);
  }, []);

  useEffect(() => {
    if (!userChecked || user?.role !== "seeker" || !applicationId) {
      return;
    }

    setLoading(true);
    setError("");

    authFetch(`/api/applications/my/${applicationId}/`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load application details.");
        }

        return data;
      })
      .then((data: ApplicationDetail) => {
        setApplication(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load application details."
        );
        setLoading(false);
      });
  }, [userChecked, user, applicationId]);

  useEffect(() => {
    if (!application?.job) return;

    setJobLoading(true);

    fetch(`http://127.0.0.1:8000/api/jobs/${application.job}/`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load related job details.");
        }

        return data;
      })
      .then((data: JobDetail) => {
        setJobDetail(data);
        setJobLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setJobLoading(false);
      });
  }, [application?.job]);

  if (!userChecked) {
    return null;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to view application details."
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

  const backToApplicationsHref = "/my-applications";
  const backToJobHref = application ? `/jobs/${application.job}` : "/";
  const applicationLogoUrl = getFileUrl(application?.company_logo);
  const jobLogoUrl = getFileUrl(jobDetail?.company_logo);
  const displayLogoUrl = applicationLogoUrl || jobLogoUrl;
  const companyName =
    application?.company_name || jobDetail?.company_name || "Company";
  const companyInitials = companyName.slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Application Detail
            </h1>
            <p className="mt-1 text-slate-300">
              Review your submitted application and related job details.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={backToApplicationsHref}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to My Applications
            </Link>

            <Link
              href="/seeker"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Application"
            message="Please wait while your application details are loading."
            variant="info"
          />
        ) : error ? (
          <StatusCard
            title="Error"
            message={error}
            variant="error"
            actionHref={backToApplicationsHref}
            actionLabel="Back to My Applications"
          />
        ) : !application ? (
          <StatusCard
            title="Application Not Found"
            message="This application does not exist or is unavailable."
            variant="neutral"
            actionHref={backToApplicationsHref}
            actionLabel="Back to My Applications"
          />
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-sm font-bold text-slate-300">
                  {displayLogoUrl ? (
                    <img
                      src={displayLogoUrl}
                      alt={`${companyName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    companyInitials
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm text-slate-400">
                    Application #{application.id}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-slate-100">
                      {application.job_title}
                    </h2>

                    <span
                      className={`rounded px-3 py-1 text-sm font-semibold uppercase tracking-wide ${getStatusClasses(
                        application.status
                      )}`}
                    >
                      {formatStatus(application.status)}
                    </span>
                  </div>

                  <p className="mt-2 text-slate-300">{companyName}</p>

                  <p className="mt-2 text-slate-300">
                    Submitted on {new Date(application.created_at).toLocaleString()}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={backToJobHref}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      View Job
                    </Link>

                    {application.cv && (
                      <a
                        href={getFileUrl(application.cv)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                      >
                        View Uploaded CV
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <h3 className="mb-3 text-xl font-semibold text-slate-100">
                Your Cover Letter
              </h3>

              <p className="whitespace-pre-line text-slate-200">
                {application.cover_letter || "No cover letter provided."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-100">
                  Related Job
                </h3>

                <Link
                  href={backToJobHref}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Open Job Detail
                </Link>
              </div>

              {jobLoading ? (
                <p className="text-slate-300">Loading job details...</p>
              ) : jobDetail ? (
                <div>
                  <div className="flex gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-sm font-bold text-slate-300">
                      {jobLogoUrl ? (
                        <img
                          src={jobLogoUrl}
                          alt={`${jobDetail.company_name || "Company"} logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (jobDetail.company_name || "SH").slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-slate-100">
                        {jobDetail.title}
                      </h4>

                      <p className="mt-2 text-slate-300">
                        {jobDetail.company_name || "Company not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                    <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                      {jobDetail.location || "No location"}
                    </span>

                    <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                      {formatJobType(jobDetail.job_type)}
                    </span>

                    <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                      Salary: {formatSalary(jobDetail)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="whitespace-pre-line text-slate-200">
                      {jobDetail.description || "No description provided."}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400">
                  Related job details could not be loaded.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
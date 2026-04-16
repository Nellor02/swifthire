"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ApplyForm from "../../../../components/ApplyForm";
import StatusCard from "../../../../components/StatusCard";
import { getStoredUser } from "../../../../lib/auth";

type Job = {
  id: number;
  title: string;
  description?: string;
  company_name?: string;
  location?: string;
  job_type?: string;
  salary_min?: number | null;
  salary_max?: number | null;
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

function formatSalary(job: Job) {
  if (job.salary_min && job.salary_max) {
    return `${job.salary_min} - ${job.salary_max}`;
  }
  if (job.salary_min) return `${job.salary_min}+`;
  if (job.salary_max) return `Up to ${job.salary_max}`;
  return "Not specified";
}

export default function ApplyPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawJobId = params?.id;
  const jobId = Array.isArray(rawJobId) ? rawJobId[0] : rawJobId;

  const [job, setJob] = useState<Job | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [userChecked, setUserChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);
  }, []);

  useEffect(() => {
    if (!jobId) return;

    fetch(`http://127.0.0.1:8000/api/jobs/${jobId}/`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load job.");
        }

        return data;
      })
      .then((data: Job) => {
        setJob(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load job.");
        setLoading(false);
      });
  }, [jobId]);

  if (!userChecked) {
    return null;
  }

  const backToJobHref = jobId ? `/jobs/${jobId}` : "/";
  const isLoggedOut = !user;
  const isEmployerOrAdmin =
    user?.role === "employer" || user?.role === "admin";
  const isSeeker = user?.role === "seeker";

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href={backToJobHref}
          className="mb-6 inline-block rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
        >
          ← Back to Job
        </Link>

        {loading ? (
          <StatusCard
            title="Loading Job"
            message="Please wait while the application page is loading."
            variant="info"
          />
        ) : error ? (
          <StatusCard
            title="Error"
            message={error}
            variant="error"
            actionHref="/"
            actionLabel="Back to Jobs"
          />
        ) : !job ? (
          <StatusCard
            title="Job Not Found"
            message="This job does not exist."
            variant="neutral"
            actionHref="/"
            actionLabel="Back to Jobs"
          />
        ) : isLoggedOut ? (
          <StatusCard
            title="Login Required"
            message="You must be logged in as a seeker to apply for this job."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        ) : isEmployerOrAdmin ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h1 className="text-3xl font-bold text-slate-100">
                {job.title}
              </h1>

              <p className="mt-2 text-slate-300">
                {job.company_name || "Company not specified"}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
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

              <div className="mt-6">
                <h2 className="text-xl font-semibold text-slate-100">
                  Job Description
                </h2>

                <p className="mt-2 whitespace-pre-line text-slate-200">
                  {job.description || "No description provided."}
                </p>
              </div>
            </div>

            <StatusCard
              title="Access Restricted"
              message="Employers and admins cannot apply to jobs, but you can still view the job details above."
              variant="error"
              actionHref={backToJobHref}
              actionLabel="Back to Job"
            />
          </div>
        ) : !isSeeker ? (
          <StatusCard
            title="Access Restricted"
            message="Only seekers can apply to jobs."
            variant="error"
            actionHref={backToJobHref}
            actionLabel="Back to Job"
          />
        ) : (
          <>
            <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h1 className="text-3xl font-bold text-slate-100">
                Apply for {job.title}
              </h1>

              <p className="mt-2 text-slate-300">
                {job.company_name || "Company not specified"}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
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

              <div className="mt-6">
                <h2 className="text-xl font-semibold text-slate-100">
                  Job Description
                </h2>

                <p className="mt-2 whitespace-pre-line text-slate-200">
                  {job.description || "No description provided."}
                </p>
              </div>
            </div>

            <ApplyForm jobId={job.id} />
          </>
        )}
      </div>
    </main>
  );
}
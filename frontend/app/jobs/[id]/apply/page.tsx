"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ApplyForm from "../../../../components/ApplyForm";
import StatusCard from "../../../../components/StatusCard";
import { getStoredUser } from "../../../../lib/auth";
import { authFetch } from "../../../../lib/api";

type Job = {
  id: number;
  company: number;
  company_name: string;
  title: string;
  description: string;
  location: string;
  job_type: string;
  salary_min?: number | null;
  salary_max?: number | null;
  status: string;
};

type Application = {
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

export default function ApplyJobPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const jobId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [job, setJob] = useState<Job | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (!jobId) return;

    setLoading(true);
    setError("");

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

  useEffect(() => {
    if (!user || user.role !== "seeker") {
      setApplications([]);
      setApplicationsLoading(false);
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
      .then((data: Application[]) => {
        setApplications(Array.isArray(data) ? data : []);
        setApplicationsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setApplications([]);
        setApplicationsLoading(false);
      });
  }, [user]);

  const existingApplication = useMemo(() => {
    const numericJobId = Number(jobId);
    if (!Number.isFinite(numericJobId)) return null;
    return applications.find((application) => application.job === numericJobId) || null;
  }, [applications, jobId]);

  if (loading || applicationsLoading) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Loading"
            message="Please wait while we prepare your application page."
            variant="info"
          />
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Error"
            message={error || "Job not found."}
            variant="error"
            actionHref="/"
            actionLabel="Back to Jobs"
          />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in as a seeker to apply for this job."
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
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Application Restricted"
            message="Only seekers can apply for jobs."
            variant="error"
            actionHref={`/jobs/${job.id}`}
            actionLabel="Back to Job"
          />
        </div>
      </main>
    );
  }

  if (existingApplication) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Apply for Job</h1>
              <p className="mt-1 text-slate-300">{job.title}</p>
            </div>

            <Link
              href={`/jobs/${job.id}`}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to Job
            </Link>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-100">
                You have already applied for this job
              </h2>

              <span
                className={`rounded px-3 py-1 text-sm font-semibold uppercase tracking-wide ${getStatusClasses(
                  existingApplication.status
                )}`}
              >
                {formatStatus(existingApplication.status)}
              </span>
            </div>

            <p className="mt-2 text-slate-300">
              Application submitted on{" "}
              {new Date(existingApplication.created_at).toLocaleString()}.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/my-applications/${existingApplication.id}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                View My Application
              </Link>

              <Link
                href="/my-applications"
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
              >
                My Applications
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Apply for Job</h1>
            <p className="mt-1 text-slate-300">
              {job.title} • {job.company_name}
            </p>
          </div>

          <Link
            href={`/jobs/${job.id}`}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Job
          </Link>
        </div>

        <ApplyForm jobId={job.id} />
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../../lib/auth";
import { authFetch } from "../../../lib/api";
import StatusCard from "../../../components/StatusCard";

type AcceptedApplication = {
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
  created_at: string;
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
    case "accepted":
      return "bg-green-900 text-green-200 border border-green-700";
    case "reviewed":
      return "bg-yellow-900 text-yellow-200 border border-yellow-700";
    case "rejected":
      return "bg-red-900 text-red-200 border border-red-700";
    case "pending":
      return "bg-blue-900 text-blue-200 border border-blue-700";
    default:
      return "bg-slate-700 text-slate-200 border border-slate-600";
  }
}

export default function EmployerAcceptedPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);

  const [applications, setApplications] = useState<AcceptedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      setUserChecked(true);
      setIsLoggedIn(false);
      setIsEmployer(false);
      setLoading(false);
      return;
    }

    setUserChecked(true);
    setIsLoggedIn(true);

    if (!["employer", "admin"].includes(user.role)) {
      setIsEmployer(false);
      setLoading(false);
      return;
    }

    setIsEmployer(true);
  }, []);

  useEffect(() => {
    if (!userChecked || !isLoggedIn || !isEmployer) {
      return;
    }

    setLoading(true);
    setError("");

    authFetch("http://127.0.0.1:8000/api/applications/employer/accepted/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load accepted candidates.");
        }

        return data;
      })
      .then((data: AcceptedApplication[]) => {
        setApplications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load accepted candidates."
        );
        setLoading(false);
      });
  }, [userChecked, isLoggedIn, isEmployer]);

  async function handleStartConversation(profileId: number) {
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/profiles/talent/${profileId}/start-conversation/`,
        {
          method: "POST",
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to start conversation.");
      }

      window.location.href = `/messages/${data.id}`;
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to start conversation."
      );
    }
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
            message="You must be logged in to view accepted candidates."
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
            message="Only employers and admins can view accepted candidates."
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
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Accepted Candidates
            </h1>
            <p className="mt-1 text-slate-300">
              Review applicants you have accepted across your jobs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/messages"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Messages
            </Link>

            <Link
              href="/employer/jobs"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to Employer Dashboard
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
            title="Loading Accepted Candidates"
            message="Please wait while accepted candidates are being loaded."
            variant="info"
          />
        ) : error ? (
          <StatusCard title="Error" message={error} variant="error" />
        ) : applications.length === 0 ? (
          <StatusCard
            title="No Accepted Candidates"
            message="You have not accepted any candidates yet."
            variant="neutral"
            actionHref="/employer/jobs"
            actionLabel="Back to Employer Dashboard"
          />
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
              >
                <p className="text-sm text-slate-400">
                  Application #{application.id}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/employer/applicants/${application.id}`}
                    className="text-2xl font-semibold text-blue-400 hover:underline"
                  >
                    {application.applicant_username}
                  </Link>

                  <span
                    className={`rounded px-3 py-1 text-sm font-semibold uppercase tracking-wide ${getStatusClasses(
                      application.status
                    )}`}
                  >
                    {formatStatus(application.status)}
                  </span>
                </div>

                <p className="mt-2 text-slate-300">
                  {application.applicant_email || "No email provided"}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                  <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                    Job: {application.job_title}
                  </span>

                  <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                    Accepted on application dated:{" "}
                    {new Date(application.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="mb-2 text-lg font-semibold text-slate-100">
                    Cover Letter
                  </h3>
                  <p className="whitespace-pre-line text-slate-200">
                    {application.cover_letter || "No cover letter provided."}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/employer/applicants/${application.id}`}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                  >
                    View Applicant Detail
                  </Link>

                  {application.applicant_profile_id && (
                    <Link
                      href={`/talent/${application.applicant_profile_id}`}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                    >
                      View Talent Profile
                    </Link>
                  )}

                  {application.applicant_profile_id && (
                    <button
                      onClick={() =>
                        handleStartConversation(
                          application.applicant_profile_id as number
                        )
                      }
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Message Candidate
                    </button>
                  )}

                  {application.cv && (
                    <a
                      href={application.cv}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      View Uploaded CV
                    </a>
                  )}

                  <Link
                    href={`/jobs/${application.job}`}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    View Job
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
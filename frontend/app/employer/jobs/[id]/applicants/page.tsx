"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../../../../lib/auth";
import { authFetch, getFileUrl } from "../../../../../lib/api";
import StatusCard from "../../../../../components/StatusCard";

type Applicant = {
  id: number;
  job: number;
  job_title: string;
  applicant: number;
  applicant_username: string;
  applicant_email: string;
  applicant_profile_id?: number | null;
  applicant_profile_picture?: string | null;
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

function getInitials(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "SH";
  return cleaned.slice(0, 2).toUpperCase();
}

export default function EmployerApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);

  const [applications, setApplications] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobMissing, setJobMissing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
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

      try {
        const resolvedParams = await params;
        setJobId(resolvedParams.id);

        const res = await authFetch(
          `/api/applications/jobs/${resolvedParams.id}/applicants/`
        );

        const data = await parseResponseSafely(res);

        if (res.status === 404) {
          setJobMissing(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(data?.error || "Could not load applicants.");
        }

        setApplications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Could not load applicants."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params]);

  async function updateStatus(applicationId: number, newStatus: string) {
    setError("");
    setSuccess("");
    setUpdatingId(applicationId);

    try {
      const res = await authFetch(`/api/applications/${applicationId}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update status.");
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: data.status } : app
        )
      );

      setSuccess(`Application marked as ${formatStatus(newStatus)}.`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleStartConversation(profileId: number) {
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(
        `/api/profiles/talent/${profileId}/start-conversation/`,
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

  if (!userChecked) return null;

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to access employer applicants."
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
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Access Restricted"
            message="You are not authorized to access employer applicants."
            variant="error"
            actionHref="/"
            actionLabel="Back to Home"
          />
        </div>
      </main>
    );
  }

  if (jobMissing) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Job Not Found"
            message="This job does not exist or is no longer available."
            variant="neutral"
            actionHref="/employer/jobs"
            actionLabel="Back to Employer Jobs"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Job Applicants
            </h1>
            <p className="mt-1 text-slate-300">Job ID: {jobId || "..."}</p>
          </div>

          <div className="flex gap-3">
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
              Back to Employer Jobs
            </Link>
          </div>
        </div>

        {success && (
          <div className="mb-6">
            <StatusCard title="Success" message={success} variant="success" />
          </div>
        )}

        {loading ? (
          <p className="text-slate-300">Loading applicants...</p>
        ) : error ? (
          <StatusCard title="Error" message={error} variant="error" />
        ) : applications.length === 0 ? (
          <StatusCard
            title="No Applicants Yet"
            message="No applicants have applied for this job yet."
            variant="neutral"
            actionHref="/employer/jobs"
            actionLabel="Back to Employer Jobs"
          />
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const profilePictureUrl = getFileUrl(
                application.applicant_profile_picture
              );

              return (
                <div
                  key={application.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-900 text-sm font-bold text-slate-300">
                      {profilePictureUrl ? (
                        <img
                          src={profilePictureUrl}
                          alt={`${application.applicant_username} profile picture`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(application.applicant_username)
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm text-slate-400">
                        Application #{application.id}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/employer/applicants/${application.id}`}
                          className="text-xl font-semibold text-blue-400 hover:underline"
                        >
                          {application.applicant_username}
                        </Link>

                        {application.applicant_profile_id && (
                          <>
                            <button
                              onClick={() =>
                                handleStartConversation(
                                  application.applicant_profile_id as number
                                )
                              }
                              className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                              Message Applicant
                            </button>

                            <Link
                              href={`/talent/${application.applicant_profile_id}`}
                              className="rounded-lg bg-slate-700 px-3 py-1 text-sm font-medium text-slate-100 hover:bg-slate-600"
                            >
                              View Talent Profile
                            </Link>
                          </>
                        )}
                      </div>

                      <p className="mt-1 text-slate-300">
                        {application.applicant_email || "No email provided"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                        <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                          Job: {application.job_title}
                        </span>

                        <span
                          className={`rounded px-3 py-1 font-semibold uppercase tracking-wide ${getStatusClasses(
                            application.status
                          )}`}
                        >
                          Status: {formatStatus(application.status)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => updateStatus(application.id, "reviewed")}
                          disabled={updatingId === application.id}
                          className="rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700 disabled:opacity-50"
                        >
                          Mark Reviewed
                        </button>

                        <button
                          onClick={() => updateStatus(application.id, "accepted")}
                          disabled={updatingId === application.id}
                          className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Accept
                        </button>

                        <button
                          onClick={() => updateStatus(application.id, "rejected")}
                          disabled={updatingId === application.id}
                          className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>

                      <div className="mt-4">
                        <h3 className="mb-2 text-lg font-semibold text-slate-100">
                          Cover Letter
                        </h3>

                        <p className="text-slate-200">
                          {application.cover_letter || "No cover letter provided."}
                        </p>
                      </div>

                      {application.cv && (
                        <a
                          href={getFileUrl(application.cv)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                        >
                          View Uploaded CV
                        </a>
                      )}

                      <p className="mt-4 text-sm text-slate-400">
                        Applied at:{" "}
                        {new Date(application.created_at).toLocaleString()}
                      </p>
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
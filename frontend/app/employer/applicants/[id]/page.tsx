"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getStoredUser } from "../../../../lib/auth";
import { authFetch } from "../../../../lib/api";
import StatusCard from "../../../../components/StatusCard";
import { getFileUrl } from "../../../../lib/api"; // adjust path if needed

type ApplicationDetail = {
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
  employer_notes?: string;
  created_at: string;
};

type JobDetail = {
  id: number;
  title: string;
  description?: string;
  company_name?: string;
  location?: string;
  job_type?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  status?: string;
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

export default function EmployerApplicantDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const applicationId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobLoading, setJobLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
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
    if (!userChecked || !isLoggedIn || !isEmployer || !applicationId) {
      return;
    }

    setLoading(true);
    setError("");

    authFetch(`http://127.0.0.1:8000/api/applications/employer/${applicationId}/`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load application details.");
        }

        return data;
      })
      .then((data: ApplicationDetail) => {
        setApplication(data);
        setNotesDraft(data.employer_notes || "");
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
  }, [userChecked, isLoggedIn, isEmployer, applicationId]);

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

  async function handleUpdateStatus(newStatus: string) {
    if (!application) return;

    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/applications/${application.id}/status/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update application status.");
      }

      setApplication((prev) =>
        prev ? { ...prev, status: data.status } : prev
      );
      setSuccess(`Application marked as ${formatStatus(newStatus)}.`);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update application status."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function handleSaveNotes() {
    if (!application) return;

    setNotesSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/applications/${application.id}/notes/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ employer_notes: notesDraft }),
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save employer notes.");
      }

      setApplication((prev) =>
        prev ? { ...prev, employer_notes: data.employer_notes || "" } : prev
      );
      setSuccess("Employer notes saved successfully.");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to save employer notes."
      );
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleStartConversation() {
    if (!application?.applicant_profile_id) return;

    setError("");
    setSuccess("");

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/profiles/talent/${application.applicant_profile_id}/start-conversation/`,
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
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to view applicant details."
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
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Access Restricted"
            message="Only employers and admins can view applicant details."
            variant="error"
            actionHref="/"
            actionLabel="Back to Home"
          />
        </div>
      </main>
    );
  }

  const backToApplicantsHref = application
    ? `/employer/jobs/${application.job}/applicants`
    : "/employer/jobs";

  const backToJobHref = application
    ? `/jobs/${application.job}`
    : "/employer/jobs";

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Applicant Detail
            </h1>
            <p className="mt-1 text-slate-300">
              Review application details and take action.
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
              href={backToApplicantsHref}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to Applicants
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
            title="Loading Applicant"
            message="Please wait while applicant details are loading."
            variant="info"
          />
        ) : error ? (
          <StatusCard
            title="Error"
            message={error}
            variant="error"
            actionHref="/employer/jobs"
            actionLabel="Back to Employer Jobs"
          />
        ) : !application ? (
          <StatusCard
            title="Application Not Found"
            message="This application does not exist or is unavailable."
            variant="neutral"
            actionHref="/employer/jobs"
            actionLabel="Back to Employer Jobs"
          />
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <p className="text-sm text-slate-400">
                Application #{application.id}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {application.applicant_profile_id ? (
                  <Link
                    href={`/talent/${application.applicant_profile_id}`}
                    className="text-2xl font-semibold text-blue-400 hover:underline"
                  >
                    {application.applicant_username}
                  </Link>
                ) : (
                  <h2 className="text-2xl font-semibold text-slate-100">
                    {application.applicant_username}
                  </h2>
                )}

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
                  Applied at: {new Date(application.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <h3 className="mb-3 text-xl font-semibold text-slate-100">
                Cover Letter
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
                  <h4 className="text-lg font-semibold text-slate-100">
                    {jobDetail.title}
                  </h4>

                  <p className="mt-2 text-slate-300">
                    {jobDetail.company_name || "Company not specified"}
                  </p>

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

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-100">
                  Employer Notes
                </h3>

                <button
                  onClick={handleSaveNotes}
                  disabled={notesSaving}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {notesSaving ? "Saving..." : "Save Notes"}
                </button>
              </div>

              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-teal-500"
                placeholder="Add private employer notes about this applicant. These notes are not visible to the seeker."
              />

              <p className="mt-3 text-sm text-slate-400">
                These notes are private to the employer/admin side and are not shown to the applicant.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-slate-100">
                Actions
              </h3>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleUpdateStatus("reviewed")}
                  disabled={updating}
                  className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                >
                  Mark Reviewed
                </button>

                <button
                  onClick={() => handleUpdateStatus("accepted")}
                  disabled={updating}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Accept
                </button>

                <button
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={updating}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>

                {application.applicant_profile_id && (
                  <button
                    onClick={handleStartConversation}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Message Applicant
                  </button>
                )}

                {application.applicant_profile_id && (
                  <Link
                    href={`/talent/${application.applicant_profile_id}`}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                  >
                    View Talent Profile
                  </Link>
                )}

                {application.cv && (
                  <a
                    href={
                      application.cv.startsWith("http")
                        ? application.cv
                        : `${process.env.NEXT_PUBLIC_API_BASE_URL}${application.cv}`
                    }
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
        )}
      </div>
    </main>
  );
}
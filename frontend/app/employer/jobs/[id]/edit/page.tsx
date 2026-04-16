"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../../../../lib/auth";
import { authFetch } from "../../../../../lib/api";
import StatusCard from "../../../../../components/StatusCard";

type Job = {
  id: number;
  title: string;
  description: string;
  location: string;
  salary_min: string | null;
  salary_max: string | null;
  job_type: string;
  status: string;
  company_name: string;
};

export default function EditEmployerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);

  const [jobId, setJobId] = useState("");
  const [loadingJob, setLoadingJob] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobMissing, setJobMissing] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("full_time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [status, setStatus] = useState("active");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      const user = getStoredUser();

      if (!user) {
        setUserChecked(true);
        setIsLoggedIn(false);
        setIsEmployer(false);
        setLoadingJob(false);
        return;
      }

      setUserChecked(true);
      setIsLoggedIn(true);

      if (!["employer", "admin"].includes(user.role)) {
        setIsEmployer(false);
        setLoadingJob(false);
        return;
      }

      setIsEmployer(true);

      try {
        const resolvedParams = await params;
        setJobId(resolvedParams.id);

        const res = await authFetch(
          `http://127.0.0.1:8000/api/jobs/${resolvedParams.id}/`
        );

        if (res.status === 404) {
          setJobMissing(true);
          setLoadingJob(false);
          return;
        }

        if (!res.ok) {
          let message = "Failed to load job.";

          try {
            const data = await res.json();
            if (data?.error) {
              message = data.error;
            }
          } catch {}

          throw new Error(message);
        }

        const job: Job = await res.json();

        setTitle(job.title || "");
        setDescription(job.description || "");
        setLocation(job.location || "");
        setJobType(job.job_type || "full_time");
        setSalaryMin(job.salary_min ?? "");
        setSalaryMax(job.salary_max ?? "");
        setStatus(job.status || "active");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load job.");
      } finally {
        setLoadingJob(false);
      }
    }

    load();
  }, [params]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Job title is required.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!location.trim()) {
      setError("Location is required.");
      return;
    }

    setSaving(true);

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/jobs/${jobId}/update/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            location,
            job_type: jobType,
            salary_min: salaryMin || null,
            salary_max: salaryMax || null,
            status,
          }),
        }
      );

      if (res.status === 404) {
        setJobMissing(true);
        setSaving(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || JSON.stringify(data) || "Failed to update job.");
        setSaving(false);
        return;
      }

      setSuccess("Job updated successfully.");

      setTimeout(() => {
        router.push("/employer/jobs");
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while updating the job.");
    } finally {
      setSaving(false);
    }
  }

  if (!userChecked) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-3xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to edit jobs."
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
        <div className="mx-auto max-w-3xl">
          <StatusCard
            title="Access Restricted"
            message="You are not authorized to edit jobs."
            variant="error"
            actionHref="/"
            actionLabel="Back to Home"
          />
        </div>
      </main>
    );
  }

  if (loadingJob) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-3xl text-slate-300">Loading job...</div>
      </main>
    );
  }

  if (jobMissing) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-3xl">
          <StatusCard
            title="Job Not Found"
            message="This job does not exist or is no longer available to edit."
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
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-100">Edit Job</h1>

          <Link
            href="/employer/jobs"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Employer Jobs
          </Link>
        </div>

        <div className="space-y-6">
          {error && (
            <StatusCard
              title="Error"
              message={error}
              variant="error"
            />
          )}

          {success && (
            <StatusCard
              title="Success"
              message={success}
              variant="success"
            />
          )}

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Job Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Description
                </label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Salary Min
                  </label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Salary Max
                  </label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
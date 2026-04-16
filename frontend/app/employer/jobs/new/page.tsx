"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authFetch } from "../../../../lib/api";
import StatusCard from "../../../../components/StatusCard";

type JobFormData = {
  title: string;
  description: string;
  location: string;
  job_type: string;
  salary_min: string;
  salary_max: string;
  status: string;
};

type ErrorResponse = {
  error?: string;
  [key: string]: unknown;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function extractErrorMessage(data: ErrorResponse) {
  if (!data || typeof data !== "object") {
    return "Failed to create job.";
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  const fieldMessages: string[] = [];

  for (const [field, value] of Object.entries(data)) {
    if (field === "error") continue;

    if (Array.isArray(value)) {
      const joined = value
        .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
        .join(" ");
      fieldMessages.push(`${field}: ${joined}`);
    } else if (typeof value === "string") {
      fieldMessages.push(`${field}: ${value}`);
    }
  }

  if (fieldMessages.length > 0) {
    return fieldMessages.join(" | ");
  }

  return "Failed to create job.";
}

export default function CreateJobPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    description: "",
    location: "",
    job_type: "full_time",
    salary_min: "",
    salary_max: "",
    status: "active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        job_type: formData.job_type,
        salary_min: formData.salary_min ? Number(formData.salary_min) : null,
        salary_max: formData.salary_max ? Number(formData.salary_max) : null,
        status: formData.status,
      };

      const res = await authFetch("http://127.0.0.1:8000/api/jobs/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(extractErrorMessage(data as ErrorResponse));
      }

      setSuccess("Job created successfully.");

      setTimeout(() => {
        router.push("/employer/jobs");
      }, 800);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Create Job</h1>
            <p className="mt-1 text-slate-300">
              Publish a new job opening for candidates.
            </p>
          </div>

          <Link
            href="/employer/jobs"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Employer Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-6">
            <StatusCard title="Error" message={error} variant="error" />
          </div>
        )}

        {success && (
          <div className="mb-6">
            <StatusCard title="Success" message={success} variant="success" />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Job Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
              placeholder="e.g. Frontend Developer"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={6}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
              placeholder="Describe the role, responsibilities, and requirements..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
              placeholder="e.g. Mbabane or Remote"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Job Type
              </label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Minimum Salary
              </label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="e.g. 12000"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Maximum Salary
              </label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="e.g. 18000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Job"}
          </button>
        </form>
      </div>
    </main>
  );
}
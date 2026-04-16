"use client";

import { useState } from "react";
import { authFetch } from "../lib/api";
import StatusCard from "./StatusCard";

type ApplyFormProps = {
  jobId: number;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export default function ApplyForm({ jobId }: ApplyFormProps) {
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("cover_letter", coverLetter);

      if (cvFile) {
        formData.append("cv", cvFile);
      }

      const res = await authFetch(
        `http://127.0.0.1:8000/api/applications/jobs/${jobId}/apply/`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit application.");
      }

      setSuccess("Application submitted successfully.");
      setCoverLetter("");
      setCvFile(null);

      const fileInput = document.getElementById("cv-upload") as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong while applying."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
      <h2 className="mb-4 text-xl font-semibold text-slate-100">Apply for this job</h2>

      {error && (
        <div className="mb-4">
          <StatusCard title="Error" message={error} variant="error" />
        </div>
      )}

      {success && (
        <div className="mb-4">
          <StatusCard title="Success" message={success} variant="success" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Cover Letter
          </label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
            placeholder="Write your cover letter here..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Upload CV (PDF)
          </label>
          <input
            id="cv-upload"
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setCvFile(file);
            }}
            className="block w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
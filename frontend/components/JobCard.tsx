"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isJobSaved, toggleSavedJob } from "../lib/savedJobs";

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

type StoredUser = {
  username: string;
  role: string;
};

function getJobTypeClasses(jobType: string) {
  switch (jobType?.toLowerCase()) {
    case "full_time":
      return "bg-blue-900 text-blue-200 border border-blue-700";
    case "part_time":
      return "bg-purple-900 text-purple-200 border border-purple-700";
    case "contract":
      return "bg-yellow-900 text-yellow-200 border border-yellow-700";
    case "internship":
      return "bg-green-900 text-green-200 border border-green-700";
    default:
      return "bg-slate-700 text-slate-200 border border-slate-600";
  }
}

function getStatusClasses(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-900 text-green-200 border border-green-700";
    case "draft":
      return "bg-yellow-900 text-yellow-200 border border-yellow-700";
    case "closed":
      return "bg-red-900 text-red-200 border border-red-700";
    default:
      return "bg-slate-700 text-slate-200 border border-slate-600";
  }
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
      return jobType;
  }
}

export default function JobCard({ job }: { job: Job }) {
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setSaved(isJobSaved(job.id));

    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch {
        setUser(null);
      }
    }
  }, [job.id]);

  function handleToggleSave(e: React.MouseEvent) {
    e.preventDefault();
    toggleSavedJob(job.id);
    setSaved(!saved);
  }

  const isSeeker = !user || user.role === "seeker";

  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="relative cursor-pointer rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm transition hover:border-slate-600 hover:shadow-md">
        {isSeeker && (
          <button
            onClick={handleToggleSave}
            className={`absolute right-4 top-4 rounded-lg px-3 py-1 text-xs font-semibold ${
              saved
                ? "bg-yellow-500 text-black"
                : "bg-slate-700 text-slate-200"
            }`}
          >
            {saved ? "Saved" : "Save"}
          </button>
        )}

        <h2 className="text-xl font-semibold text-slate-100">
          {job.title}
        </h2>

        <p className="mt-1 text-sm text-slate-300">
          {job.company_name} • {job.location}
        </p>

        <p className="mt-4 text-slate-200">
          {job.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span
            className={`rounded px-3 py-1 font-semibold ${getJobTypeClasses(job.job_type)}`}
          >
            {formatJobType(job.job_type)}
          </span>

          <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1 font-semibold text-slate-200">
            Salary: {job.salary_min ?? "N/A"} - {job.salary_max ?? "N/A"}
          </span>

          <span
            className={`rounded px-3 py-1 font-semibold ${getStatusClasses(job.status)}`}
          >
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../../lib/auth";
import { authFetch, getApiBaseUrl } from "../../../lib/api";
import StatusCard from "../../../components/StatusCard";

type ProfileData = {
  id?: number;
  username?: string;
  email?: string;
  full_name: string;
  headline: string;
  bio: string;
  location: string;
  phone: string;
  skills: string;
  experience_years: number;
  education: string;
  work_experience: string;
  preferred_job_type: string;
  preferred_location: string;
  linkedin_url: string;
  portfolio_url: string;
  cv?: string | null;
  is_public: boolean;
};

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
      return jobType || "Not specified";
  }
}

function parseSkills(skills: string) {
  if (!skills) return [];
  return skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getFileUrl(filePath?: string | null) {
  if (!filePath) return "";

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  return `${getApiBaseUrl()}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
}

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export default function ProfilePreviewPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeeker, setIsSeeker] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      setUserChecked(true);
      setIsLoggedIn(false);
      setIsSeeker(false);
      setLoading(false);
      return;
    }

    setUserChecked(true);
    setIsLoggedIn(true);

    if (user.role !== "seeker") {
      setIsSeeker(false);
      setLoading(false);
      return;
    }

    setIsSeeker(true);

    authFetch("/api/profiles/me/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (res.status === 404) {
          setNotFoundState(true);
          setLoading(false);
          return null;
        }

        if (!res.ok) {
          throw new Error(data?.error || `Failed to load profile. (${res.status})`);
        }

        return data;
      })
      .then((data: ProfileData | null) => {
        if (!data) return;
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load profile preview.");
        setLoading(false);
      });
  }, []);

  if (!userChecked) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to preview your profile."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        </div>
      </main>
    );
  }

  if (!isSeeker) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Access Restricted"
            message="Only job seekers can preview their profile."
            variant="error"
            actionHref="/"
            actionLabel="Back to Home"
          />
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Loading Preview"
            message="Please wait while your profile preview is being loaded."
            variant="info"
          />
        </div>
      </main>
    );
  }

  if (notFoundState) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="No Profile Yet"
            message="Create your profile first before previewing it."
            variant="neutral"
            actionHref="/profile"
            actionLabel="Create My Profile"
          />
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Error"
            message={error || "Could not load profile preview."}
            variant="error"
            actionHref="/profile"
            actionLabel="Back to Profile"
          />
        </div>
      </main>
    );
  }

  const skills = parseSkills(profile.skills);
  const cvUrl = getFileUrl(profile.cv);

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/profile"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Profile Editor
          </Link>

          <div className="rounded-lg border border-blue-700 bg-blue-900/40 px-4 py-2 text-sm text-blue-200">
            Employer View Preview
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-2 text-sm text-slate-400">Talent Profile Preview</p>

              <h1 className="text-3xl font-bold text-slate-100">
                {profile.full_name}
              </h1>

              <p className="mt-2 text-slate-300">
                {profile.headline || "No headline provided"}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                  Location: {profile.location || "Not specified"}
                </span>

                <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                  Experience: {profile.experience_years} year
                  {profile.experience_years !== 1 ? "s" : ""}
                </span>

                <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                  Preferred Job Type: {formatJobType(profile.preferred_job_type)}
                </span>

                <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                  Preferred Location: {profile.preferred_location || "Not specified"}
                </span>

                <span
                  className={`rounded px-3 py-1 ${
                    profile.is_public
                      ? "border border-green-700 bg-green-900/40 text-green-200"
                      : "border border-yellow-700 bg-yellow-900/40 text-yellow-200"
                  }`}
                >
                  {profile.is_public ? "Public Profile" : "Private Profile"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  LinkedIn
                </a>
              )}

              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Portfolio
                </a>
              )}

              {cvUrl && (
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  View CV
                </a>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-5">
              <h2 className="mb-3 text-xl font-semibold text-slate-100">
                Contact
              </h2>

              <div className="space-y-2 text-slate-200">
                <p>
                  <span className="font-medium text-slate-300">Username:</span>{" "}
                  {profile.username || "Not provided"}
                </p>
                <p>
                  <span className="font-medium text-slate-300">Email:</span>{" "}
                  {profile.email || "Not provided"}
                </p>
                <p>
                  <span className="font-medium text-slate-300">Phone:</span>{" "}
                  {profile.phone || "Not provided"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900 p-5">
              <h2 className="mb-3 text-xl font-semibold text-slate-100">
                Skills
              </h2>

              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs text-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-200">No skills listed.</p>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-700 bg-slate-900 p-5">
            <h2 className="mb-3 text-xl font-semibold text-slate-100">Bio</h2>

            <p className="leading-7 text-slate-200">
              {profile.bio || "No bio provided."}
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-slate-700 bg-slate-900 p-5">
            <h2 className="mb-3 text-xl font-semibold text-slate-100">
              Education
            </h2>

            <p className="leading-7 text-slate-200">
              {profile.education || "No education listed."}
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-slate-700 bg-slate-900 p-5">
            <h2 className="mb-3 text-xl font-semibold text-slate-100">
              Work Experience
            </h2>

            <p className="leading-7 text-slate-200">
              {profile.work_experience || "No work experience listed."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
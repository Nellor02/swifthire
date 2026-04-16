"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../lib/auth";
import { authFetch } from "../../lib/api";
import StatusCard from "../../components/StatusCard";

type SeekerProfile = {
  id: number;
  username: string;
  email: string;
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
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

type ShortlistItem = {
  id: number;
  created_at: string;
  seeker_profile: SeekerProfile;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function parseSkills(skills: string) {
  if (!skills) return [];
  return skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function truncateText(text: string, maxLength = 120) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function ShortlistPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);

  const [items, setItems] = useState<ShortlistItem[]>([]);
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

    authFetch("http://127.0.0.1:8000/api/profiles/talent/shortlist/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || `Failed to load shortlist. (${res.status})`);
        }

        return data;
      })
      .then((data: ShortlistItem[]) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load shortlist.");
        setLoading(false);
      });
  }, [userChecked, isLoggedIn, isEmployer]);

  async function handleRemove(profileId: number) {
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/profiles/talent/${profileId}/shortlist/`,
        {
          method: "DELETE",
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        setError(data?.error || "Failed to remove candidate from shortlist.");
        return;
      }

      setItems((prev) =>
        prev.filter((item) => item.seeker_profile.id !== profileId)
      );
      setSuccess(data?.message || "Candidate removed from shortlist.");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while removing the candidate.");
    }
  }

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
        setError(data?.error || "Failed to start conversation.");
        return;
      }

      window.location.href = `/messages/${data.id}`;
    } catch (err) {
      console.error(err);
      setError("Something went wrong while starting the conversation.");
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
            message="You must be logged in to view your shortlist."
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
            message="Only employers and admins can view shortlists."
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
            <h1 className="text-3xl font-bold text-slate-100">My Shortlist</h1>
            <p className="mt-1 text-slate-300">
              Review candidates you saved for later.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/talent"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to Talent Search
            </Link>

            <Link
              href="/messages"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Messages
            </Link>

            <Link
              href="/employer/jobs"
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
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
            title="Loading Shortlist"
            message="Please wait while your shortlisted candidates are being loaded."
            variant="info"
          />
        ) : error ? (
          <StatusCard title="Error" message={error} variant="error" />
        ) : items.length === 0 ? (
          <StatusCard
            title="No Shortlisted Candidates"
            message="You have not shortlisted any candidates yet."
            variant="neutral"
            actionHref="/talent"
            actionLabel="Browse Talent"
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const profile = item.seeker_profile;
              const skills = parseSkills(profile.skills);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-100">
                        {profile.full_name}
                      </h2>

                      <p className="mt-1 text-slate-300">
                        {profile.headline || "No headline provided"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                        <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                          {profile.location || "Location not specified"}
                        </span>

                        <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                          {profile.experience_years} year
                          {profile.experience_years !== 1 ? "s" : ""} experience
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/talent/${profile.id}`}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                      >
                        View Profile
                      </Link>

                      <button
                        onClick={() => handleStartConversation(profile.id)}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Message
                      </button>

                      <Link
                        href={`/talent/${profile.id}/contact`}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Contact
                      </Link>

                      <button
                        onClick={() => handleRemove(profile.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-100">
                        Skills
                      </h3>

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
                        <p className="text-slate-400">No skills listed.</p>
                      )}
                    </div>

                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-100">
                        Bio
                      </h3>
                      <p className="text-slate-200">
                        {truncateText(profile.bio || "No bio provided.")}
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
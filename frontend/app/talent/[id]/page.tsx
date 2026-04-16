"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStoredUser } from "../../../lib/auth";
import { authFetch } from "../../../lib/api";
import StatusCard from "../../../components/StatusCard";

type TalentProfile = {
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
  seeker_profile: {
    id: number;
  };
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
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

export default function TalentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params.id);

  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);

  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFoundState, setNotFoundState] = useState(false);

  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

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
    if (!userChecked || !isLoggedIn || !isEmployer || !id) {
      return;
    }

    setLoading(true);
    setError("");
    setNotFoundState(false);

    authFetch(`http://127.0.0.1:8000/api/profiles/talent/${id}/`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (res.status === 404) {
          setNotFoundState(true);
          setLoading(false);
          return null;
        }

        if (!res.ok) {
          throw new Error(
            data?.error || `Failed to load talent profile. (${res.status})`
          );
        }

        return data;
      })
      .then((data: TalentProfile | null) => {
        if (!data) return;
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load talent profile."
        );
        setLoading(false);
      });
  }, [userChecked, isLoggedIn, isEmployer, id]);

  useEffect(() => {
    if (!userChecked || !isLoggedIn || !isEmployer || !id) {
      return;
    }

    authFetch("http://127.0.0.1:8000/api/profiles/talent/shortlist/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);
        if (!res.ok) {
          return;
        }

        const shortlist = Array.isArray(data) ? (data as ShortlistItem[]) : [];
        setIsShortlisted(
          shortlist.some(
            (item) => String(item.seeker_profile?.id) === String(id)
          )
        );
      })
      .catch((err) => {
        console.error(err);
      });
  }, [userChecked, isLoggedIn, isEmployer, id]);

  async function handleToggleShortlist() {
    if (!profile) return;

    setShortlistLoading(true);
    setActionMessage("");
    setError("");

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/profiles/talent/${profile.id}/shortlist/`,
        {
          method: isShortlisted ? "DELETE" : "POST",
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        setError(
          data?.error ||
            `Failed to ${isShortlisted ? "remove from" : "add to"} shortlist.`
        );
        setShortlistLoading(false);
        return;
      }

      setIsShortlisted((prev) => !prev);
      setActionMessage(
        isShortlisted
          ? "Candidate removed from shortlist."
          : "Candidate added to shortlist."
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong while updating the shortlist.");
    } finally {
      setShortlistLoading(false);
    }
  }

  async function handleStartConversation() {
    if (!profile) return;

    setMessageLoading(true);
    setActionMessage("");
    setError("");

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/profiles/talent/${profile.id}/start-conversation/`,
        {
          method: "POST",
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to start conversation.");
      }

      router.push(`/messages/${data.id}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to start conversation.");
      setMessageLoading(false);
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
            message="You must be logged in to view talent profiles."
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
            message="Only employers and admins can view talent profiles."
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
            title="Loading Profile"
            message="Please wait while the talent profile is being loaded."
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
            title="Talent Profile Not Found"
            message="This talent profile does not exist or is no longer available."
            variant="neutral"
            actionHref="/talent"
            actionLabel="Back to Talent Search"
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
            message={error || "Could not load talent profile."}
            variant="error"
            actionHref="/talent"
            actionLabel="Back to Talent Search"
          />
        </div>
      </main>
    );
  }

  const skills = parseSkills(profile.skills);

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/talent"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Talent Search
          </Link>

          <Link
            href="/shortlist"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            View Shortlist
          </Link>

          <Link
            href="/messages"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Messages
          </Link>

          <button
            onClick={() => router.back()}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
          >
            Go Back
          </button>
        </div>

        {actionMessage && (
          <div className="mb-6">
            <StatusCard title="Success" message={actionMessage} variant="success" />
          </div>
        )}

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-2 text-sm text-slate-400">Talent Profile</p>

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
                  Preferred Location:{" "}
                  {profile.preferred_location || "Not specified"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleToggleShortlist}
                disabled={shortlistLoading}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  isShortlisted
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                {shortlistLoading
                  ? "Updating..."
                  : isShortlisted
                  ? "✓ Shortlisted — Remove"
                  : "+ Shortlist Candidate"}
              </button>

              <button
                onClick={handleStartConversation}
                disabled={messageLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {messageLoading ? "Opening..." : "Message Candidate"}
              </button>

              <Link
                href={`/talent/${profile.id}/contact`}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Contact Candidate
              </Link>

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
                  {profile.username}
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
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../lib/auth";
import { authFetch } from "../../lib/api";
import StatusCard from "../../components/StatusCard";

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

type TalentSearchResponse = {
  results: TalentProfile[];
  total: number;
  total_pages: number;
  current_page: number;
  has_next: boolean;
  has_previous: boolean;
};

type ShortlistItem = {
  id: number;
  created_at: string;
  seeker_profile: {
    id: number;
  };
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

function truncateText(text: string, maxLength = 140) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function parseSkills(skills: string) {
  if (!skills) return [];
  return skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export default function TalentPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);

  const [profiles, setProfiles] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");
  const [minExperience, setMinExperience] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [shortlistedIds, setShortlistedIds] = useState<number[]>([]);
  const [updatingShortlistId, setUpdatingShortlistId] = useState<number | null>(null);

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
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedLocation, selectedJobType, minExperience]);

  useEffect(() => {
    if (!userChecked || !isLoggedIn || !isEmployer) {
      return;
    }

    authFetch("http://127.0.0.1:8000/api/profiles/talent/shortlist/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          return;
        }

        const shortlist = Array.isArray(data) ? (data as ShortlistItem[]) : [];
        setShortlistedIds(
          shortlist
            .map((item) => item.seeker_profile?.id)
            .filter((id): id is number => typeof id === "number")
        );
      })
      .catch((err) => {
        console.error(err);
      });
  }, [userChecked, isLoggedIn, isEmployer]);

  useEffect(() => {
    if (!userChecked || !isLoggedIn || !isEmployer) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const params = new URLSearchParams();

    if (debouncedSearchTerm.trim()) {
      params.set("search", debouncedSearchTerm.trim());
    }

    if (selectedLocation.trim()) {
      params.set("location", selectedLocation.trim());
    }

    if (selectedJobType) {
      params.set("job_type", selectedJobType);
    }

    if (minExperience.trim()) {
      params.set("min_experience", minExperience.trim());
    }

    const url = `http://127.0.0.1:8000/api/profiles/talent/?page=${currentPage}${
      params.toString() ? `&${params.toString()}` : ""
    }`;

    authFetch(url)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || `Failed to load talent. (${res.status})`);
        }

        return data;
      })
      .then((data: TalentSearchResponse) => {
        setProfiles(Array.isArray(data.results) ? data.results : []);
        setTotalPages(data.total_pages || 1);
        setTotalResults(data.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load talent.");
        setLoading(false);
      });
  }, [
    userChecked,
    isLoggedIn,
    isEmployer,
    debouncedSearchTerm,
    selectedLocation,
    selectedJobType,
    minExperience,
    currentPage,
  ]);

  async function handleToggleShortlist(profileId: number) {
    const isShortlisted = shortlistedIds.includes(profileId);

    setUpdatingShortlistId(profileId);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/profiles/talent/${profileId}/shortlist/`,
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
        setUpdatingShortlistId(null);
        return;
      }

      setShortlistedIds((prev) =>
        isShortlisted
          ? prev.filter((id) => id !== profileId)
          : [...prev, profileId]
      );

      setSuccess(
        isShortlisted
          ? "Candidate removed from shortlist."
          : "Candidate added to shortlist."
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong while updating the shortlist.");
    } finally {
      setUpdatingShortlistId(null);
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
            message="You must be logged in to access talent search."
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
            message="Only employers and admins can search talent."
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
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Talent Search</h1>
            <p className="mt-1 text-slate-300">
              Search public seeker profiles by skills, location, and experience.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/shortlist"
              className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
            >
              View Shortlist
            </Link>

            <Link
              href="/"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {success && (
          <div className="mb-6">
            <StatusCard title="Success" message={success} variant="success" />
          </div>
        )}

        {error && !loading && (
          <div className="mb-6">
            <StatusCard title="Error" message={error} variant="error" />
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <input
            type="text"
            placeholder="Search by name, skills, bio, education..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-400 focus:border-blue-500 md:col-span-2"
          />

          <input
            type="text"
            placeholder="Location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />

          <select
            value={selectedJobType}
            onChange={(e) => setSelectedJobType(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
          >
            <option value="">All Job Types</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-300">Min Experience:</label>
            <input
              type="number"
              min={0}
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
              className="w-28 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
            />
          </div>

          <p className="text-sm text-slate-300">
            Showing {totalResults} profile{totalResults !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Talent"
            message="Please wait while talent profiles are being loaded."
            variant="info"
          />
        ) : profiles.length === 0 ? (
          <StatusCard
            title="No Talent Found"
            message="No public seeker profiles match your current filters."
            variant="neutral"
          />
        ) : (
          <>
            <div className="space-y-4">
              {profiles.map((profile) => {
                const isShortlisted = shortlistedIds.includes(profile.id);
                const isUpdating = updatingShortlistId === profile.id;

                return (
                  <div
                    key={profile.id}
                    className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-semibold text-slate-100">
                            {profile.full_name}
                          </h2>

                          {isShortlisted && (
                            <span className="rounded-full border border-yellow-700 bg-yellow-900/40 px-3 py-1 text-xs font-medium text-yellow-200">
                              Shortlisted
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-slate-300">
                          {profile.headline || "No headline provided"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                          <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                            Location: {profile.location || "Not specified"}
                          </span>

                          <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                            Experience: {profile.experience_years} year
                            {profile.experience_years !== 1 ? "s" : ""}
                          </span>

                          <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                            Preferred: {formatJobType(profile.preferred_job_type)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleToggleShortlist(profile.id)}
                          disabled={isUpdating}
                          className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                            isShortlisted
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-yellow-600 hover:bg-yellow-700"
                          }`}
                        >
                          {isUpdating
                            ? "Updating..."
                            : isShortlisted
                            ? "Remove Shortlist"
                            : "Shortlist"}
                        </button>

                        <Link
                          href={`/talent/${profile.id}`}
                          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                        >
                          View Profile
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

                    <div className="mt-5 space-y-5">
                      <div>
                        <h3 className="mb-2 text-lg font-semibold text-slate-100">
                          Skills
                        </h3>

                        {parseSkills(profile.skills).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {parseSkills(profile.skills).map((skill, index) => (
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

                      <div>
                        <h3 className="mb-2 text-lg font-semibold text-slate-100">
                          Work Experience
                        </h3>
                        <p className="text-slate-200">
                          {truncateText(
                            profile.work_experience || "No work experience listed."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-sm text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
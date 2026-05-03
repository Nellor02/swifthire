"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredUser } from "../../lib/auth";
import { authFetch } from "../../lib/api";
import StatusCard from "../../components/StatusCard";

type ProfileData = {
  id?: number;
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
  profile_picture?: string | null;
  is_public: boolean;
};

const emptyProfile: ProfileData = {
  full_name: "",
  headline: "",
  bio: "",
  location: "",
  phone: "",
  skills: "",
  experience_years: 0,
  education: "",
  work_experience: "",
  preferred_job_type: "",
  preferred_location: "",
  linkedin_url: "",
  portfolio_url: "",
  profile_picture: null,
  is_public: true,
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export default function ProfilePage() {
  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeeker, setIsSeeker] = useState(false);

  const [profileExists, setProfileExists] = useState(false);
  const [form, setForm] = useState<ProfileData>(emptyProfile);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    authFetch("http://127.0.0.1:8000/api/profiles/me/")
      .then(async (res) => {
        if (res.status === 404) {
          setProfileExists(false);
          setLoading(false);
          return null;
        }

        if (!res.ok) {
          const data = await parseResponseSafely(res);
          const message = data?.error || `Failed to load profile. (${res.status})`;
          throw new Error(message);
        }

        return await parseResponseSafely(res);
      })
      .then((data) => {
        if (!data) return;

        setProfileExists(true);
        setForm({
          id: data.id,
          full_name: data.full_name || "",
          headline: data.headline || "",
          bio: data.bio || "",
          location: data.location || "",
          phone: data.phone || "",
          skills: data.skills || "",
          experience_years: data.experience_years ?? 0,
          education: data.education || "",
          work_experience: data.work_experience || "",
          preferred_job_type: data.preferred_job_type || "",
          preferred_location: data.preferred_location || "",
          linkedin_url: data.linkedin_url || "",
          portfolio_url: data.portfolio_url || "",
          profile_picture: data.profile_picture || null,
          is_public: Boolean(data.is_public),
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load profile.");
        setLoading(false);
      });
  }, []);

  function updateField<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleProfilePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setProfilePictureFile(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    setSaving(true);

    try {
      const method = profileExists ? "PATCH" : "POST";

      const payload = new FormData();

      payload.append("full_name", form.full_name);
      payload.append("headline", form.headline);
      payload.append("bio", form.bio);
      payload.append("location", form.location);
      payload.append("phone", form.phone);
      payload.append("skills", form.skills);
      payload.append("experience_years", String(Number(form.experience_years) || 0));
      payload.append("education", form.education);
      payload.append("work_experience", form.work_experience);
      payload.append("preferred_job_type", form.preferred_job_type);
      payload.append("preferred_location", form.preferred_location);
      payload.append("linkedin_url", form.linkedin_url);
      payload.append("portfolio_url", form.portfolio_url);
      payload.append("is_public", String(form.is_public));

      if (profilePictureFile) {
        payload.append("profile_picture", profilePictureFile);
      }

      const res = await authFetch("http://127.0.0.1:8000/api/profiles/me/", {
        method,
        body: payload,
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        setError(data?.error || `Failed to save profile. (${res.status})`);
        setSaving(false);
        return;
      }

      setProfileExists(true);
      setSuccess(profileExists ? "Profile updated successfully." : "Profile created successfully.");

      setForm((prev) => ({
        ...prev,
        id: data.id ?? prev.id,
        profile_picture: data.profile_picture ?? prev.profile_picture,
      }));

      setProfilePictureFile(null);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving your profile.");
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
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to manage your profile."
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
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Access Restricted"
            message="This page is only available to job seekers."
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
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Loading Profile"
            message="Please wait while your profile is being loaded."
            variant="info"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              My Profile
            </h1>
            <p className="mt-1 text-slate-300">
              Build your talent profile so employers can find you.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/profile/preview"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Preview Profile
            </Link>

            <Link
              href="/"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to Home
            </Link>
          </div>
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

          {!profileExists && !error && (
            <StatusCard
              title="Create Your Profile"
              message="You do not have a profile yet. Fill in your details below to create one."
              variant="info"
            />
          )}

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-5">
                <label className="mb-3 block text-sm font-medium text-slate-200">
                  Profile Picture
                </label>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-600 bg-slate-800 text-xl font-bold text-slate-300">
                    {form.profile_picture ? (
                      <img
                        src={form.profile_picture}
                        alt="Profile picture"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "SH"
                    )}
                  </div>

                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="block w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      Upload a clear square image. PNG or JPG recommended.
                    </p>
                    {profilePictureFile && (
                      <p className="mt-2 text-xs text-emerald-300">
                        Selected: {profilePictureFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Developer | React | Next.js"
                  value={form.headline}
                  onChange={(e) => updateField("headline", e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Bio
                </label>
                <textarea
                  rows={5}
                  value={form.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Skills
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python, Django, React, SQL"
                  value={form.skills}
                  onChange={(e) => updateField("skills", e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.experience_years}
                  onChange={(e) => updateField("experience_years", Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Education
                </label>
                <textarea
                  rows={4}
                  value={form.education}
                  onChange={(e) => updateField("education", e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Work Experience
                </label>
                <textarea
                  rows={5}
                  value={form.work_experience}
                  onChange={(e) => updateField("work_experience", e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Preferred Job Type
                  </label>
                  <select
                    value={form.preferred_job_type}
                    onChange={(e) => updateField("preferred_job_type", e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  >
                    <option value="">Select job type</option>
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Preferred Location
                  </label>
                  <input
                    type="text"
                    value={form.preferred_location}
                    onChange={(e) => updateField("preferred_location", e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={form.linkedin_url}
                    onChange={(e) => updateField("linkedin_url", e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={form.portfolio_url}
                    onChange={(e) => updateField("portfolio_url", e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="is_public"
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => updateField("is_public", e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="is_public" className="text-sm text-slate-200">
                  Make my profile public so employers can discover me
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : profileExists
                  ? "Update Profile"
                  : "Create Profile"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
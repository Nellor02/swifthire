"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../../../lib/auth";
import { authFetch } from "../../../../lib/api";
import StatusCard from "../../../../components/StatusCard";

type TalentProfile = {
  id: number;
  full_name: string;
  headline: string;
  location: string;
  email: string;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export default function ContactTalentPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id);

  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);

  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      setUserChecked(true);
      setIsLoggedIn(false);
      setIsEmployer(false);
      setLoadingProfile(false);
      return;
    }

    setUserChecked(true);
    setIsLoggedIn(true);

    if (!["employer", "admin"].includes(user.role)) {
      setIsEmployer(false);
      setLoadingProfile(false);
      return;
    }

    setIsEmployer(true);
  }, []);

  useEffect(() => {
    if (!userChecked || !isLoggedIn || !isEmployer || !id) {
      return;
    }

    setLoadingProfile(true);
    setError("");

    authFetch(`http://127.0.0.1:8000/api/profiles/talent/${id}/`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (res.status === 404) {
          setNotFoundState(true);
          setLoadingProfile(false);
          return null;
        }

        if (!res.ok) {
          throw new Error(data?.error || `Failed to load talent profile. (${res.status})`);
        }

        return data;
      })
      .then((data: TalentProfile | null) => {
        if (!data) return;
        setProfile(data);
        setLoadingProfile(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load talent profile.");
        setLoadingProfile(false);
      });
  }, [userChecked, isLoggedIn, isEmployer, id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }

    if (!message.trim()) {
      setError("Message is required.");
      return;
    }

    setSending(true);

    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/profiles/talent/${id}/contact/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          message,
        }),
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        setError(data?.error || `Failed to send message. (${res.status})`);
        setSending(false);
        return;
      }

      setSuccess(data?.message || "Message sent successfully.");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while sending the message.");
    } finally {
      setSending(false);
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
            message="You must be logged in to contact candidates."
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
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Access Restricted"
            message="Only employers and admins can contact candidates."
            variant="error"
            actionHref="/"
            actionLabel="Back to Home"
          />
        </div>
      </main>
    );
  }

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Loading Candidate"
            message="Please wait while candidate details are being loaded."
            variant="info"
          />
        </div>
      </main>
    );
  }

  if (notFoundState) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Candidate Not Found"
            message="This candidate profile does not exist or is no longer available."
            variant="neutral"
            actionHref="/talent"
            actionLabel="Back to Talent Search"
          />
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Error"
            message={error}
            variant="error"
            actionHref="/talent"
            actionLabel="Back to Talent Search"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={profile ? `/talent/${profile.id}` : "/talent"}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Profile
          </Link>

          <Link
            href="/talent"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
          >
            Back to Talent Search
          </Link>
        </div>

        {profile && (
          <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-100">
              Contact {profile.full_name}
            </h1>
            <p className="mt-1 text-slate-300">
              {profile.headline || "No headline provided"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {profile.location || "Location not specified"}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {error && profile && (
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
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Enter message subject"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Message
                </label>
                <textarea
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                  placeholder="Write your message to the candidate"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
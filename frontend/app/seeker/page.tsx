"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../lib/auth";
import { authFetch } from "../../lib/api";
import StatusCard from "../../components/StatusCard";

type SeekerDashboardStats = {
  total_applications: number;
  pending_applications: number;
  reviewed_applications: number;
  accepted_applications: number;
  rejected_applications: number;
  unread_notifications: number;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export default function SeekerDashboardPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeeker, setIsSeeker] = useState(false);

  const [stats, setStats] = useState<SeekerDashboardStats>({
    total_applications: 0,
    pending_applications: 0,
    reviewed_applications: 0,
    accepted_applications: 0,
    rejected_applications: 0,
    unread_notifications: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, []);

  useEffect(() => {
    if (!userChecked || !isLoggedIn || !isSeeker) {
      return;
    }

    setLoading(true);
    setError("");

    authFetch("http://127.0.0.1:8000/api/applications/seeker/dashboard/stats/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load seeker dashboard.");
        }

        return data;
      })
      .then((data: SeekerDashboardStats) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Could not load seeker dashboard."
        );
        setLoading(false);
      });
  }, [userChecked, isLoggedIn, isSeeker]);

  if (!userChecked) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-6xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to view the seeker dashboard."
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
        <div className="mx-auto max-w-6xl">
          <StatusCard
            title="Access Restricted"
            message="Only seekers can access this page."
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
            <h1 className="text-3xl font-bold text-slate-100">
              Seeker Dashboard
            </h1>
            <p className="mt-1 text-slate-300">
              Track your applications, profile, and notifications.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back to Home
            </Link>

            <Link
              href="/profile"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              My Profile
            </Link>

            <Link
              href="/my-applications"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              My Applications
            </Link>
          </div>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Dashboard"
            message="Please wait while your dashboard is being loaded."
            variant="info"
          />
        ) : error ? (
          <StatusCard
            title="Error"
            message={error}
            variant="error"
          />
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Total Applications</p>
                <h2 className="text-2xl font-bold text-white">
                  {stats.total_applications}
                </h2>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Accepted</p>
                <h2 className="text-2xl font-bold text-green-300">
                  {stats.accepted_applications}
                </h2>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Unread Notifications</p>
                <h2 className="text-2xl font-bold text-teal-300">
                  {stats.unread_notifications}
                </h2>
              </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Pending</p>
                <h2 className="text-2xl font-bold text-blue-300">
                  {stats.pending_applications}
                </h2>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Reviewed</p>
                <h2 className="text-2xl font-bold text-yellow-300">
                  {stats.reviewed_applications}
                </h2>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Rejected</p>
                <h2 className="text-2xl font-bold text-red-300">
                  {stats.rejected_applications}
                </h2>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-100">
                  Quick Actions
                </h3>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/profile"
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                  >
                    Edit Profile
                  </Link>

                  <Link
                    href="/my-applications"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    View Applications
                  </Link>

                  <Link
                    href="/saved-jobs"
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                  >
                    Saved Jobs
                  </Link>

                  <Link
                    href="/messages"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Messages
                  </Link>

                  <Link
                    href="/notifications"
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    Notifications
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-100">
                  Summary
                </h3>

                <div className="mt-4 space-y-3 text-slate-300">
                  <p>
                    You have submitted{" "}
                    <span className="font-semibold text-white">
                      {stats.total_applications}
                    </span>{" "}
                    application{stats.total_applications !== 1 ? "s" : ""}.
                  </p>

                  <p>
                    You currently have{" "}
                    <span className="font-semibold text-blue-300">
                      {stats.pending_applications}
                    </span>{" "}
                    pending application
                    {stats.pending_applications !== 1 ? "s" : ""}.
                  </p>

                  <p>
                    You have{" "}
                    <span className="font-semibold text-yellow-300">
                      {stats.reviewed_applications}
                    </span>{" "}
                    reviewed application
                    {stats.reviewed_applications !== 1 ? "s" : ""}.
                  </p>

                  <p>
                    You have{" "}
                    <span className="font-semibold text-green-300">
                      {stats.accepted_applications}
                    </span>{" "}
                    accepted application
                    {stats.accepted_applications !== 1 ? "s" : ""}.
                  </p>

                  <p>
                    You have{" "}
                    <span className="font-semibold text-red-300">
                      {stats.rejected_applications}
                    </span>{" "}
                    rejected application
                    {stats.rejected_applications !== 1 ? "s" : ""}.
                  </p>

                  <p>
                    You also have{" "}
                    <span className="font-semibold text-teal-300">
                      {stats.unread_notifications}
                    </span>{" "}
                    unread notification
                    {stats.unread_notifications !== 1 ? "s" : ""}.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
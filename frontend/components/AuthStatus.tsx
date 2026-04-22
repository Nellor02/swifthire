"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "../lib/api";

type StoredUser = {
  username: string;
  role: string;
};

type NotificationsResponse = {
  unread_count: number;
};

type EmployerApplicationStatus = {
  status: string;
  legacy_account?: boolean;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function NavLinkWithBadge({
  href,
  label,
  badgeCount,
  className,
}: {
  href: string;
  label: string;
  badgeCount?: number;
  className: string;
}) {
  return (
    <Link href={href} className={`relative ${className}`}>
      <span>{label}</span>
      {badgeCount && badgeCount > 0 ? (
        <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold leading-none text-white">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </Link>
  );
}

export default function AuthStatus() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [employerApprovalStatus, setEmployerApprovalStatus] = useState<
    "approved" | "pending" | "rejected" | "unknown"
  >("unknown");

  useEffect(() => {
    const rawUser = localStorage.getItem("user");

    if (rawUser) {
      try {
        const parsedUser: StoredUser = JSON.parse(rawUser);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
      }
    }

    setChecked(true);
  }, []);

  useEffect(() => {
    if (!checked || !user) {
      return;
    }

    authFetch("/api/profiles/notifications/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          return;
        }

        const typed = data as NotificationsResponse;
        setUnreadNotifications(typed.unread_count || 0);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [checked, user]);

  useEffect(() => {
    if (!checked || !user || user.role !== "employer") {
      return;
    }

    authFetch("/api/accounts/employer-application/me/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          setEmployerApprovalStatus("approved");
          return;
        }

        const typed = data as EmployerApplicationStatus;

        if (typed.legacy_account || typed.status === "approved") {
          setEmployerApprovalStatus("approved");
        } else if (typed.status === "pending") {
          setEmployerApprovalStatus("pending");
        } else if (typed.status === "rejected") {
          setEmployerApprovalStatus("rejected");
        } else {
          setEmployerApprovalStatus("unknown");
        }
      })
      .catch((err) => {
        console.error(err);
        setEmployerApprovalStatus("approved");
      });
  }, [checked, user]);

  function handleLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  }

  if (!checked) {
    return null;
  }

  const employerIsApproved =
    employerApprovalStatus === "approved" || employerApprovalStatus === "unknown";

  return (
    <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
      {user ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-300">
                Logged in as{" "}
                <span className="font-semibold text-slate-100">
                  {user.username}
                </span>{" "}
                <span className="text-slate-400">({user.role})</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {user.role === "seeker" && (
                <>
                  <Link
                    href="/seeker"
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/saved-jobs"
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                  >
                    Saved Jobs
                  </Link>

                  <Link
                    href="/my-applications"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    My Applications
                  </Link>

                  <Link
                    href="/profile"
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                  >
                    My Profile
                  </Link>

                  <Link
                    href="/messages"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Messages
                  </Link>

                  <NavLinkWithBadge
                    href="/notifications"
                    label="Notifications"
                    badgeCount={unreadNotifications}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  />
                </>
              )}

              {user.role === "employer" && (
                <>
                  {employerIsApproved ? (
                    <>
                      <Link
                        href="/employer/jobs"
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                      >
                        Employer Dashboard
                      </Link>

                      <Link
                        href="/employer/jobs/new"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Create Job
                      </Link>

                      <Link
                        href="/employer/company"
                        className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                      >
                        Company Profile
                      </Link>

                      <Link
                        href="/talent"
                        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                      >
                        Talent Search
                      </Link>

                      <Link
                        href="/employer/accepted"
                        className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                      >
                        Accepted Candidates
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/employer/application-status"
                      className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                    >
                      Application Status
                    </Link>
                  )}

                  <Link
                    href="/messages"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Messages
                  </Link>

                  <NavLinkWithBadge
                    href="/notifications"
                    label="Notifications"
                    badgeCount={unreadNotifications}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  />
                </>
              )}

              {user.role === "admin" && (
                <>
                  <Link
                    href="/admin/employer-applications"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Employer Reviews
                  </Link>

                  <Link
                    href="/admin/analytics"
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                  >
                    Analytics
                  </Link>

                  <Link
                    href="/employer/jobs"
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                  >
                    Platform Jobs
                  </Link>

                  <Link
                    href="/messages"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Messages
                  </Link>

                  <NavLinkWithBadge
                    href="/notifications"
                    label="Notifications"
                    badgeCount={unreadNotifications}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  />
                </>
              )}

              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>

          {user.role === "employer" && !employerIsApproved && (
            <div className="rounded-lg border border-yellow-700 bg-yellow-900/40 px-4 py-3 text-sm text-yellow-200">
              Your employer account is currently under review or has been rejected.
              Employer tools are locked until approval. Check your application
              status for details.
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-300">You are not logged in.</p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
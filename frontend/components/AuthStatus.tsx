"use client";

import Link from "next/link";
import { useEffect, useCallback, useRef, useState } from "react";
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

function MenuLink({
  href,
  label,
  badgeCount,
  onClick,
}: {
  href: string;
  label: string;
  badgeCount?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
    >
      <span>{label}</span>

      {badgeCount && badgeCount > 0 ? (
        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </Link>
  );
}

export default function AuthStatus() {
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<StoredUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [employerApprovalStatus, setEmployerApprovalStatus] = useState<
    "approved" | "pending" | "rejected" | "unknown"
  >("unknown");

  const closeMenu = () => setMenuOpen(false);

  const refreshNotificationCount = useCallback(async () => {
    if (!user) return;

    try {
      const res = await authFetch("/api/profiles/notifications/");
      const data = await parseResponseSafely(res);

      if (res.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
        setMenuOpen(false);
        return;
      }

      if (!res.ok) return;

      const typed = data as NotificationsResponse;
      setUnreadNotifications(typed.unread_count || 0);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

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
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
      }
    }

    setChecked(true);
  }, []);

  useEffect(() => {
    if (!checked || !user) return;

    refreshNotificationCount();

    const intervalId = window.setInterval(() => {
      refreshNotificationCount();
    }, 120000);

    const handleFocus = () => {
      refreshNotificationCount();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshNotificationCount();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checked, user, refreshNotificationCount]);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    window.location.href = "/login";
  }

  if (!checked) {
    return null;
  }

  const employerIsApproved =
    employerApprovalStatus === "approved" ||
    employerApprovalStatus === "unknown";

  return (
    <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
      {user ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">
                Logged in as{" "}
                <span className="font-semibold text-slate-100">
                  {user.username}
                </span>{" "}
                <span className="text-slate-400">({user.role})</span>
              </p>

              {unreadNotifications > 0 && (
                <p className="mt-1 text-xs text-teal-300">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications} unread
                  notification{unreadNotifications === 1 ? "" : "s"}
                </p>
              )}
            </div>

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span>Menu</span>
                <span className="text-lg leading-none">☰</span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl"
                >
                  <div className="border-b border-slate-700 px-3 py-3">
                    <p className="text-sm font-semibold text-slate-100">
                      {user.username}
                    </p>
                    <p className="text-xs capitalize text-slate-400">
                      {user.role}
                    </p>
                  </div>

                  <div className="py-2">
                    {user.role === "seeker" && (
                      <>
                        <MenuLink href="/seeker" label="Dashboard" onClick={closeMenu} />
                        <MenuLink href="/saved-jobs" label="Saved Jobs" onClick={closeMenu} />
                        <MenuLink href="/my-applications" label="My Applications" onClick={closeMenu} />
                        <MenuLink href="/profile" label="My Profile" onClick={closeMenu} />
                      </>
                    )}

                    {user.role === "employer" && (
                      <>
                        {employerIsApproved ? (
                          <>
                            <MenuLink href="/employer/jobs" label="Employer Dashboard" onClick={closeMenu} />
                            <MenuLink href="/employer/jobs/new" label="Create Job" onClick={closeMenu} />
                            <MenuLink href="/employer/company" label="Company Profile" onClick={closeMenu} />
                            <MenuLink href="/talent" label="Talent Search" onClick={closeMenu} />
                            <MenuLink href="/employer/accepted" label="Accepted Candidates" onClick={closeMenu} />
                          </>
                        ) : (
                          <MenuLink href="/employer/application-status" label="Application Status" onClick={closeMenu} />
                        )}
                      </>
                    )}

                    {user.role === "admin" && (
                      <>
                        <MenuLink href="/admin/employer-applications" label="Employer Reviews" onClick={closeMenu} />
                        <MenuLink href="/admin/analytics" label="Analytics" onClick={closeMenu} />
                        <MenuLink href="/employer/jobs" label="Platform Jobs" onClick={closeMenu} />
                      </>
                    )}

                    <div className="my-2 border-t border-slate-700" />

                    <MenuLink href="/messages" label="Messages" onClick={closeMenu} />
                    <MenuLink
                      href="/notifications"
                      label="Notifications"
                      badgeCount={unreadNotifications}
                      onClick={closeMenu}
                    />
                    <MenuLink href="/account/settings" label="Account Settings" onClick={closeMenu} />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-300 hover:bg-red-950/50 hover:text-red-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {user.role === "employer" && !employerIsApproved && (
            <div className="rounded-lg border border-yellow-700 bg-yellow-900/40 px-4 py-3 text-sm text-yellow-200">
              Your employer account is currently under review or has been
              rejected. Employer tools are locked until approval. Check your
              application status for details.
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
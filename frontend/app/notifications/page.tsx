"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "../../lib/auth";
import { authFetch } from "../../lib/api";
import StatusCard from "../../components/StatusCard";

type NotificationItem = {
  id: number;
  user: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  target_id: number | null;
  target_url?: string;
  action_url?: string;
  created_at: string;
};

type NotificationResponse = {
  results: NotificationItem[];
  unread_count: number;
};

type MarkReadResponse = {
  notification: NotificationItem;
  unread_count: number;
};

type StoredUser = {
  username: string;
  role: string;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function getNotificationHref(notification: NotificationItem, userRole: string) {
  if (notification.action_url) return notification.action_url;
  if (notification.target_url) return notification.target_url;

  switch (notification.type) {
    case "message":
      return notification.target_id ? `/messages/${notification.target_id}` : "/messages";

    case "application":
      if (userRole === "admin") {
        return notification.target_id
          ? `/admin/employer-applications/${notification.target_id}`
          : "/admin/employer-applications";
      }

      return notification.target_id
        ? `/employer/jobs/${notification.target_id}/applicants`
        : "/employer/jobs";

    case "status_update":
      return userRole === "employer"
        ? "/employer/application-status"
        : "/my-applications";

    case "shortlist":
    case "contact":
      return "/profile/preview";

    default:
      return "/notifications";
  }
}

function getTypeClasses(type: string) {
  switch (type) {
    case "message":
      return "bg-indigo-900 text-indigo-200 border border-indigo-700";
    case "application":
      return "bg-blue-900 text-blue-200 border border-blue-700";
    case "status_update":
      return "bg-green-900 text-green-200 border border-green-700";
    case "shortlist":
      return "bg-yellow-900 text-yellow-200 border border-yellow-700";
    case "contact":
      return "bg-purple-900 text-purple-200 border border-purple-700";
    default:
      return "bg-slate-700 text-slate-200 border border-slate-600";
  }
}

export default function NotificationsPage() {
  const router = useRouter();

  const [userChecked, setUserChecked] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const user = getStoredUser() as StoredUser | null;

    if (!user) {
      setUserChecked(true);
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setUserChecked(true);
    setIsLoggedIn(true);
    setUserRole(user.role);

    authFetch("/api/profiles/notifications/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load notifications.");
        }

        return data as NotificationResponse;
      })
      .then((data) => {
        setNotifications(Array.isArray(data.results) ? data.results : []);
        setUnreadCount(data.unread_count || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load notifications.");
        setLoading(false);
      });
  }, []);

  async function markOneRead(notificationId: number) {
    const current = notifications.find((item) => item.id === notificationId);

    if (!current || current.is_read) {
      return;
    }

    const res = await authFetch(`/api/profiles/notifications/${notificationId}/read/`, {
      method: "PATCH",
    });

    const data = await parseResponseSafely(res);

    if (!res.ok) {
      throw new Error(data?.error || "Failed to mark notification as read.");
    }

    const typed = data as MarkReadResponse;

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              ...(typed.notification || {}),
              is_read: true,
            }
          : item
      )
    );

    setUnreadCount(
      typeof typed.unread_count === "number"
        ? typed.unread_count
        : Math.max(0, unreadCount - 1)
    );
  }

  async function handleMarkOneRead(notificationId: number) {
    setError("");
    setSuccess("");
    setActionLoadingId(notificationId);

    try {
      await markOneRead(notificationId);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to mark as read.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleOpenNotification(notification: NotificationItem) {
    const href = getNotificationHref(notification, userRole);

    setError("");
    setSuccess("");
    setActionLoadingId(notification.id);

    try {
      await markOneRead(notification.id);
      router.push(href);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to open notification.");
      setActionLoadingId(null);
    }
  }

  async function handleMarkAllRead() {
    setError("");
    setSuccess("");
    setMarkAllLoading(true);

    try {
      const res = await authFetch("/api/profiles/notifications/read-all/", {
        method: "POST",
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to mark all notifications as read.");
      }

      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      setSuccess(data?.message || "All notifications marked as read.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to mark all as read.");
    } finally {
      setMarkAllLoading(false);
    }
  }

  if (!userChecked) return null;

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to view notifications."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        </div>
      </main>
    );
  }

  const backHref =
    userRole === "admin"
      ? "/admin/employer-applications"
      : userRole === "employer"
        ? "/employer/jobs"
        : "/";

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Notifications</h1>
            <p className="mt-1 text-slate-300">
              You have {unreadCount} unread notification
              {unreadCount !== 1 ? "s" : ""}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleMarkAllRead}
              disabled={markAllLoading || unreadCount === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {markAllLoading ? "Marking..." : "Mark All Read"}
            </button>

            <Link
              href={backHref}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back
            </Link>
          </div>
        </div>

        {success && (
          <div className="mb-6">
            <StatusCard title="Success" message={success} variant="success" />
          </div>
        )}

        {error && (
          <div className="mb-6">
            <StatusCard title="Error" message={error} variant="error" />
          </div>
        )}

        {loading ? (
          <StatusCard
            title="Loading Notifications"
            message="Please wait while your notifications are being loaded."
            variant="info"
          />
        ) : notifications.length === 0 ? (
          <StatusCard
            title="No Notifications Yet"
            message="You do not have any notifications yet."
            variant="neutral"
            actionHref={backHref}
            actionLabel="Go Back"
          />
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const href = getNotificationHref(notification, userRole);
              const isBusy = actionLoadingId === notification.id;

              return (
                <div
                  key={notification.id}
                  className={`rounded-xl border p-6 shadow-sm ${
                    notification.is_read
                      ? "border-slate-700 bg-slate-800"
                      : "border-blue-700 bg-slate-800"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getTypeClasses(
                            notification.type
                          )}`}
                        >
                          {notification.type.replace("_", " ")}
                        </span>

                        {!notification.is_read && (
                          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                            Unread
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl font-semibold text-slate-100">
                        {notification.title}
                      </h2>

                      <p className="mt-2 text-slate-300">
                        {notification.message || "No message."}
                      </p>

                      <p className="mt-3 text-sm text-slate-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleOpenNotification(notification)}
                        disabled={isBusy}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isBusy ? "Opening..." : "Open"}
                      </button>

                      <Link
                        href={href}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
                      >
                        View Link
                      </Link>

                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkOneRead(notification.id)}
                          disabled={isBusy}
                          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:opacity-50"
                        >
                          {isBusy ? "Marking..." : "Mark Read"}
                        </button>
                      )}
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
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authFetch } from "../../../lib/api";
import StatusCard from "../../../components/StatusCard";

type AdminUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  email_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredUsers = useMemo(() => users, [users]);

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (role) params.set("role", role);

      const query = params.toString();
      const res = await authFetch(`/api/accounts/admin/users/${query ? `?${query}` : ""}`);
      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Could not load users.");
      }

      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function performAction(userId: number, action: string) {
    const confirmText =
      action === "delete"
        ? "Are you sure you want to permanently delete this user?"
        : "Are you sure you want to perform this action?";

    if (!window.confirm(confirmText)) return;

    setActionLoadingId(userId);
    setMessage("");
    setError("");

    try {
      const res =
        action === "delete"
          ? await authFetch(`/api/accounts/admin/users/${userId}/`, {
              method: "DELETE",
            })
          : await authFetch(`/api/accounts/admin/users/${userId}/`, {
              method: "PATCH",
              body: JSON.stringify({ action }),
            });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Action failed.");
      }

      setMessage(data?.message || "Action completed.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Users</h1>
            <p className="mt-2 text-slate-300">
              Manage user accounts, verification status, roles, and access.
            </p>
          </div>

          <Link
            href="/admin/analytics"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
          >
            Back to Analytics
          </Link>
        </div>

        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username or email..."
              className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
            >
              <option value="">All roles</option>
              <option value="seeker">Seeker</option>
              <option value="employer">Employer</option>
              <option value="admin">Admin</option>
            </select>

            <button
              onClick={loadUsers}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Filter
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-6">
            <StatusCard title="Success" message={message} variant="success" />
          </div>
        )}

        {error && (
          <div className="mb-6">
            <StatusCard title="Error" message={error} variant="error" />
          </div>
        )}

        {loading ? (
          <StatusCard
            title="Loading Users"
            message="Please wait while users load."
            variant="info"
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800">
            <table className="min-w-full divide-y divide-slate-700 text-sm">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">
                    User
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">
                    Verified
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-100">
                          {user.username}
                        </div>
                        <div className="text-xs text-slate-400">ID: {user.id}</div>
                      </td>

                      <td className="px-4 py-3 capitalize text-slate-300">
                        {user.role}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {user.email || "No email"}
                      </td>

                      <td className="px-4 py-3">
                        {user.email_verified ? (
                          <span className="rounded-full bg-green-900/60 px-2 py-1 text-xs text-green-300">
                            Verified
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-900/60 px-2 py-1 text-xs text-yellow-300">
                            Unverified
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {user.is_active ? (
                          <span className="rounded-full bg-green-900/60 px-2 py-1 text-xs text-green-300">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-900/60 px-2 py-1 text-xs text-red-300">
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {!user.email_verified && (
                            <button
                              onClick={() => performAction(user.id, "verify_email")}
                              disabled={actionLoadingId === user.id}
                              className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              Verify
                            </button>
                          )}

                          {user.is_active ? (
                            <button
                              onClick={() => performAction(user.id, "suspend")}
                              disabled={actionLoadingId === user.id}
                              className="rounded bg-yellow-600 px-3 py-1 text-xs font-semibold text-white hover:bg-yellow-700 disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => performAction(user.id, "activate")}
                              disabled={actionLoadingId === user.id}
                              className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Activate
                            </button>
                          )}

                          {user.role !== "admin" ? (
                            <button
                              onClick={() => performAction(user.id, "promote_admin")}
                              disabled={actionLoadingId === user.id}
                              className="rounded bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                            >
                              Promote
                            </button>
                          ) : (
                            <button
                              onClick={() => performAction(user.id, "demote_admin")}
                              disabled={actionLoadingId === user.id}
                              className="rounded bg-slate-600 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-500 disabled:opacity-50"
                            >
                              Demote
                            </button>
                          )}

                          <button
                            onClick={() => performAction(user.id, "delete")}
                            disabled={actionLoadingId === user.id}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
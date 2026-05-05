"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authFetch, getFileUrl } from "../../lib/api";
import { getStoredUser } from "../../lib/auth";
import StatusCard from "../../components/StatusCard";

type StoredUser = {
  username: string;
  role: string;
};

type LastMessage = {
  id?: number;
  body?: string;
  sender_username?: string;
  sender_role?: string;
  sender_profile_picture?: string | null;
  sender_company_logo?: string | null;
  sender_avatar?: string | null;
  created_at?: string;
};

type CandidateProfile = {
  id: number;
  full_name?: string;
  profile_picture?: string | null;
};

type Conversation = {
  id: number;
  employer: number;
  employer_username: string;
  employer_logo?: string | null;
  seeker: number;
  seeker_username: string;
  seeker_profile_picture?: string | null;
  other_user_username?: string;
  other_user_role?: string;
  other_user_avatar?: string | null;
  candidate_profile?: CandidateProfile | null;
  last_message: LastMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function formatDate(dateString?: string) {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
}

function truncateText(text?: string, maxLength = 140) {
  if (!text) return "No messages yet.";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function getInitials(name?: string) {
  const cleaned = (name || "").trim();
  if (!cleaned) return "SH";
  return cleaned.slice(0, 2).toUpperCase();
}

function getConversationTitle(conversation: Conversation, user: StoredUser) {
  if (conversation.other_user_username) return conversation.other_user_username;

  if (user.role === "employer" || user.role === "admin") {
    return (
      conversation.candidate_profile?.full_name ||
      conversation.seeker_username ||
      "Seeker"
    );
  }

  return conversation.employer_username || "Employer";
}

function getConversationSubtitle(conversation: Conversation, user: StoredUser) {
  if (conversation.other_user_role) return `with ${conversation.other_user_role}`;

  if (user.role === "employer" || user.role === "admin") {
    return "Candidate conversation";
  }

  return "Employer conversation";
}

function getConversationAvatarUrl(conversation: Conversation, user: StoredUser) {
  if (conversation.other_user_avatar) {
    return getFileUrl(conversation.other_user_avatar);
  }

  if (user.role === "employer" || user.role === "admin") {
    return getFileUrl(
      conversation.seeker_profile_picture ||
        conversation.candidate_profile?.profile_picture
    );
  }

  return getFileUrl(conversation.employer_logo);
}

export default function MessagesPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) return;

      if (options?.silent) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }

      try {
        const res = await authFetch("/api/profiles/messages/");
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load messages.");
        }

        const rows: Conversation[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        const sortedRows = [...rows].sort((a, b) => {
          const aTime = a?.updated_at ? new Date(a.updated_at).getTime() : 0;
          const bTime = b?.updated_at ? new Date(b.updated_at).getTime() : 0;
          return bTime - aTime;
        });

        setConversations(sortedRows);
        setError("");
      } catch (err) {
        console.error(err);

        if (!options?.silent) {
          setError(err instanceof Error ? err.message : "Could not load messages.");
        }
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);

    if (!storedUser) {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userChecked || !user) return;

    loadConversations();

    const intervalId = window.setInterval(() => {
      loadConversations({ silent: true });
    }, 10000);

    function handleFocus() {
      loadConversations({ silent: true });
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [userChecked, user, loadConversations]);

  const unreadCount = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + (conversation.unread_count || 0),
        0
      ),
    [conversations]
  );

  if (!userChecked) return null;

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to view messages."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        </div>
      </main>
    );
  }

  const backHref =
    user.role === "employer" || user.role === "admin" ? "/employer/jobs" : "/";

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Messages</h1>
            <p className="mt-1 text-slate-300">
              {unreadCount > 0
                ? `You have ${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}.`
                : "Review your conversations with candidates and employers."}
            </p>
            {refreshing && (
              <p className="mt-1 text-xs text-slate-500">
                Checking for new conversations...
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadConversations({ silent: true })}
              disabled={refreshing}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <Link
              href={backHref}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Back
            </Link>
          </div>
        </div>

        {initialLoading ? (
          <StatusCard
            title="Loading Messages"
            message="Please wait while your conversations are loading."
            variant="info"
          />
        ) : error ? (
          <StatusCard title="Error" message={error} variant="error" />
        ) : conversations.length === 0 ? (
          <StatusCard
            title="No Conversations Yet"
            message={
              user.role === "seeker"
                ? "Your conversations with employers will appear here."
                : "Start a conversation from a candidate profile or applicant page."
            }
            variant="neutral"
            actionHref={user.role === "seeker" ? "/" : "/talent"}
            actionLabel={user.role === "seeker" ? "Browse Jobs" : "Search Talent"}
          />
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const title = getConversationTitle(conversation, user);
              const subtitle = getConversationSubtitle(conversation, user);
              const avatarUrl = getConversationAvatarUrl(conversation, user);
              const preview = conversation.last_message?.body || "No messages yet.";
              const sender = conversation.last_message?.sender_username;
              const date =
                conversation.last_message?.created_at || conversation.updated_at;
              const isUnread = (conversation.unread_count || 0) > 0;

              return (
                <div
                  key={conversation.id}
                  className={`rounded-xl border p-6 shadow-sm ${
                    isUnread
                      ? "border-blue-700 bg-slate-800"
                      : "border-slate-700 bg-slate-800"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-1 gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-900 text-sm font-bold text-slate-300">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={`${title} avatar`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(title)
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-semibold text-slate-100">
                            {title}
                          </h2>

                          {isUnread && (
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                              {conversation.unread_count} unread
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-400">{subtitle}</p>

                        <p className="mt-3 text-slate-300">
                          {sender ? (
                            <>
                              <span className="font-medium text-slate-200">
                                {sender}:
                              </span>{" "}
                              {truncateText(preview)}
                            </>
                          ) : (
                            truncateText(preview)
                          )}
                        </p>

                        <p className="mt-3 text-sm text-slate-400">
                          {formatDate(date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/messages/${conversation.id}`}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Open Chat
                      </Link>
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
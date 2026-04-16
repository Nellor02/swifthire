"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../lib/auth";
import { authFetch } from "../../lib/api";
import StatusCard from "../../components/StatusCard";

type CandidateProfile = {
  id: number;
  full_name: string;
  headline: string;
  location: string;
};

type Conversation = {
  id: number;
  employer: number;
  employer_username: string;
  seeker: number;
  seeker_username: string;
  candidate_profile: CandidateProfile;
  last_message: {
    id: number;
    body: string;
    sender_username: string;
    created_at: string;
  } | null;
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

function truncateText(text: string, maxLength = 90) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function MessagesPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      setUserChecked(true);
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setUserChecked(true);
    setIsLoggedIn(true);
    setUserRole(user.role);

    authFetch("http://127.0.0.1:8000/api/profiles/messages/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load conversations.");
        }

        return data;
      })
      .then((data: Conversation[]) => {
        setConversations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Could not load conversations."
        );
        setLoading(false);
      });
  }, []);

  if (!userChecked) {
    return null;
  }

  if (!isLoggedIn) {
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

  const backHref = userRole === "seeker" ? "/" : "/employer/jobs";

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Messages</h1>
            <p className="mt-1 text-slate-300">
              View and continue your conversations.
            </p>
          </div>

          <Link
            href={backHref}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back
          </Link>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Messages"
            message="Please wait while your conversations are being loaded."
            variant="info"
          />
        ) : error ? (
          <StatusCard
            title="Error"
            message={error}
            variant="error"
          />
        ) : conversations.length === 0 ? (
          <StatusCard
            title="No Conversations Yet"
            message="You do not have any conversations yet."
            variant="neutral"
            actionHref={backHref}
            actionLabel="Go Back"
          />
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const otherParty =
                userRole === "employer"
                  ? conversation.candidate_profile?.full_name || conversation.seeker_username
                  : conversation.employer_username;

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className="block rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm hover:bg-slate-750"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold text-slate-100">
                          {otherParty}
                        </h2>

                        {conversation.unread_count > 0 && (
                          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                            {conversation.unread_count} unread
                          </span>
                        )}
                      </div>

                      {conversation.candidate_profile?.headline && userRole === "employer" && (
                        <p className="mt-1 text-slate-300">
                          {conversation.candidate_profile.headline}
                        </p>
                      )}

                      <p className="mt-3 text-sm text-slate-400">
                        {conversation.last_message
                          ? `${conversation.last_message.sender_username}: ${truncateText(
                              conversation.last_message.body
                            )}`
                          : "No messages yet."}
                      </p>
                    </div>

                    <div className="text-sm text-slate-400">
                      {new Date(conversation.updated_at).toLocaleString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
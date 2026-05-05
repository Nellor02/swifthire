"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch, getFileUrl } from "../../../lib/api";
import { getStoredUser } from "../../../lib/auth";
import StatusCard from "../../../components/StatusCard";

type StoredUser = {
  username: string;
  role: string;
};

type CandidateProfile = {
  id: number;
  full_name?: string;
  profile_picture?: string | null;
};

type Message = {
  id: number;
  sender: number;
  sender_username: string;
  body: string;
  created_at: string;
  is_read: boolean;
};

type ConversationDetail = {
  id: number;
  employer_username: string;
  seeker_username: string;
  candidate_profile?: CandidateProfile | null;
  messages: Message[];
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
  if (!dateString) return "Unknown time";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return date.toLocaleString();
}

function getInitials(name?: string) {
  const cleaned = (name || "").trim();
  if (!cleaned) return "SH";
  return cleaned.slice(0, 2).toUpperCase();
}

export default function MessageThreadPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);
  }, []);

  async function loadConversation() {
    if (!conversationId) return;

    setLoading(true);
    setError("");

    try {
      const res = await authFetch(`/api/profiles/messages/${conversationId}/`);
      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Could not load conversation.");
      }

      setConversation(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not load conversation.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userChecked || !user || !conversationId) return;
    loadConversation();
  }, [userChecked, user, conversationId]);

  async function handleSendMessage() {
    if (!messageInput.trim()) return;

    setSending(true);

    try {
      const res = await authFetch(`/api/profiles/messages/${conversationId}/send/`, {
        method: "POST",
        body: JSON.stringify({ body: messageInput.trim() }),
      });

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to send message.");
      }

      setMessageInput("");
      await loadConversation();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  const otherUser = useMemo(() => {
    if (!conversation || !user) return "";

    if (user.role === "employer" || user.role === "admin") {
      return conversation.candidate_profile?.full_name || conversation.seeker_username;
    }

    return conversation.employer_username;
  }, [conversation, user]);

  const otherAvatarUrl = useMemo(() => {
    if (!conversation || !user) return "";

    if (user.role === "employer" || user.role === "admin") {
      return getFileUrl(conversation.candidate_profile?.profile_picture);
    }

    return "";
  }, [conversation, user]);

  if (!userChecked) return null;

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
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

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-900 text-sm font-bold text-slate-300">
              {otherAvatarUrl ? (
                <img
                  src={otherAvatarUrl}
                  alt={`${otherUser || "User"} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(otherUser)
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-100">
                {otherUser ? `Chat with ${otherUser}` : "Conversation"}
              </h1>
              <p className="mt-1 text-slate-300">
                Send and receive messages.
              </p>
            </div>
          </div>

          <Link
            href="/messages"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Messages
          </Link>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Conversation"
            message="Please wait while messages load."
            variant="info"
          />
        ) : error ? (
          <StatusCard
            title="Error"
            message={error}
            variant="error"
            actionHref="/messages"
            actionLabel="Back"
          />
        ) : !conversation ? (
          <StatusCard
            title="Conversation Not Found"
            message="This conversation does not exist."
            variant="neutral"
            actionHref="/messages"
            actionLabel="Back"
          />
        ) : (
          <>
            <div className="mb-6 space-y-4 rounded-xl border border-slate-700 bg-slate-800 p-4">
              {conversation.messages.length === 0 ? (
                <p className="text-slate-400">No messages yet.</p>
              ) : (
                conversation.messages.map((msg) => {
                  const isMine = msg.sender_username === user.username;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-3 ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isMine && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300">
                          {otherAvatarUrl ? (
                            <img
                              src={otherAvatarUrl}
                              alt={`${msg.sender_username} avatar`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(msg.sender_username)
                          )}
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          isMine
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-slate-100"
                        }`}
                      >
                        <div className="mb-1 text-xs opacity-80">
                          {isMine ? "You" : msg.sender_username}
                        </div>

                        <p className="whitespace-pre-line">{msg.body}</p>

                        <p className="mt-2 text-right text-xs opacity-70">
                          {formatDate(msg.created_at)}
                        </p>
                      </div>

                      {isMine && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500 bg-blue-700 text-xs font-bold text-white">
                          You
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
              />

              <button
                onClick={handleSendMessage}
                disabled={sending || !messageInput.trim()}
                className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
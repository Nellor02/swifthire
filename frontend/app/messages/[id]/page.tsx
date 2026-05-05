"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch, getApiBaseUrl, getFileUrl } from "../../../lib/api";
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
  sender?: number;
  sender_username: string;
  sender_role?: string;
  sender_profile_picture?: string | null;
  sender_company_logo?: string | null;
  sender_avatar?: string | null;
  body: string;
  created_at: string;
  is_read?: boolean;
};

type ConversationDetail = {
  id: number;
  employer_username: string;
  employer_logo?: string | null;
  seeker_username: string;
  seeker_profile_picture?: string | null;
  other_user_username?: string;
  other_user_role?: string;
  other_user_avatar?: string | null;
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

function getAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") || "";
}

function getWebSocketBaseUrl() {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl.startsWith("https://")) {
    return apiBaseUrl.replace("https://", "wss://");
  }

  if (apiBaseUrl.startsWith("http://")) {
    return apiBaseUrl.replace("http://", "ws://");
  }

  return "ws://127.0.0.1:8000";
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

function getMessageAvatarUrl(message: Message) {
  return getFileUrl(
    message.sender_avatar ||
      message.sender_profile_picture ||
      message.sender_company_logo
  );
}

export default function MessageThreadPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
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

  useEffect(() => {
    if (!userChecked || !user || !conversationId) return;

    const token = getAccessToken();

    if (!token) {
      setSocketConnected(false);
      return;
    }

    const wsBaseUrl = getWebSocketBaseUrl();
    const socketUrl = `${wsBaseUrl}/ws/messages/${conversationId}/?token=${encodeURIComponent(
      token
    )}`;

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setSocketConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const incoming = JSON.parse(event.data) as Message;

        setConversation((prev) => {
          if (!prev) return prev;

          const alreadyExists = prev.messages.some(
            (message) => String(message.id) === String(incoming.id)
          );

          if (alreadyExists) return prev;

          return {
            ...prev,
            messages: [...prev.messages, incoming],
          };
        });
      } catch (err) {
        console.error("Invalid WebSocket message:", err);
      }
    };

    socket.onerror = (event) => {
      console.error("WebSocket error:", event);
      setSocketConnected(false);
    };

    socket.onclose = () => {
      setSocketConnected(false);
    };

    return () => {
      socket.close();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [userChecked, user, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  async function handleSendMessage() {
    const body = messageInput.trim();
    if (!body || sending) return;

    setSending(true);
    setError("");

    try {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ message: body }));
        setMessageInput("");
        return;
      }

      const res = await authFetch(`/api/profiles/messages/${conversationId}/send/`, {
        method: "POST",
        body: JSON.stringify({ body }),
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

    if (conversation.other_user_username) {
      return conversation.other_user_username;
    }

    if (user.role === "employer" || user.role === "admin") {
      return conversation.candidate_profile?.full_name || conversation.seeker_username;
    }

    return conversation.employer_username;
  }, [conversation, user]);

  const otherAvatarUrl = useMemo(() => {
    if (!conversation || !user) return "";

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
                {socketConnected
                  ? "Real-time chat connected."
                  : "Real-time chat reconnecting or unavailable."}
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
            <div className="mb-6 max-h-[60vh] space-y-4 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 p-4">
              {conversation.messages.length === 0 ? (
                <p className="text-slate-400">No messages yet.</p>
              ) : (
                conversation.messages.map((msg) => {
                  const isMine = msg.sender_username === user.username;
                  const messageAvatarUrl = getMessageAvatarUrl(msg);

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-3 ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isMine && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300">
                          {messageAvatarUrl ? (
                            <img
                              src={messageAvatarUrl}
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
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-500 bg-blue-700 text-xs font-bold text-white">
                          {messageAvatarUrl ? (
                            <img
                              src={messageAvatarUrl}
                              alt="Your avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            "You"
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                rows={2}
                className="flex-1 resize-none rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
              />

              <button
                onClick={handleSendMessage}
                disabled={sending || !messageInput.trim()}
                className="self-end rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Press Enter to send. Press Shift + Enter for a new line.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
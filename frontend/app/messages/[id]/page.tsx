"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getStoredUser } from "../../../lib/auth";
import { authFetch } from "../../../lib/api";
import StatusCard from "../../../components/StatusCard";

type CandidateProfile = {
  id: number;
  full_name: string;
  headline: string;
  location: string;
};

type Message = {
  id: number;
  conversation: number;
  sender: number;
  sender_username: string;
  body: string;
  created_at: string;
  is_read: boolean;
};

type ConversationDetail = {
  id: number;
  employer: number;
  employer_username: string;
  seeker: number;
  seeker_username: string;
  candidate_profile: CandidateProfile;
  messages: Message[];
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

export default function ConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const conversationId = String(params.id);

  const [userChecked, setUserChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [username, setUsername] = useState("");

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

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
    setUsername(user.username);

    authFetch(`http://127.0.0.1:8000/api/profiles/messages/${conversationId}/`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load conversation.");
        }

        return data;
      })
      .then((data: ConversationDetail) => {
        setConversation(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Could not load conversation."
        );
        setLoading(false);
      });
  }, [conversationId]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  async function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!messageBody.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    setSending(true);

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/profiles/messages/${conversationId}/send/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body: messageBody }),
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to send message.");
      }

      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, data],
              updated_at: data.created_at,
            }
          : prev
      );

      setMessageBody("");
      setSuccess("Message sent.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to send message.");
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

  const backHref = "/messages";

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Conversation</h1>
            {conversation && (
              <p className="mt-1 text-slate-300">
                {userRole === "employer"
                  ? conversation.candidate_profile?.full_name || conversation.seeker_username
                  : conversation.employer_username}
              </p>
            )}
          </div>

          <Link
            href={backHref}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Messages
          </Link>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Conversation"
            message="Please wait while the conversation is being loaded."
            variant="info"
          />
        ) : error ? (
          <StatusCard
            title="Error"
            message={error}
            variant="error"
          />
        ) : !conversation ? (
          <StatusCard
            title="Conversation Not Found"
            message="This conversation could not be found."
            variant="neutral"
            actionHref="/messages"
            actionLabel="Back to Messages"
          />
        ) : (
          <>
            {success && (
              <div className="mb-4">
                <StatusCard
                  title="Success"
                  message={success}
                  variant="success"
                />
              </div>
            )}

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                {conversation.messages.length === 0 ? (
                  <p className="text-slate-400">No messages yet.</p>
                ) : (
                  conversation.messages.map((message) => {
                    const isMine = message.sender_username === username;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-4 py-3 ${
                            isMine
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-slate-100"
                          }`}
                        >
                          <p className="mb-1 text-xs opacity-80">
                            {message.sender_username}
                          </p>
                          <p>{message.body}</p>
                          <p className="mt-2 text-xs opacity-70">
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    New Message
                  </label>
                  <textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                    placeholder="Write your message..."
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
          </>
        )}
      </div>
    </main>
  );
}
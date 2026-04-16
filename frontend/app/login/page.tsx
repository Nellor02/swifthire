"use client";

import { useState } from "react";
import StatusCard from "../../components/StatusCard";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tokenRes = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        setError(tokenData?.detail || "Login failed");
        setLoading(false);
        return;
      }

      const userRes = await fetch("http://127.0.0.1:8000/api/accounts/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const userData = await userRes.json();

      if (!userRes.ok) {
        setError(userData?.error || "Failed to fetch user info");
        setLoading(false);
        return;
      }

      localStorage.setItem("access_token", tokenData.access);
      localStorage.setItem("refresh_token", tokenData.refresh);

      localStorage.setItem(
        "user",
        JSON.stringify({
          username: userData.username,
          role: userData.role,
        })
      );

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
      <div className="w-full max-w-md space-y-6">
        {error && (
          <StatusCard
            title="Login Error"
            message={error}
            variant="error"
          />
        )}

        <form
          onSubmit={handleLogin}
          className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-sm"
        >
          <h1 className="text-2xl font-bold text-slate-100">
            Login
          </h1>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
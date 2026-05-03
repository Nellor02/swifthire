import { clearStoredAuth } from "./auth";
import { safeJson, extractErrorMessage } from "./apiHelpers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function apiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function isFormDataBody(body: BodyInit | null | undefined): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", token);
}

function redirectToLoginIfNeeded() {
  if (typeof window === "undefined") return;

  const path = window.location.pathname;
  const publicPaths = ["/", "/login", "/register"];

  if (!publicPaths.includes(path)) {
    window.location.href = "/login";
  }
}

function buildHeaders(init: RequestInit, token?: string | null) {
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body && !isFormDataBody(init.body)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(apiUrl("/api/token/refresh/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.access) {
      clearStoredAuth();
      redirectToLoginIfNeeded();
      return null;
    }

    setAccessToken(data.access);
    return data.access;
  } catch {
    clearStoredAuth();
    redirectToLoginIfNeeded();
    return null;
  }
}

export async function authFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const url = apiUrl(input);

  let response = await fetch(url, {
    ...init,
    headers: buildHeaders(init, token),
  });

  if (response.status === 401) {
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    response = await fetch(url, {
      ...init,
      headers: buildHeaders(init, newAccessToken),
    });

    if (response.status === 401) {
      clearStoredAuth();
      redirectToLoginIfNeeded();

      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  if (!response.ok) {
    const data = await safeJson(response);
    const message = extractErrorMessage(data, "Request failed.");

    return new Response(JSON.stringify({ error: message }), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return response;
}

export function getFileUrl(filePath?: string | null): string {
  if (!filePath) return "";

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  return apiUrl(filePath);
}

export async function safeFetch(
  input: string,
  init: RequestInit = {}
): Promise<unknown> {
  const res = await fetch(apiUrl(input), {
    ...init,
    headers: buildHeaders(init),
  });

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Request failed."));
  }

  return data;
}
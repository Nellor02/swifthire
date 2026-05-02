import { apiUrl } from "./api";

export async function safeFetch(
  path: string,
  options?: RequestInit
) {
  try {
    const res = await fetch(apiUrl(path), options);

    const contentType = res.headers.get("content-type") || "";

    let data: any;

    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { error: text || `Request failed (${res.status})` };
    }

    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }

    return data;
  } catch (err) {
    console.error("API ERROR:", err);
    throw err;
  }
}
import { apiUrl } from "./api";

export async function authSafeFetch(
  path: string,
  token: string,
  options?: RequestInit
) {
  return fetch(apiUrl(path), {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
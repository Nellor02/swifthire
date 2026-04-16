export type StoredUser = {
  username: string;
  role: string;
};

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  const rawUser = localStorage.getItem("user");
  const accessToken = localStorage.getItem("access_token");

  if (!rawUser || !accessToken) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return null;
  }
}

export function logoutUser() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
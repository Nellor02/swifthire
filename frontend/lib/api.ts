export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  let accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  const headers = new Headers(init.headers || {});

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401 && refreshToken) {
    const refreshResponse = await fetch(
      "http://127.0.0.1:8000/api/token/refresh/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      }
    );

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      accessToken = data.access;

      localStorage.setItem("access_token", accessToken as string);
      const retryHeaders = new Headers(init.headers || {});
      retryHeaders.set("Authorization", `Bearer ${accessToken}`);

      response = await fetch(input, {
        ...init,
        headers: retryHeaders,
      });
    } else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  }

  return response;
}
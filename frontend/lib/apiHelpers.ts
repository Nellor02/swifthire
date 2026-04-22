export async function safeJson(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

export function extractErrorMessage(data: any, fallback: string) {
  if (!data) return fallback;

  if (typeof data === "string") return data;

  if (data.error) return data.error;

  if (data.detail) return data.detail;

  if (typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    const value = data[firstKey];

    if (Array.isArray(value) && value.length > 0) {
      return String(value[0]);
    }

    if (typeof value === "string") {
      return value;
    }
  }

  return fallback;
}
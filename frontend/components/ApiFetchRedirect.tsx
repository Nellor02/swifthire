"use client";

import { useEffect } from "react";
import { getApiBaseUrl } from "../lib/api";

export default function ApiFetchRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    const apiBaseUrl = getApiBaseUrl();

    window.fetch = function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === "string") {
        const fixedInput = input.replace("http://127.0.0.1:8000", apiBaseUrl);
        return originalFetch(fixedInput, init);
      }

      if (input instanceof URL) {
        const fixedUrl = input.toString().replace("http://127.0.0.1:8000", apiBaseUrl);
        return originalFetch(fixedUrl, init);
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
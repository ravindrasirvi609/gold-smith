"use client";

import { useEffect } from "react";

function hasCsrfCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part.startsWith("csrf_token="));
}

export function CsrfCookieBootstrap() {
  useEffect(() => {
    if (hasCsrfCookie()) return;

    void fetch("/api/csrf", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
  }, []);

  return null;
}

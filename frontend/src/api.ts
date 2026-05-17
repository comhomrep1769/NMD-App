import { getNmdToken } from "./utils/authStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "";

function normalizeApiPath(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanBase = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

function getErrorMessage(response: Response, body: unknown) {
  if (body && typeof body === "object") {
    const data = body as {
      message?: unknown;
      error?: unknown;
      detail?: unknown;
      details?: unknown;
    };

    const message = data.message || data.error || data.detail || data.details;

    if (message) return String(message);
  }

  if (typeof body === "string" && body.trim()) {
    return body.trim();
  }

  return `Request failed (${response.status} ${response.statusText})`;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getNmdToken();

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("X-Auth-Token", token);
  }

  const response = await fetch(normalizeApiPath(path), {
    ...options,
    credentials: "include",
    headers
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(response, body));
  }

  return body as T;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getCurrentAuthTokenForDebug() {
  return getNmdToken();
}

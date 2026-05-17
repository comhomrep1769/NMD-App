const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "";

type UnknownRecord = Record<string, unknown>;

const JWT_PATTERN = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

function readStorageValue(key: string) {
  return localStorage.getItem(key) || sessionStorage.getItem(key) || "";
}

function isJwtLike(value: unknown) {
  if (typeof value !== "string") return false;
  return JWT_PATTERN.test(value.trim());
}

function findJwtDeep(value: unknown, depth = 0): string {
  if (depth > 5 || value === null || value === undefined) return "";

  if (isJwtLike(value)) {
    return String(value).trim();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (isJwtLike(trimmed)) return trimmed;

    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return findJwtDeep(JSON.parse(trimmed), depth + 1);
      } catch {
        return "";
      }
    }

    return "";
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJwtDeep(item, depth + 1);
      if (found) return found;
    }

    return "";
  }

  if (typeof value === "object") {
    const objectValue = value as UnknownRecord;

    const likelyTokenKeys = [
      "token",
      "authToken",
      "accessToken",
      "jwt",
      "idToken",
      "bearerToken",
      "sessionToken"
    ];

    for (const key of likelyTokenKeys) {
      const found = findJwtDeep(objectValue[key], depth + 1);
      if (found) return found;
    }

    for (const nestedValue of Object.values(objectValue)) {
      const found = findJwtDeep(nestedValue, depth + 1);
      if (found) return found;
    }
  }

  return "";
}

function getStoredToken() {
  const directTokenKeys = [
    "nmd_token",
    "nmdToken",
    "nmd_auth_token",
    "nmdAuthToken",
    "auth_token",
    "authToken",
    "access_token",
    "accessToken",
    "token",
    "jwt",
    "idToken",
    "bearerToken",
    "sessionToken"
  ];

  for (const key of directTokenKeys) {
    const value = readStorageValue(key);
    const token = findJwtDeep(value);

    if (token) return token;
  }

  const objectKeys = [
    "nmd_auth",
    "nmdAuth",
    "nmd_user",
    "nmdUser",
    "nmd_session",
    "nmdSession",
    "auth",
    "user",
    "currentUser",
    "session",
    "profile",
    "account"
  ];

  for (const key of objectKeys) {
    const value = readStorageValue(key);
    const token = findJwtDeep(value);

    if (token) return token;
  }

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;

    const value = localStorage.getItem(key);
    const token = findJwtDeep(value);

    if (token) return token;
  }

  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (!key) continue;

    const value = sessionStorage.getItem(key);
    const token = findJwtDeep(value);

    if (token) return token;
  }

  return "";
}

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

    if (message) {
      return String(message);
    }
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
  const token = getStoredToken();

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(normalizeApiPath(path), {
    ...options,
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
  return getStoredToken();
}

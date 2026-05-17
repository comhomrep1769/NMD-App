const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "";

type StoredAuthObject = {
  token?: string;
  authToken?: string;
  accessToken?: string;
  jwt?: string;
  user?: {
    token?: string;
    authToken?: string;
    accessToken?: string;
    jwt?: string;
  };
  data?: {
    token?: string;
    authToken?: string;
    accessToken?: string;
    jwt?: string;
  };
};

function readStorageValue(key: string) {
  return localStorage.getItem(key) || sessionStorage.getItem(key) || "";
}

function getTokenFromObject(rawValue: string) {
  try {
    const parsed = JSON.parse(rawValue) as StoredAuthObject;

    return (
      parsed.token ||
      parsed.authToken ||
      parsed.accessToken ||
      parsed.jwt ||
      parsed.user?.token ||
      parsed.user?.authToken ||
      parsed.user?.accessToken ||
      parsed.user?.jwt ||
      parsed.data?.token ||
      parsed.data?.authToken ||
      parsed.data?.accessToken ||
      parsed.data?.jwt ||
      ""
    );
  } catch {
    return "";
  }
}

function getStoredToken() {
  const directTokenKeys = [
    "nmd_token",
    "nmdToken",
    "nmd_auth_token",
    "nmdAuthToken",
    "authToken",
    "accessToken",
    "token",
    "jwt"
  ];

  for (const key of directTokenKeys) {
    const value = readStorageValue(key);

    if (value && !value.trim().startsWith("{")) {
      return value;
    }

    if (value && value.trim().startsWith("{")) {
      const token = getTokenFromObject(value);
      if (token) return token;
    }
  }

  const objectKeys = [
    "nmd_auth",
    "nmdAuth",
    "nmd_user",
    "nmdUser",
    "auth",
    "user",
    "currentUser",
    "session"
  ];

  for (const key of objectKeys) {
    const value = readStorageValue(key);

    if (!value) continue;

    const token = getTokenFromObject(value);
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

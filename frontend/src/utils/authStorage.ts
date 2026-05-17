export type StoredNmdUser = {
  id?: string;
  email?: string;
  displayName?: string;
  name?: string;
  role?: "superadmin" | "admin" | "employee" | "client" | string;
};

export type StoredNmdAuth = {
  token: string;
  user: StoredNmdUser | null;
};

const AUTH_STORAGE_KEY = "nmd_auth";
const TOKEN_STORAGE_KEY = "nmd_token";
const USER_STORAGE_KEY = "nmd_user";

const JWT_PATTERN = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

function isJwtLike(value: unknown) {
  return typeof value === "string" && JWT_PATTERN.test(value.trim());
}

function findTokenDeep(value: unknown, depth = 0): string {
  if (depth > 6 || value === null || value === undefined) return "";

  if (isJwtLike(value)) return String(value).trim();

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (isJwtLike(trimmed)) return trimmed;

    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return findTokenDeep(JSON.parse(trimmed), depth + 1);
      } catch {
        return "";
      }
    }

    return "";
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTokenDeep(item, depth + 1);
      if (found) return found;
    }

    return "";
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

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
      const found = findTokenDeep(record[key], depth + 1);
      if (found) return found;
    }

    for (const nestedValue of Object.values(record)) {
      const found = findTokenDeep(nestedValue, depth + 1);
      if (found) return found;
    }
  }

  return "";
}

function findUserDeep(value: unknown, depth = 0): StoredNmdUser | null {
  if (depth > 6 || value === null || value === undefined) return null;

  if (typeof value === "string") {
    try {
      return findUserDeep(JSON.parse(value), depth + 1);
    } catch {
      return null;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findUserDeep(item, depth + 1);
      if (found) return found;
    }

    return null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    const possibleUser =
      record.user ||
      record.authUser ||
      record.account ||
      record.profile ||
      record.data;

    if (possibleUser && typeof possibleUser === "object") {
      const nested = possibleUser as Record<string, unknown>;

      if (nested.email || nested.role || nested.id) {
        return {
          id: String(nested.id || nested.userId || nested.sub || ""),
          email: String(nested.email || ""),
          displayName: String(
            nested.displayName || nested.display_name || nested.name || nested.email || ""
          ),
          name: String(nested.name || nested.displayName || nested.email || ""),
          role: String(nested.role || "")
        };
      }

      const deeper = findUserDeep(possibleUser, depth + 1);
      if (deeper) return deeper;
    }

    if (record.email || record.role || record.id) {
      return {
        id: String(record.id || record.userId || record.sub || ""),
        email: String(record.email || ""),
        displayName: String(
          record.displayName || record.display_name || record.name || record.email || ""
        ),
        name: String(record.name || record.displayName || record.email || ""),
        role: String(record.role || "")
      };
    }

    for (const nestedValue of Object.values(record)) {
      const found = findUserDeep(nestedValue, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

export function saveNmdAuth(loginResponse: unknown) {
  const token = findTokenDeep(loginResponse);
  const user = findUserDeep(loginResponse);

  if (!token) {
    throw new Error(
      "Login succeeded, but no JWT token was found in the login response."
    );
  }

  const auth: StoredNmdAuth = {
    token,
    user
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  return auth;
}

export function getNmdAuth(): StoredNmdAuth | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY) || "";

    if (!token) return null;

    return {
      token,
      user: getNmdUser()
    };
  }

  try {
    const parsed = JSON.parse(raw) as StoredNmdAuth;

    if (!parsed.token) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function getNmdToken() {
  const auth = getNmdAuth();

  if (auth?.token) return auth.token;

  return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

export function getNmdUser(): StoredNmdUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredNmdUser;
  } catch {
    return null;
  }
}

export function clearNmdAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);

  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
}

export function hasNmdToken() {
  return Boolean(getNmdToken());
}

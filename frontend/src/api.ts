const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://nmd-backend.onrender.com";

function getToken() {
  return (
    localStorage.getItem("nmd-token") ||
    sessionStorage.getItem("nmd-token")
  );
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  let data: any = null;

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.error
        ? data.error
        : typeof data === "string" && data
          ? data
          : "Request failed";

    throw new Error(message);
  }

  return data as T;
}

import React from "react";
import { apiFetch } from "../api";
import { saveNmdAuth } from "../utils/authStorage";
import type { AuthUser, AuthUserRole } from "../types";

type LoginResponseUser = {
  id?: string;
  email?: string;
  displayName?: string;
  name?: string;
  role?: AuthUserRole | string;
};

type LoginResponse = {
  token?: string;
  user?: LoginResponseUser;
  message?: string;
};

type LoginPageProps = {
  onLogin?: (token: string, loggedInUser: AuthUser) => void;
  portalRole?: string;
  title?: string;
  subtitle?: string;
};

function normalizeRole(value: string): AuthUserRole {
  const role = value.toLowerCase();

  if (role === "superadmin") return "superadmin" as AuthUserRole;
  if (role === "admin") return "admin" as AuthUserRole;
  if (role === "employee") return "employee" as AuthUserRole;

  return "client" as AuthUserRole;
}

function getPortalPath(role: string) {
  const normalized = role.toLowerCase();

  if (normalized === "superadmin" || normalized === "admin") {
    return "/admin";
  }

  if (normalized === "employee") {
    return "/employee";
  }

  return "/client";
}

function buildAuthUser(user: LoginResponseUser | null | undefined): AuthUser {
  const role = normalizeRole(String(user?.role || "client"));

  return {
    id: String(user?.id || ""),
    email: String(user?.email || ""),
    displayName: String(user?.displayName || user?.name || user?.email || ""),
    role
  } as AuthUser;
}

export default function LoginPage({
  onLogin,
  portalRole = "",
  title = "NMD Login",
  subtitle = "Sign in to access your NMD portal."
}: LoginPageProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          rememberMe,
          portalRole
        })
      });

      const auth = saveNmdAuth(data);
      const loggedInUser = buildAuthUser(auth.user || data.user);
      const token = auth.token || data.token || "";

      if (!token) {
        throw new Error("Login succeeded, but no authorization token was saved.");
      }

      setSuccess("Login successful. Redirecting...");

      if (onLogin) {
        onLogin(token, loggedInUser);
        return;
      }

      window.location.href = getPortalPath(String(loggedInUser.role || portalRole || "client"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <section className="panel loginPanel">
        <div className="panelHeader">
          <div>
            <h1 className="panelTitle">{title}</h1>
            <p className="brandSubtitle">{subtitle}</p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        {success && <div className="listCard">{success}</div>}

        <form className="formGrid" onSubmit={handleLogin}>
          <label className="fieldLabel">
            Email
            <input
              className="textInput"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="fieldLabel">
            Password
            <input
              className="textInput"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          <label
            className="fieldLabel"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexDirection: "row"
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Keep me logged in
          </label>

          <div className="buttonRow">
            <button className="primaryButton" type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Login"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

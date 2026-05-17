import React from "react";
import { apiFetch } from "../api";
import { saveNmdAuth } from "../utils/authStorage";
import type { AuthUserRole } from "../types";

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

export default function LoginPage() {
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
          rememberMe
        })
      });

      const auth = saveNmdAuth(data);
      const role = String(auth.user?.role || data.user?.role || "client");

      setSuccess("Login successful. Redirecting...");

      window.location.href = getPortalPath(role);
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
            <h1 className="panelTitle">NMD Login</h1>
            <p className="brandSubtitle">
              Sign in to access your NMD portal.
            </p>
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

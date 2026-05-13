import React from "react";
import { apiFetch } from "../api";
import type { AuthUser, Role } from "../types";

export default function LoginPage({
  onLogin,
  portalRole,
  title,
  subtitle
}: {
  onLogin: (token: string, user: AuthUser) => void;
  portalRole?: Role;
  title?: string;
  subtitle?: string;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const data = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (portalRole && data.user.role !== portalRole) {
        localStorage.removeItem("nmd-token");
        setError(`This login is for ${portalRole} accounts only.`);
        return;
      }

      if (rememberMe) {
        localStorage.setItem("nmd-token", data.token);
      } else {
        sessionStorage.setItem("nmd-token", data.token);
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginShell">
      <section className="loginCard">
        <h1 className="panelTitle">{title || "NMD Portal Login"}</h1>

        <p className="brandSubtitle">
          {subtitle || "Sign in to continue."}
        </p>

        {error && <div className="errorBox">{error}</div>}

        <form className="formGrid" onSubmit={submit}>
          <input
            className="textInput"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label className="assignItem">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Keep me logged in</span>
          </label>

          <button className="primaryButton" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </div>
  );
}

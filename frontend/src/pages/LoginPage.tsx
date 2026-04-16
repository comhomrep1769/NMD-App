import React from "react";
import { apiFetch } from "../api";
import type { AuthUser } from "../types";

export default function LoginPage({
  onLogin
}: {
  onLogin: (token: string, user: AuthUser) => void;
}) {
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [role, setRole] = React.useState<"admin" | "employee">("employee");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            displayName,
            role
          })
        });
        setMode("login");
        setError("Registered successfully. Please log in.");
      } else {
        const data = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });

        onLogin(data.token, data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginShell">
      <form className="loginCard" onSubmit={submit}>
        <h1 className="panelTitle">NMD Login</h1>
        <p className="brandSubtitle">
          Admin and employee portal access
        </p>

        {error && <div className="errorBox">{error}</div>}

        {mode === "register" && (
          <>
            <input
              className="textInput"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <select
              className="textInput"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "employee")}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </>
        )}

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

        <button className="primaryButton" type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>

        <button
          className="secondaryButton"
          type="button"
          onClick={() => {
            setError("");
            setMode((prev) => (prev === "login" ? "register" : "login"));
          }}
        >
          {mode === "login" ? "Need an account?" : "Already have an account?"}
        </button>
      </form>
    </div>
  );
}

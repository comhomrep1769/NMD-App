import React from "react";
import { apiFetch } from "../api";
import type { AuthUser } from "../types";

export default function ClientRegisterPage({
  onRegistered,
  onBackToLogin
}: {
  onRegistered: (token: string, user: AuthUser) => void;
  onBackToLogin: () => void;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setSaving(true);

      const data = await apiFetch<{ token: string; user: AuthUser }>(
        "/api/auth/client-register",
        {
          method: "POST",
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phone,
            address,
            password
          })
        }
      );

      onRegistered(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="loginShell">
      <section className="loginCard">
        <h1 className="panelTitle">Create Client Account</h1>
        <p className="brandSubtitle">
          Create your NMD client portal login to view quotes, invoices, appointments, and payments.
        </p>

        {error && <div className="errorBox">{error}</div>}

        <form className="formGrid" onSubmit={submit}>
          <input
            className="textInput"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Service address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button className="primaryButton" type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create Account"}
          </button>

          <button className="secondaryButton" type="button" onClick={onBackToLogin}>
            Back To Login
          </button>
        </form>
      </section>
    </div>
  );
}

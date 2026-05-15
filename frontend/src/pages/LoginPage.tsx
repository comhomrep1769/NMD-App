import React from "react";
import { apiFetch } from "../api";
import type { AuthUser } from "../types";
import { getRoleLabel, isRoleAllowedInPortal } from "../utils/roles";

type LoginPortalRole = "admin" | "employee" | "client";

type SeedUser = {
  role: string;
  email: string;
  password: string;
};

type SeedResponse = {
  message?: string;
  users?: SeedUser[];
};

function getAllowedRoleText(portalRole: LoginPortalRole) {
  if (portalRole === "admin") return "Admin or Super Admin";
  if (portalRole === "employee") return "Employee";
  return "Client";
}

function getPortalHint(portalRole: LoginPortalRole) {
  if (portalRole === "admin") return "Use your Admin or Super Admin credentials.";
  if (portalRole === "employee") return "Use your Employee credentials.";
  return "Use your Client account credentials.";
}

function getDefaultTestCredentials(portalRole: LoginPortalRole) {
  if (portalRole === "admin") {
    return [
      {
        role: "Super Admin",
        email: "superadmin@nmd.test",
        password: "Test123!"
      },
      {
        role: "Admin",
        email: "admin@nmd.test",
        password: "Test123!"
      }
    ];
  }

  if (portalRole === "employee") {
    return [
      {
        role: "Employee",
        email: "employee@nmd.test",
        password: "Test123!"
      }
    ];
  }

  return [
    {
      role: "Client",
      email: "client@nmd.test",
      password: "Test123!"
    }
  ];
}

export default function LoginPage({
  onLogin,
  portalRole,
  title,
  subtitle
}: {
  onLogin: (token: string, user: AuthUser) => void;
  portalRole: LoginPortalRole;
  title: string;
  subtitle: string;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [seeding, setSeeding] = React.useState(false);
  const [error, setError] = React.useState("");
  const [seedMessage, setSeedMessage] = React.useState("");
  const [seedUsers, setSeedUsers] = React.useState<SeedUser[]>([]);

  const defaultTestCredentials = getDefaultTestCredentials(portalRole);

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSeedMessage("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe
        })
      });

      if (!isRoleAllowedInPortal(data.user.role, portalRole)) {
        setError(
          `This login belongs to a ${getRoleLabel(
            data.user
          )} account. This portal only allows ${getAllowedRoleText(portalRole)} access.`
        );

        localStorage.removeItem("nmd-token");
        sessionStorage.removeItem("nmd-token");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("nmd-token", data.token);
        sessionStorage.removeItem("nmd-token");
      } else {
        sessionStorage.setItem("nmd-token", data.token);
        localStorage.removeItem("nmd-token");
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const seedTestUsers = async () => {
    setError("");
    setSeedMessage("");
    setSeeding(true);

    try {
      const data = await apiFetch<SeedResponse>("/api/auth/seed-test-users", {
        method: "POST"
      });

      setSeedMessage(data.message || "Test users checked/created.");

      if (Array.isArray(data.users) && data.users.length > 0) {
        setSeedUsers(data.users);
      } else {
        setSeedUsers(defaultTestCredentials);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not seed test users: ${err.message}`
          : "Could not seed test users."
      );

      setSeedUsers(defaultTestCredentials);
    } finally {
      setSeeding(false);
    }
  };

  const useCredential = (credential: SeedUser) => {
    setEmail(credential.email);
    setPassword(credential.password);
    setError("");
    setSeedMessage(`Loaded ${credential.role} test credentials.`);
  };

  const filteredSeedUsers =
    seedUsers.length > 0
      ? seedUsers.filter((seedUser) => {
          const role = seedUser.role.toLowerCase();

          if (portalRole === "admin") {
            return role === "admin" || role === "superadmin" || role === "super admin";
          }

          if (portalRole === "employee") {
            return role === "employee";
          }

          return role === "client";
        })
      : defaultTestCredentials;

  return (
    <div className="authPage">
      <section className="authCard">
        <div className="authBrand">
          <div className="authLogo">NMD</div>

          <div>
            <h1 className="authTitle">{title}</h1>
            <p className="brandSubtitle">{subtitle}</p>
          </div>
        </div>

        <div className="listCard" style={{ marginBottom: 16 }}>
          {getPortalHint(portalRole)}
        </div>

        {error && <div className="errorBox">{error}</div>}

        {seedMessage && (
          <div className="listCard" style={{ marginBottom: 16 }}>
            {seedMessage}
          </div>
        )}

        <form className="formGrid" onSubmit={submitLogin}>
          <label className="fieldLabel">
            Email
            <input
              className="textInput"
              type="email"
              autoComplete="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Password
            <input
              className="textInput"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--muted)",
              fontSize: 14,
              fontWeight: 700
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Keep me logged in on this device
          </label>

          <button className="primaryButton" type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="assignBox" style={{ marginTop: 16 }}>
          <div className="assignTitle">Test Account Helper</div>

          <div className="cardLine">
            This is only for testing the app while building. Admin, Super Admin, and Employee
            accounts should still be manually controlled before production.
          </div>

          <div className="buttonRow" style={{ marginTop: 12 }}>
            <button
              className="secondaryButton"
              type="button"
              onClick={seedTestUsers}
              disabled={seeding}
            >
              {seeding ? "Checking Test Users..." : "Create / Check Test Users"}
            </button>
          </div>

          <div className="cardsGrid" style={{ marginTop: 12 }}>
            {filteredSeedUsers.map((credential) => (
              <button
                key={`${credential.role}-${credential.email}`}
                className="quoteCard"
                type="button"
                onClick={() => useCredential(credential)}
                style={{ textAlign: "left", cursor: "pointer" }}
              >
                <div className="quoteTopRow">
                  <div className="quoteNumber">{credential.role}</div>
                  <span className="statusBadge status-approved">Test</span>
                </div>

                <div className="cardLine">
                  <strong>Email:</strong> {credential.email}
                </div>

                <div className="cardLine">
                  <strong>Password:</strong> {credential.password}
                </div>

                <div className="cardLine">Click this card to load the credentials.</div>
              </button>
            ))}
          </div>
        </div>

        <div className="listCard" style={{ marginTop: 16 }}>
          Public signup should only create Client accounts. Admin, Super Admin, and Employee
          accounts should not be created from the public client registration page.
        </div>
      </section>
    </div>
  );
}

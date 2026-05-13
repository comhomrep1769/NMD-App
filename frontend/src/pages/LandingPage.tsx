import React from "react";
import { apiFetch } from "../api";
import type { AuthUser } from "../types";

export default function LandingPage({
  onClientLogin,
  onCreateAccount,
  onRequestService
}: {
  onClientLogin: (token: string, user: AuthUser) => void;
  onCreateAccount: () => void;
  onRequestService: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const loginClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const data = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (data.user.role !== "client") {
        setError("This login area is for client accounts only.");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("nmd-token", data.token);
      } else {
        sessionStorage.setItem("nmd-token", data.token);
      }

      onClientLogin(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginShell">
      <section className="loginCard" style={{ maxWidth: 1180 }}>
        <div className="panelHeader">
          <div>
            <h1 className="panelTitle">NMD Pressure Washing Services LLC</h1>
            <p className="brandSubtitle">
              No More Dirt • Residential • Commercial • Industrial
            </p>
          </div>

          <div className="buttonRow">
            <a
              className="secondaryButton"
              href="https://www.instagram.com/nmdpowash"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
            >
              Instagram
            </a>

            <a
              className="secondaryButton"
              href="https://www.youtube.com/@NMDPressureWashing"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
            >
              YouTube
            </a>

            <a
              className="secondaryButton"
              href="https://www.facebook.com/people/NMD-Pressure-Washing-Services/61572361587152/"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
            >
              Facebook
            </a>
          </div>
        </div>

        <div className="pageGrid" style={{ marginTop: 24 }}>
          <section className="panel">
            <h2 className="panelTitle">Professional Exterior Cleaning</h2>

            <p className="cardLine">
              NMD helps homeowners and businesses remove dirt, grime, algae,
              stains, and buildup from exterior surfaces with professional
              pressure washing and soft washing workflows.
            </p>

            <div className="statsGrid" style={{ marginTop: 18 }}>
              <div className="statCard">
                <div className="statLabel">House Washing</div>
                <div className="statValue">Soft Wash</div>
              </div>

              <div className="statCard">
                <div className="statLabel">Concrete</div>
                <div className="statValue">Flatwork</div>
              </div>

              <div className="statCard">
                <div className="statLabel">Recurring</div>
                <div className="statValue">Service</div>
              </div>
            </div>

            <div className="buttonRow" style={{ marginTop: 18 }}>
              <button className="primaryButton" onClick={onRequestService}>
                Request Quote
              </button>

              <button className="secondaryButton" onClick={onCreateAccount}>
                Create Client Account
              </button>
            </div>
          </section>

          <section className="panel">
            <h2 className="panelTitle">Client Login</h2>

            <p className="brandSubtitle">
              View your quotes, invoices, appointments, recurring services, and payment links.
            </p>

            {error && <div className="errorBox">{error}</div>}

            <form className="formGrid" onSubmit={loginClient}>
              <input
                className="textInput"
                placeholder="Client email"
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
                {loading ? "Logging in..." : "Client Login"}
              </button>
            </form>
          </section>
        </div>

        <section className="panel" style={{ marginTop: 24 }}>
          <h2 className="panelTitle">Services</h2>

          <div className="cardsGrid">
            <div className="listCard">House siding</div>
            <div className="listCard">Driveways</div>
            <div className="listCard">Sidewalks</div>
            <div className="listCard">Fences</div>
            <div className="listCard">Pool decks</div>
            <div className="listCard">Trash can cleaning</div>
            <div className="listCard">Commercial surfaces</div>
            <div className="listCard">Recurring maintenance</div>
          </div>
        </section>

        <section className="panel" style={{ marginTop: 24 }}>
          <h2 className="panelTitle">Install This Web App</h2>

          <div className="cardsGrid">
            <div className="quoteCard">
              <div className="quoteNumber">iPhone</div>
              <div className="cardLine">
                Open in Safari, tap Share, then tap Add to Home Screen.
              </div>
            </div>

            <div className="quoteCard">
              <div className="quoteNumber">Android</div>
              <div className="cardLine">
                Open in Chrome, tap the menu, then tap Add to Home Screen.
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

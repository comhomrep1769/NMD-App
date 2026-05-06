export default function LandingPage({
  onLogin,
  onCreateAccount,
  onRequestService
}: {
  onLogin: () => void;
  onCreateAccount: () => void;
  onRequestService: () => void;
}) {
  return (
    <div className="loginShell">
      <section className="loginCard" style={{ maxWidth: 1100 }}>
        <div className="panelHeader">
          <div>
            <h1 className="panelTitle">NMD Pressure Washing Services LLC</h1>
            <p className="brandSubtitle">No More Dirt • Residential • Commercial • Industrial</p>
          </div>

          <div className="buttonRow">
            <button className="secondaryButton" onClick={onCreateAccount}>
              Create Account
            </button>

            <button className="secondaryButton" onClick={onLogin}>
              Login
            </button>
          </div>
        </div>

        <div className="statsGrid" style={{ marginTop: 24 }}>
          <div className="statCard">
            <div className="statLabel">House Washing</div>
            <div className="statValue">Soft Wash</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Concrete Cleaning</div>
            <div className="statValue">Driveways</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Recurring Service</div>
            <div className="statValue">Trash Cans</div>
          </div>
        </div>

        <div className="pageGrid" style={{ marginTop: 24 }}>
          <section className="panel">
            <h2 className="panelTitle">Professional Exterior Cleaning</h2>

            <p className="cardLine">
              NMD helps homeowners and businesses remove dirt, grime, algae, stains,
              and buildup from exterior surfaces with safe treatment planning and
              professional pressure washing workflows.
            </p>

            <div className="buttonRow" style={{ marginTop: 18 }}>
              <button className="primaryButton" onClick={onRequestService}>
                Request Quote
              </button>

              <button className="secondaryButton" onClick={onCreateAccount}>
                Create Client Account
              </button>

              <button className="secondaryButton" onClick={onLogin}>
                Client / Admin / Employee Login
              </button>
            </div>
          </section>

          <section className="panel">
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
        </div>

        <section className="panel" style={{ marginTop: 24 }}>
          <h2 className="panelTitle">Before & After</h2>

          <div className="statsGrid">
            <div className="statCard">
              <div className="statLabel">Before Photo</div>
              <div className="statValue">Coming Soon</div>
            </div>

            <div className="statCard">
              <div className="statLabel">After Photo</div>
              <div className="statValue">Coming Soon</div>
            </div>
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

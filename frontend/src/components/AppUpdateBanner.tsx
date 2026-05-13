import React from "react";

type VersionFile = {
  version: string;
};

export default function AppUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [remoteVersion, setRemoteVersion] = React.useState("");

  React.useEffect(() => {
    let active = true;

    const checkForUpdate = async () => {
      try {
        const response = await fetch(`/app-version.json?t=${Date.now()}`, {
          cache: "no-store"
        });

        if (!response.ok) return;

        const data = (await response.json()) as VersionFile;

        if (!data.version) return;

        const storedVersion = localStorage.getItem("nmd-app-version");

        if (!storedVersion) {
          localStorage.setItem("nmd-app-version", data.version);
          return;
        }

        if (storedVersion !== data.version && active) {
          setRemoteVersion(data.version);
          setUpdateAvailable(true);
        }
      } catch {
        // Silent fail so update checking never breaks the app.
      }
    };

    checkForUpdate();

    const interval = window.setInterval(checkForUpdate, 60_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const applyUpdate = () => {
    if (remoteVersion) {
      localStorage.setItem("nmd-app-version", remoteVersion);
    }

    const path = window.location.pathname || "/";
    const search = window.location.search;
    const separator = search ? "&" : "?";

    window.location.replace(`${path}${search}${separator}updated=${Date.now()}`);
  };

  const dismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 999,
        width: "100%",
        background: "linear-gradient(90deg, #16a34a, #2563eb)",
        color: "#ffffff",
        padding: "10px 14px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap"
        }}
      >
        <div style={{ fontWeight: 800 }}>
          NMD app update available. Refresh to load the newest version.
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={applyUpdate}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "8px 12px",
              fontWeight: 800,
              cursor: "pointer",
              background: "#ffffff",
              color: "#0f172a"
            }}
          >
            Update Now
          </button>

          <button
            type="button"
            onClick={dismiss}
            style={{
              border: "1px solid rgba(255,255,255,0.65)",
              borderRadius: 999,
              padding: "8px 12px",
              fontWeight: 800,
              cursor: "pointer",
              background: "transparent",
              color: "#ffffff"
            }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

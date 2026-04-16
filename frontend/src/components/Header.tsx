import type { AuthUser, ThemeMode } from "../types";

export default function Header({
  theme,
  onToggleTheme,
  user,
  onLogout
}: {
  theme: ThemeMode;
  onToggleTheme: () => void;
  user: AuthUser;
  onLogout: () => void;
}) {
  return (
    <header className="topBar">
      <div>
        <div className="brandTitle">NMD App</div>
        <div className="brandSubtitle">
          {user.role === "admin" ? "Admin Portal" : "Employee Portal"} • {user.displayName}
        </div>
      </div>

      <div className="topBarActions">
        <button className="themeButton" onClick={onToggleTheme}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <button className="secondaryButton" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

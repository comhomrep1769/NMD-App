import type { ThemeMode } from "../types";

export default function Header({
  theme,
  onToggleTheme
}: {
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  return (
    <header className="topBar">
      <div>
        <div className="brandTitle">NMD App</div>
        <div className="brandSubtitle">
          Quotes, invoices, scheduling, employees
        </div>
      </div>

      <button className="themeButton" onClick={onToggleTheme}>
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </button>
    </header>
  );
}

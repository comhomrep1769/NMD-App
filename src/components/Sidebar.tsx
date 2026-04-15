import type { PageKey } from "../types";

const items: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "clients", label: "Clients" },
  { key: "quotes", label: "Quotes" },
  { key: "invoices", label: "Invoices" }
];

export default function Sidebar({
  currentPage,
  onNavigate
}: {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebarLogo">NMD</div>

      <nav className="sidebarNav">
        {items.map((item) => (
          <button
            key={item.key}
            className={`sidebarLink ${currentPage === item.key ? "sidebarLinkActive" : ""}`}
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

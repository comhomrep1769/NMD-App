import type { PageKey, Role } from "../types";

const adminItems: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "clients", label: "Clients" },
  { key: "quotes", label: "Quotes" },
  { key: "invoices", label: "Invoices" }
];

const employeeItems: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "my-ledger", label: "My Ledger" }
];

export default function Sidebar({
  currentPage,
  onNavigate,
  role
}: {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  role: Role;
}) {
  const items = role === "admin" ? adminItems : employeeItems;

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

import type { PageKey, Role } from "../types";

const adminItems: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "Dash" },
  { key: "clients", label: "Clients" },
  { key: "quotes", label: "Quotes" },
  { key: "invoices", label: "Invoices" }
];

const employeeItems: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "Dash" },
  { key: "my-ledger", label: "Ledger" }
];

export default function MobileNav({
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
    <nav className="mobileNav">
      {items.map((item) => (
        <button
          key={item.key}
          className={`mobileNavLink ${currentPage === item.key ? "mobileNavLinkActive" : ""}`}
          onClick={() => onNavigate(item.key)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

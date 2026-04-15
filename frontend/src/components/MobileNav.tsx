import type { PageKey } from "../types";

const items: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "Dash" },
  { key: "clients", label: "Clients" },
  { key: "quotes", label: "Quotes" },
  { key: "invoices", label: "Invoices" }
];

export default function MobileNav({
  currentPage,
  onNavigate
}: {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
}) {
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

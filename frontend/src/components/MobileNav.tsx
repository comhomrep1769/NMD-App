import type { PageKey, Role } from "../types";

const adminItems: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "Home" },
  { key: "clients", label: "Clients" },
  { key: "quotes", label: "Quotes" },
  { key: "invoices", label: "Invoices" },
  { key: "schedule", label: "Schedule" },
  { key: "requests", label: "Requests" },
  { key: "chat", label: "Chat" },
  { key: "email", label: "Email" }
];

const employeeItems: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "Home" },
  { key: "schedule", label: "Schedule" },
  { key: "timeclock", label: "Clock" },
  { key: "my-ledger", label: "Ledger" },
  { key: "chat", label: "Chat" },
  { key: "treatments", label: "Treatments" }
];

const clientItems: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "Portal" },
  { key: "chat", label: "Chat" }
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
  const items =
    role === "admin" ? adminItems : role === "employee" ? employeeItems : clientItems;

  return (
    <nav className="mobileNav">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`mobileNavItem ${currentPage === item.key ? "mobileNavItemActive" : ""}`}
          onClick={() => onNavigate(item.key)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

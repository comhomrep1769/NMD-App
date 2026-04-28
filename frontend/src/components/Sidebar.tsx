import type { PageKey, Role } from "../types";

const adminItems: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "clients", label: "Clients" },
  { key: "quotes", label: "Quotes" },
  { key: "invoices", label: "Invoices" },
  { key: "schedule", label: "Schedule" },
  { key: "employees", label: "Employees" },
  { key: "requests", label: "Requests" },
  { key: "expenses", label: "Expenses" },
  { key: "mileage", label: "Mileage" },
  { key: "recurring", label: "Recurring" },
  { key: "equipment", label: "Equipment" },
  { key: "treatments", label: "Treatments" },
  { key: "pricing", label: "Pricing" },
  { key: "timeclock", label: "Time Clock" },
  { key: "availability", label: "Availability" },
  { key: "chat", label: "Chat" },
  { key: "tips", label: "Tips & Notes" },
  { key: "payroll", label: "Payroll Prep" }
];

const employeeItems: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "schedule", label: "My Schedule" },
  { key: "timeclock", label: "Time Clock" },
  { key: "my-ledger", label: "My Ledger" },
  { key: "availability", label: "Availability" },
  { key: "chat", label: "Chat" },
  { key: "treatments", label: "Treatments" },
  { key: "tips", label: "Tips & Notes" }
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

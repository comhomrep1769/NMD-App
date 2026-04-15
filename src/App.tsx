import React from "react";
import type { Client, Invoice, PageKey, Quote, ThemeMode } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import DashboardPage from "./pages/DashboardPage";
import ClientsPage from "./pages/ClientsPage";
import QuotesPage from "./pages/QuotesPage";
import InvoicesPage from "./pages/InvoicesPage";

const demoClients: Client[] = [
  {
    id: "c1",
    firstName: "John",
    lastName: "Smith",
    phone: "321-555-1111",
    email: "john@example.com",
    address: "123 Main St, Orlando, FL"
  },
  {
    id: "c2",
    firstName: "Sara",
    lastName: "Lopez",
    phone: "321-555-2222",
    email: "sara@example.com",
    address: "845 Orange Ave, Orlando, FL"
  }
];

const demoQuotes: Quote[] = [
  {
    id: "q1",
    quoteNumber: 1001,
    clientName: "John Smith",
    serviceType: "Driveway + Sidewalk",
    total: 185,
    status: "sent"
  },
  {
    id: "q2",
    quoteNumber: 1002,
    clientName: "Sara Lopez",
    serviceType: "House Siding",
    total: 325,
    status: "accepted"
  }
];

const demoInvoices: Invoice[] = [
  {
    id: "i1",
    invoiceNumber: 2001,
    clientName: "John Smith",
    jobName: "Driveway Cleaning",
    total: 185,
    status: "unpaid"
  },
  {
    id: "i2",
    invoiceNumber: 2002,
    clientName: "Sara Lopez",
    jobName: "House Wash",
    total: 325,
    status: "paid"
  }
];

export default function App() {
  const [page, setPage] = React.useState<PageKey>("dashboard");
  const [theme, setTheme] = React.useState<ThemeMode>(() => {
    const saved = localStorage.getItem("nmd-theme");
    return saved === "light" ? "light" : "dark";
  });

  const [clients] = React.useState<Client[]>(demoClients);
  const [quotes] = React.useState<Quote[]>(demoQuotes);
  const [invoices] = React.useState<Invoice[]>(demoInvoices);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nmd-theme", theme);
  }, [theme]);

  return (
    <div className="appShell">
      <Sidebar currentPage={page} onNavigate={setPage} />

      <div className="mainShell">
        <Header
          theme={theme}
          onToggleTheme={() =>
            setTheme((prev) => (prev === "dark" ? "light" : "dark"))
          }
        />

        <main className="pageWrap">
          {page === "dashboard" && (
            <DashboardPage quotes={quotes} invoices={invoices} />
          )}

          {page === "clients" && <ClientsPage clients={clients} />}

          {page === "quotes" && <QuotesPage quotes={quotes} />}

          {page === "invoices" && <InvoicesPage invoices={invoices} />}
        </main>

        <MobileNav currentPage={page} onNavigate={setPage} />
      </div>
    </div>
  );
}

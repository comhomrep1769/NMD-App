import React from "react";
import type { AuthUser, Client, Invoice, PageKey, Quote, ThemeMode } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import DashboardPage from "./pages/DashboardPage";
import ClientsPage from "./pages/ClientsPage";
import QuotesPage from "./pages/QuotesPage";
import InvoicesPage from "./pages/InvoicesPage";
import LoginPage from "./pages/LoginPage";
import MyLedgerPage from "./pages/MyLedgerPage";
import EmployeesPage from "./pages/EmployeesPage";
import SchedulePage from "./pages/SchedulePage";
import ChatPage from "./pages/ChatPage";
import { apiFetch } from "./api";

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

  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = React.useState(false);

  const [clients] = React.useState<Client[]>(demoClients);
  const [quotes] = React.useState<Quote[]>(demoQuotes);
  const [invoices] = React.useState<Invoice[]>(demoInvoices);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nmd-theme", theme);
  }, [theme]);

  React.useEffect(() => {
    const token = localStorage.getItem("nmd-token");
    if (!token) {
      setAuthChecked(true);
      return;
    }

    apiFetch<{ user: AuthUser }>("/api/auth/me")
      .then((data) => {
        setUser(data.user);
        if (data.user.role === "employee") {
          setPage("my-ledger");
        }
      })
      .catch(() => {
        localStorage.removeItem("nmd-token");
        setUser(null);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogin = (token: string, loggedInUser: AuthUser) => {
    localStorage.setItem("nmd-token", token);
    setUser(loggedInUser);
    setPage(loggedInUser.role === "admin" ? "dashboard" : "my-ledger");
  };

  const handleLogout = () => {
    localStorage.removeItem("nmd-token");
    setUser(null);
    setPage("dashboard");
  };

  if (!authChecked) {
    return <div className="loadingScreen">Loading...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="appShell">
      <Sidebar currentPage={page} onNavigate={setPage} role={user.role} />

      <div className="mainShell">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          user={user}
          onLogout={handleLogout}
        />

        <main className="pageWrap">
          {page === "dashboard" && (
            <DashboardPage quotes={quotes} invoices={invoices} />
          )}

        {page === "clients" && user.role === "admin" && (
  <ClientsPage />
)}

          {page === "quotes" && user.role === "admin" && (
            <QuotesPage />
          )}

          {page === "invoices" && user.role === "admin" && (
            <InvoicesPage invoices={invoices} />
          )}

          {page === "schedule" && (
            <SchedulePage role={user.role} />
          )}

          {page === "employees" && user.role === "admin" && (
            <EmployeesPage />
          )}

          {page === "chat" && (
            <ChatPage currentUser={user} />
          )}

          {page === "my-ledger" && user.role === "employee" && (
            <MyLedgerPage />
          )}
        </main>

        <MobileNav currentPage={page} onNavigate={setPage} role={user.role} />
      </div>
    </div>
  );
}

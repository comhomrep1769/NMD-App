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
import AvailabilityPage from "./pages/AvailabilityPage";
import TipsPage from "./pages/TipsPage";
import PayrollPage from "./pages/PayrollPage";
import { apiFetch } from "./api";

const demoClients: Client[] = [];
const demoQuotes: Quote[] = [];
const demoInvoices: Invoice[] = [];

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
            <InvoicesPage />
          )}

          {page === "schedule" && (
            <SchedulePage role={user.role} />
          )}

          {page === "employees" && user.role === "admin" && (
            <EmployeesPage />
          )}

          {page === "availability" && (
            <AvailabilityPage />
          )}

          {page === "chat" && (
            <ChatPage currentUser={user} />
          )}

          {page === "tips" && (
            <TipsPage role={user.role} />
          )}

          {page === "payroll" && user.role === "admin" && (
            <PayrollPage />
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

import React from "react";
import type { AuthUser, Client, Invoice, PageKey, Quote, ThemeMode } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeeDashboardPage from "./pages/EmployeeDashboardPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import ClientRegisterPage from "./pages/ClientRegisterPage";
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
import RequestsPage from "./pages/RequestsPage";
import ServiceRequestPage from "./pages/ServiceRequestPage";
import ExpensesPage from "./pages/ExpensesPage";
import MileagePage from "./pages/MileagePage";
import RecurringPage from "./pages/RecurringPage";
import TimeClockPage from "./pages/TimeClockPage";
import EquipmentPage from "./pages/EquipmentPage";
import TreatmentsPage from "./pages/TreatmentsPage";
import PricingPage from "./pages/PricingPage";
import { apiFetch } from "./api";

const demoClients: Client[] = [];
const demoQuotes: Quote[] = [];
const demoInvoices: Invoice[] = [];

export default function App() {
  const [page, setPage] = React.useState<PageKey>(() => {
    const path = window.location.pathname;
    if (path.includes("service-request")) return "service-request";
    return "dashboard";
  });

  const [authView, setAuthView] = React.useState<"landing" | "login" | "register">(() => {
    const path = window.location.pathname;
    if (path.includes("register")) return "register";
    if (path.includes("login")) return "login";
    return "landing";
  });

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
    if (page === "service-request") {
      setAuthChecked(true);
      return;
    }

    const token = localStorage.getItem("nmd-token");

    if (!token) {
      setAuthChecked(true);
      return;
    }

    apiFetch<{ user: AuthUser }>("/api/auth/me")
      .then((data) => {
        setUser(data.user);
        setPage("dashboard");
      })
      .catch(() => {
        localStorage.removeItem("nmd-token");
        setUser(null);
      })
      .finally(() => setAuthChecked(true));
  }, [page]);

  const handleLogin = (token: string, loggedInUser: AuthUser) => {
    localStorage.setItem("nmd-token", token);
    setUser(loggedInUser);
    setAuthView("landing");
    setPage("dashboard");
    window.history.pushState({}, "", "/");
  };

  const handleLogout = () => {
    localStorage.removeItem("nmd-token");
    setUser(null);
    setAuthView("landing");
    setPage("dashboard");
    window.history.pushState({}, "", "/");
  };

  const goToLogin = () => {
    setAuthView("login");
    window.history.pushState({}, "", "/login");
  };

  const goToRegister = () => {
    setAuthView("register");
    window.history.pushState({}, "", "/register");
  };

  const goToLanding = () => {
    setAuthView("landing");
    setPage("dashboard");
    window.history.pushState({}, "", "/");
  };

  const goToServiceRequest = () => {
    setPage("service-request");
    setAuthView("landing");
    window.history.pushState({}, "", "/service-request");
  };

  if (page === "service-request") {
    return <ServiceRequestPage />;
  }

  if (!authChecked) {
    return <div className="loadingScreen">Loading...</div>;
  }

  if (!user && authView === "login") {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (!user && authView === "register") {
    return (
      <ClientRegisterPage
        onRegistered={handleLogin}
        onBackToLogin={goToLogin}
      />
    );
  }

  if (!user) {
    return (
      <LandingPage
        onLogin={goToLogin}
        onCreateAccount={goToRegister}
        onRequestService={goToServiceRequest}
      />
    );
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
          {page === "dashboard" && user.role === "admin" && (
            <DashboardPage quotes={quotes} invoices={invoices} />
          )}

          {page === "dashboard" && user.role === "employee" && (
            <EmployeeDashboardPage />
          )}

          {page === "dashboard" && user.role === "client" && (
            <ClientDashboardPage />
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

          {page === "schedule" && user.role !== "client" && (
            <SchedulePage role={user.role} />
          )}

          {page === "employees" && user.role === "admin" && (
            <EmployeesPage />
          )}

          {page === "requests" && user.role === "admin" && (
            <RequestsPage />
          )}

          {page === "expenses" && user.role === "admin" && (
            <ExpensesPage />
          )}

          {page === "mileage" && user.role === "admin" && (
            <MileagePage />
          )}

          {page === "recurring" && user.role === "admin" && (
            <RecurringPage />
          )}

          {page === "equipment" && user.role === "admin" && (
            <EquipmentPage />
          )}

          {page === "treatments" && user.role !== "client" && (
            <TreatmentsPage role={user.role} />
          )}

          {page === "pricing" && user.role === "admin" && (
            <PricingPage />
          )}

          {page === "timeclock" && user.role !== "client" && (
            <TimeClockPage role={user.role} />
          )}

          {page === "availability" && user.role !== "client" && (
            <AvailabilityPage />
          )}

          {page === "chat" && (
            <ChatPage currentUser={user} />
          )}

          {page === "tips" && user.role !== "client" && (
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

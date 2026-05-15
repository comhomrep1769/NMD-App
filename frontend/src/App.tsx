import React from "react";
import type { AuthUser, Client, Invoice, PageKey, Quote, ThemeMode } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import AppUpdateBanner from "./components/AppUpdateBanner";
import GuruChat from "./components/GuruChat";
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
import EmailTestPage from "./pages/EmailTestPage";
import POSPage from "./pages/POSPage";
import GuruEstimatesPage from "./pages/GuruEstimatesPage";
import ClientEstimatesPage from "./pages/ClientEstimatesPage";
import ClientQuotesPage from "./pages/ClientQuotesPage";
import { apiFetch } from "./api";

const demoClients: Client[] = [];
const demoQuotes: Quote[] = [];
const demoInvoices: Invoice[] = [];

type PortalView = "public" | "admin" | "employee" | "register" | "service-request";

function getInitialPortal(): PortalView {
  const path = window.location.pathname.toLowerCase();

  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/employee")) return "employee";
  if (path.startsWith("/register")) return "register";
  if (path.startsWith("/service-request")) return "service-request";

  return "public";
}

function isAdminRole(user: AuthUser | null) {
  return user?.role === "admin" || user?.role === "superadmin";
}

export default function App() {
  const [portalView, setPortalView] = React.useState<PortalView>(getInitialPortal);
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
    const token =
      localStorage.getItem("nmd-token") ||
      sessionStorage.getItem("nmd-token");

    if (!token) {
      setAuthChecked(true);
      return;
    }

    apiFetch<{ user: AuthUser }>("/api/auth/me")
      .then((data) => {
        setUser(data.user);
        setPage("dashboard");

        if (data.user.role === "admin" || data.user.role === "superadmin") {
          setPortalView("admin");
          window.history.replaceState({}, "", "/admin");
        } else if (data.user.role === "employee") {
          setPortalView("employee");
          window.history.replaceState({}, "", "/employee");
        } else {
          setPortalView("public");
          window.history.replaceState({}, "", "/");
        }
      })
      .catch(() => {
        localStorage.removeItem("nmd-token");
        sessionStorage.removeItem("nmd-token");
        setUser(null);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const safeNavigate = (nextPage: PageKey) => {
    setPage(nextPage);
  };

  const handleLogin = (token: string, loggedInUser: AuthUser) => {
    localStorage.setItem("nmd-token", token);
    setUser(loggedInUser);
    setPage("dashboard");

    if (loggedInUser.role === "admin" || loggedInUser.role === "superadmin") {
      setPortalView("admin");
      window.history.pushState({}, "", "/admin");
    } else if (loggedInUser.role === "employee") {
      setPortalView("employee");
      window.history.pushState({}, "", "/employee");
    } else {
      setPortalView("public");
      window.history.pushState({}, "", "/");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("nmd-token");
    sessionStorage.removeItem("nmd-token");
    setUser(null);
    setPage("dashboard");

    if (portalView === "admin") {
      window.history.pushState({}, "", "/admin");
    } else if (portalView === "employee") {
      window.history.pushState({}, "", "/employee");
    } else {
      setPortalView("public");
      window.history.pushState({}, "", "/");
    }
  };

  const goPublic = () => {
    setPortalView("public");
    window.history.pushState({}, "", "/");
  };

  const goRegister = () => {
    setPortalView("register");
    window.history.pushState({}, "", "/register");
  };

  const goServiceRequest = () => {
    setPortalView("service-request");
    window.history.pushState({}, "", "/service-request");
  };

  if (!authChecked) {
    return (
      <>
        <AppUpdateBanner />
        <div className="loadingScreen">Loading...</div>
      </>
    );
  }

  if (!user && portalView === "service-request") {
    return (
      <>
        <AppUpdateBanner />
        <ServiceRequestPage />
        <GuruChat user={null} />
      </>
    );
  }

  if (!user && portalView === "register") {
    return (
      <>
        <AppUpdateBanner />
        <ClientRegisterPage
          onRegistered={handleLogin}
          onBackToLogin={goPublic}
        />
        <GuruChat user={null} />
      </>
    );
  }

  if (!user && portalView === "admin") {
    return (
      <>
        <AppUpdateBanner />
        <LoginPage
          onLogin={handleLogin}
          portalRole="admin"
          title="NMD Admin Portal"
          subtitle="Admin and Super Admin access only."
        />
      </>
    );
  }

  if (!user && portalView === "employee") {
    return (
      <>
        <AppUpdateBanner />
        <LoginPage
          onLogin={handleLogin}
          portalRole="employee"
          title="NMD Employee Portal"
          subtitle="Employee schedule, time clock, chat, and job tools."
        />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AppUpdateBanner />
        <LandingPage
          onClientLogin={handleLogin}
          onCreateAccount={goRegister}
          onRequestService={goServiceRequest}
        />
        <GuruChat user={null} />
      </>
    );
  }

  const adminAccess = isAdminRole(user);

  return (
    <>
      <AppUpdateBanner />

      <div className="appShell">
        <Sidebar currentPage={page} onNavigate={safeNavigate} role={user.role} />

        <div className="mainShell">
          <Header
            theme={theme}
            onToggleTheme={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
            user={user}
            onLogout={handleLogout}
          />

          <main className="pageWrap">
            {page === "dashboard" && adminAccess && (
              <DashboardPage
                quotes={quotes}
                invoices={invoices}
                onNavigate={safeNavigate}
                role={user.role}
              />
            )}

            {page === "dashboard" && user.role === "employee" && (
              <EmployeeDashboardPage onNavigate={safeNavigate} />
            )}

            {page === "dashboard" && user.role === "client" && (
              <ClientDashboardPage onNavigate={safeNavigate} />
            )}

            {page === "guru-estimates" && adminAccess && (
              <GuruEstimatesPage onNavigate={safeNavigate} />
            )}

            {page === "client-estimates" && user.role === "client" && (
              <ClientEstimatesPage />
            )}

            {page === "client-quotes" && user.role === "client" && (
              <ClientQuotesPage />
            )}

            {page === "clients" && adminAccess && <ClientsPage />}
            {page === "quotes" && adminAccess && <QuotesPage />}
            {page === "invoices" && adminAccess && <InvoicesPage />}

            {page === "schedule" && user.role !== "client" && (
              <SchedulePage role={user.role} />
            )}

            {page === "employees" && adminAccess && <EmployeesPage />}
            {page === "requests" && adminAccess && <RequestsPage />}
            {page === "expenses" && adminAccess && <ExpensesPage />}
            {page === "mileage" && adminAccess && <MileagePage />}
            {page === "recurring" && adminAccess && <RecurringPage />}
            {page === "equipment" && adminAccess && <EquipmentPage />}

            {page === "treatments" && user.role !== "client" && (
              <TreatmentsPage role={user.role} />
            )}

            {page === "pricing" && adminAccess && <PricingPage />}

            {page === "timeclock" && user.role !== "client" && (
              <TimeClockPage role={user.role} />
            )}

            {page === "email" && adminAccess && <EmailTestPage />}
            {page === "pos" && user.role !== "client" && <POSPage role={user.role} />}
            {page === "availability" && user.role !== "client" && <AvailabilityPage />}
            {page === "chat" && <ChatPage currentUser={user} />}

            {page === "tips" && user.role !== "client" && (
              <TipsPage role={user.role} />
            )}

            {page === "payroll" && adminAccess && <PayrollPage />}
            {page === "my-ledger" && user.role === "employee" && <MyLedgerPage />}
          </main>

          <MobileNav currentPage={page} onNavigate={safeNavigate} role={user.role} />
        </div>
      </div>

      <GuruChat user={user} onNavigate={safeNavigate} />
    </>
  );
}

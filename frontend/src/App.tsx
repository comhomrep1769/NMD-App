import React from "react";
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
import ClientEstimatesPage from "./pages/ClientEstimatesPage";
import ClientQuotesPage from "./pages/ClientQuotesPage";
import ClientRequestsPage from "./pages/ClientRequestsPage";
import ClientInvoicesPage from "./pages/ClientInvoicesPage";
import ClientAppointmentsPage from "./pages/ClientAppointmentsPage";
import ClientRecurringPage from "./pages/ClientRecurringPage";
import ClientPhotosPage from "./pages/ClientPhotosPage";
import ServiceRequestPage from "./pages/ServiceRequestPage";
import AvailabilityPage from "./pages/AvailabilityPage";

import ClientsPage from "./pages/ClientsPage";
import EmployeesPage from "./pages/EmployeesPage";
import RequestsPage from "./pages/RequestsPage";
import QuotesPage from "./pages/QuotesPage";
import InvoicesPage from "./pages/InvoicesPage";
import SchedulePage from "./pages/SchedulePage";
import RecurringPage from "./pages/RecurringPage";
import TreatmentsPage from "./pages/TreatmentsPage";
import JobPhotosPage from "./pages/JobPhotosPage";

import type { AuthUserRole } from "./types";

type AppUser = {
  id?: string;
  email?: string;
  displayName?: string;
  role: AuthUserRole | "superadmin" | "admin" | "employee" | "client";
};

function normalizeRole(role?: string): AuthUserRole | "superadmin" | "admin" | "employee" | "client" {
  const value = String(role || "").toLowerCase();

  if (value === "super_admin" || value === "super-admin" || value === "superadmin") {
    return "superadmin";
  }

  if (value === "admin") return "admin";
  if (value === "employee") return "employee";
  if (value === "client") return "client";

  return "admin";
}

function getStoredUser(): AppUser {
  try {
    const raw =
      localStorage.getItem("nmd_auth") ||
      localStorage.getItem("nmdAuth") ||
      localStorage.getItem("auth");

    if (raw) {
      const parsed = JSON.parse(raw);
      const user = parsed.user || parsed;

      return {
        id: user.id || parsed.id || "local-user",
        email: user.email || parsed.email || "admin@nmd.local",
        displayName: user.displayName || user.name || parsed.displayName || "NMD Admin",
        role: normalizeRole(user.role || parsed.role || "admin")
      };
    }
  } catch {
    // fall through to local default
  }

  return {
    id: "local-admin",
    email: "admin@nmd.local",
    displayName: "NMD Admin",
    role: "admin"
  };
}

function getPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function getHeaderCopy(path: string, role: string) {
  if (path.startsWith("/client")) {
    return {
      title: "NMD Client Portal",
      subtitle: "Requests, quotes, invoices, appointments, photos, and service updates"
    };
  }

  if (role === "employee") {
    return {
      title: "NMD Employee Portal",
      subtitle: "Assigned jobs, schedule, treatments, chat, and photo workflow"
    };
  }

  if (role === "superadmin") {
    return {
      title: "NMD Super Admin Portal",
      subtitle: "Full business operations, scheduling, clients, records, and Guru controls"
    };
  }

  return {
    title: "NMD Admin Portal",
    subtitle: "Operations, quotes, invoices, scheduling, treatments, photos, and clients"
  };
}

function getPageKey(path: string) {
  const clean = path.replace(/^\//, "").replace(/\//g, "-");

  if (!clean) return "landing";

  return clean;
}

function App() {
  const [path, setPath] = React.useState(getPath());
  const [user, setUser] = React.useState<AppUser>(() => getStoredUser());

  React.useEffect(() => {
    const handlePopState = () => setPath(getPath());

    window.addEventListener("popstate", handlePopState);

    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");

      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      if (anchor.target === "_blank") return;

      event.preventDefault();
      window.history.pushState({}, "", href);
      setPath(getPath());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    document.addEventListener("click", clickHandler);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", clickHandler);
    };
  }, []);

  const role = normalizeRole(user.role);
  const headerCopy = getHeaderCopy(path, role);
  const showPortalShell = path !== "/" && path !== "/login" && path !== "/client/register";

  const onLogout = () => {
    localStorage.removeItem("nmd_auth");
    localStorage.removeItem("nmdAuth");
    localStorage.removeItem("auth");
    setUser({
      id: "local-admin",
      email: "admin@nmd.local",
      displayName: "NMD Admin",
      role: "admin"
    });
    window.history.pushState({}, "", "/");
    setPath("/");
  };

  const renderPage = () => {
    if (path === "/" || path === "/home") return <LandingPage />;

    if (path === "/client/register") return <ClientRegisterPage />;

    if (path === "/client" || path === "/client/dashboard") return <ClientDashboardPage />;
    if (path === "/client/estimates") return <ClientEstimatesPage />;
    if (path === "/client/quotes") return <ClientQuotesPage />;
    if (path === "/client/requests") return <ClientRequestsPage />;
    if (path === "/client/invoices") return <ClientInvoicesPage />;
    if (path === "/client/appointments") return <ClientAppointmentsPage />;
    if (path === "/client/recurring") return <ClientRecurringPage />;
    if (path === "/client/photos") return <ClientPhotosPage />;
    if (path === "/client/request-service") return <ServiceRequestPage />;
    if (path === "/client/availability") return <AvailabilityPage />;

    if (path === "/employee" || path === "/employee/dashboard") {
      return <EmployeeDashboardPage />;
    }

    if (path === "/dashboard" || path === "/admin" || path === "/superadmin") {
      return role === "employee" ? <EmployeeDashboardPage /> : <DashboardPage role={role} />;
    }

    if (path === "/clients") return <ClientsPage />;
    if (path === "/employees") return <EmployeesPage />;
    if (path === "/requests") return <RequestsPage />;
    if (path === "/quotes") return <QuotesPage />;
    if (path === "/invoices") return <InvoicesPage />;
    if (path === "/schedule") return <SchedulePage role={role} />;
    if (path === "/availability") return <AvailabilityPage />;
    if (path === "/recurring") return <RecurringPage />;
    if (path === "/treatments") return <TreatmentsPage role={role as AuthUserRole} />;
    if (path === "/photos") return <JobPhotosPage role={role} />;

    if (path === "/chat") {
      return (
        <section className="panel">
          <h2 className="panelTitle">Chat</h2>
          <p className="brandSubtitle">
            Chat page shell is ready. Guru and role-based messages can connect here.
          </p>
          <div className="listCard">
            Use the floating Guru chat for now. Full app chat with images, timestamps,
            pinned company chat, and client/admin/employee permissions will connect in the chat phase.
          </div>
        </section>
      );
    }

    return (
      <section className="panel">
        <h2 className="panelTitle">Page Not Found</h2>
        <p className="brandSubtitle">The page you requested does not exist yet.</p>
        <div className="buttonRow" style={{ marginTop: 16 }}>
          <a className="primaryButton" href="/dashboard">
            Go to Dashboard
          </a>
          <a className="secondaryButton" href="/client">
            Go to Client Portal
          </a>
        </div>
      </section>
    );
  };

  if (!showPortalShell) {
    return (
      <>
        <AppUpdateBanner />
        <main className="publicShell">{renderPage()}</main>
        <GuruChat />
      </>
    );
  }

  return (
    <>
      <AppUpdateBanner />

      <div className="appShell">
        <Sidebar
          role={role}
          user={user}
          activePage={getPageKey(path)}
        />

        <div className="appMain">
          <Header
            title={headerCopy.title}
            subtitle={headerCopy.subtitle}
            role={role}
            user={user}
            onLogout={onLogout}
          />

          <div style={{ marginTop: 18 }}>{renderPage()}</div>
        </div>
      </div>

      <MobileNav role={role} activePage={getPageKey(path)} />
      <GuruChat />
    </>
  );
}

export default App;

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
import MileagePage from "./pages/MileagePage";

import type { AuthUserRole } from "./types";

type NormalizedRole = "superadmin" | "admin" | "employee" | "client";

type AppUser = {
  id?: string;
  email?: string;
  displayName?: string;
  role: NormalizedRole;
};

function normalizeRole(role?: string): NormalizedRole {
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
    // Use local default below.
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

function getHeaderCopy(path: string, role: NormalizedRole) {
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

function PlaceholderPage({
  eyebrow,
  title,
  subtitle,
  cards
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  cards: Array<{
    title: string;
    text: string;
  }>;
}) {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/dashboard">
              Dashboard
            </a>
            <a className="secondaryButton" href="/schedule">
              Schedule
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Build Ready</div>
          <div className="clientStatusTitle">Phase shell active</div>
          <p>
            This page is routed and ready for backend/database integration when this
            feature phase is expanded.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="cardsGrid">
          {cards.map((card) => (
            <article key={card.title} className="quoteCard">
              <div className="quoteNumber">{card.title}</div>
              <p className="cardLine">{card.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
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

      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#")
      ) {
        return;
      }

      if (anchor.target === "_blank") return;

      event.preventDefault();
      window.history.pushState({}, "", href);
      setPath(getPath());
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
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
    if (path === "/mileage") return <MileagePage />;

    if (path === "/pricing") {
      return (
        <PlaceholderPage
          eyebrow="NMD Job Pricing"
          title="Pricing reference, quote strategy, and service minimums."
          subtitle="Admin-only pricing references will support square-foot pricing, flat rates, subscription pricing, chemical/material cost references, labor/time estimates, and quote guidance."
          cards={[
            {
              title: "Pricing Reference",
              text: "Service categories, surface type, condition/severity, square-foot pricing, flat rates, and quote notes."
            },
            {
              title: "Rust / Specialty Work",
              text: "Specialty restoration pricing for rust, oxidation, wood, oil, and sensitive surface cases."
            },
            {
              title: "Guru Quote Support",
              text: "Guru will later retrieve pricing references to draft estimates and quote suggestions for admin approval."
            }
          ]}
        />
      );
    }

    if (path === "/expenses") {
      return (
        <PlaceholderPage
          eyebrow="Expenses"
          title="Business expenses, reimbursements, receipts, and bookkeeping."
          subtitle="Track receipt screenshots, camera photos, notes, categories, tools/equipment, fuel, food, mileage, reimbursements, and tax/accounting records."
          cards={[
            {
              title: "Receipt Uploads",
              text: "Expense records should support image uploads, notes, categories, and reason for purchase."
            },
            {
              title: "Employee Reimbursements",
              text: "Track gas, food, tools, equipment, mileage, and employee refund status."
            },
            {
              title: "Bookkeeping",
              text: "Expenses will connect to cash flow, invoices, profit/loss, and admin dashboard summaries."
            }
          ]}
        />
      );
    }

    if (path === "/payroll") {
      return (
        <PlaceholderPage
          eyebrow="Payroll"
          title="Wage balances, bonuses, and future Gusto Embedded payroll."
          subtitle="NMD payroll should minimize employee PII while Gusto handles banking, onboarding, and sensitive payroll information."
          cards={[
            {
              title: "Wage Balance",
              text: "Employee owed wage balance should connect to clock-in/out, paid lunch, breaks, pay rate, and approved hours."
            },
            {
              title: "Performance Bonus",
              text: "Weekly bonuses can be based on individual revenue generated, tiered percentages, and admin approval."
            },
            {
              title: "Gusto Embedded",
              text: "Future payroll integration should let Gusto handle banking and employee onboarding/PII."
            }
          ]}
        />
      );
    }

    if (path === "/chat") {
      return (
        <section className="panel">
          <h2 className="panelTitle">Chat</h2>
          <p className="brandSubtitle">
            Chat page shell is ready. Guru and role-based messages can connect here.
          </p>

          <div className="listCard">
            Use the floating Guru chat for now. Full app chat with images, timestamps,
            pinned company chat, and client/admin/employee permissions will connect in the
            chat phase.
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
        <Sidebar role={role} user={user} activePage={getPageKey(path)} />

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

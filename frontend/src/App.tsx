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

import type { AuthUser, AuthUserRole } from "./types";

type NormalizedRole = "superadmin" | "admin" | "employee" | "client";

type LocalAppUser = {
  id: string;
  email: string;
  displayName: string;
  name: string;
  role: NormalizedRole;
};

type PortalKind = "public" | "admin" | "superadmin" | "employee" | "client";

const AUTH_STORAGE_KEY = "nmd_auth";

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

function makeLocalUser(role: NormalizedRole, email?: string): LocalAppUser {
  const roleLabel =
    role === "superadmin"
      ? "Super Admin"
      : role === "admin"
        ? "Admin"
        : role === "employee"
          ? "Employee"
          : "Client";

  return {
    id: `${role}-local-user`,
    email: email || `${role}@nmd.local`,
    displayName: `NMD ${roleLabel}`,
    name: `NMD ${roleLabel}`,
    role
  };
}

function getStoredUser(): LocalAppUser | null {
  try {
    const raw =
      localStorage.getItem(AUTH_STORAGE_KEY) ||
      localStorage.getItem("nmdAuth") ||
      localStorage.getItem("auth");

    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const parsedUser = parsed.user || parsed;

    return {
      id: parsedUser.id || parsed.id || "local-user",
      email: parsedUser.email || parsed.email || "admin@nmd.local",
      displayName:
        parsedUser.displayName ||
        parsedUser.name ||
        parsed.displayName ||
        "NMD User",
      name: parsedUser.name || parsedUser.displayName || parsed.displayName || "NMD User",
      role: normalizeRole(parsedUser.role || parsed.role || "admin")
    };
  } catch {
    return null;
  }
}

function saveAuthUser(user: LocalAppUser, token = "local-dev-token") {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token,
      user
    })
  );

  localStorage.removeItem("nmdAuth");
  localStorage.removeItem("auth");
}

function clearAuthUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("nmdAuth");
  localStorage.removeItem("auth");
}

function getPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function getPortalKind(path: string): PortalKind {
  if (path.startsWith("/client")) return "client";
  if (path.startsWith("/employee")) return "employee";
  if (path.startsWith("/superadmin")) return "superadmin";
  if (path.startsWith("/admin")) return "admin";

  return "public";
}

function getRequiredRole(path: string): NormalizedRole | "adminOrSuperadmin" | null {
  if (path === "/" || path === "/home") return null;

  if (path === "/client/register") return null;
  if (path === "/client/request-service") return null;
  if (path === "/client/availability") return null;

  if (path.startsWith("/client")) return "client";
  if (path.startsWith("/employee")) return "employee";
  if (path.startsWith("/admin")) return "adminOrSuperadmin";
  if (path.startsWith("/superadmin")) return "superadmin";

  return null;
}

function roleCanAccess(user: LocalAppUser | null, requiredRole: ReturnType<typeof getRequiredRole>) {
  if (!requiredRole) return true;
  if (!user) return false;

  if (requiredRole === "adminOrSuperadmin") {
    return user.role === "admin" || user.role === "superadmin";
  }

  return user.role === requiredRole;
}

function roleForPath(path: string, user: LocalAppUser | null): NormalizedRole {
  if (path.startsWith("/client")) return "client";
  if (path.startsWith("/employee")) return "employee";
  if (path.startsWith("/superadmin")) return "superadmin";
  if (path.startsWith("/admin")) return "admin";

  return user?.role || "admin";
}

function getHeaderCopy(path: string, role: NormalizedRole) {
  if (path.startsWith("/client")) {
    return {
      title: "NMD Client Portal",
      subtitle: "Requests, quotes, invoices, appointments, photos, and service updates"
    };
  }

  if (path.startsWith("/employee") || role === "employee") {
    return {
      title: "NMD Employee Portal",
      subtitle: "Assigned jobs, schedule, treatments, chat, and photo workflow"
    };
  }

  if (path.startsWith("/superadmin") || role === "superadmin") {
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

function LoginPortalPage({
  portal,
  onLogin,
  onBackHome
}: {
  portal: PortalKind;
  onLogin: (role: NormalizedRole, email: string) => void;
  onBackHome: () => void;
}) {
  const defaultRole: NormalizedRole =
    portal === "client"
      ? "client"
      : portal === "employee"
        ? "employee"
        : portal === "superadmin"
          ? "superadmin"
          : "admin";

  const [email, setEmail] = React.useState(`${defaultRole}@nmd.local`);
  const [role, setRole] = React.useState<NormalizedRole>(defaultRole);

  const title =
    portal === "client"
      ? "Client Login"
      : portal === "employee"
        ? "Employee Login"
        : portal === "superadmin"
          ? "Super Admin Login"
          : "Admin Login";

  const subtitle =
    portal === "client"
      ? "Access quotes, invoices, appointments, photos, recurring services, and service requests."
      : portal === "employee"
        ? "Access assigned jobs, schedule, treatments, chat, and photo workflow."
        : "Access operations, clients, quotes, invoices, scheduling, treatments, photos, and Guru.";

  const allowedRoles: NormalizedRole[] =
    portal === "client"
      ? ["client"]
      : portal === "employee"
        ? ["employee"]
        : portal === "superadmin"
          ? ["superadmin"]
          : ["admin", "superadmin"];

  const submitLogin = (event: React.FormEvent) => {
    event.preventDefault();
    onLogin(role, email);
  };

  return (
    <main className="publicShell">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">{title}</span>
          <h1>Sign in to the correct NMD portal.</h1>
          <p>{subtitle}</p>

          <div className="clientHeroActions">
            <button className="secondaryButton" type="button" onClick={onBackHome}>
              Back Home
            </button>

            {portal === "client" && (
              <a className="secondaryButton" href="/client/register">
                Create Client Account
              </a>
            )}
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Portal Separation</div>
          <div className="clientStatusTitle">No role merging</div>
          <p>
            Client, Employee, Admin, and Super Admin sessions are separated by portal
            route and stored role.
          </p>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">{title}</h2>
            <p className="brandSubtitle">
              This restores login/logout flow while backend auth is connected.
            </p>
          </div>
        </div>

        <form className="formGrid" onSubmit={submitLogin} style={{ marginTop: 16 }}>
          <label className="fieldLabel">
            Email
            <input
              className="textInput"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@nmd.local"
            />
          </label>

          <label className="fieldLabel">
            Portal Role
            <select
              className="textInput"
              value={role}
              onChange={(event) => setRole(event.target.value as NormalizedRole)}
            >
              {allowedRoles.map((allowedRole) => (
                <option key={allowedRole} value={allowedRole}>
                  {allowedRole === "superadmin"
                    ? "Super Admin"
                    : allowedRole === "admin"
                      ? "Admin"
                      : allowedRole === "employee"
                        ? "Employee"
                        : "Client"}
                </option>
              ))}
            </select>
          </label>

          <div className="buttonRow">
            <button className="primaryButton" type="submit">
              Login
            </button>

            <button className="secondaryButton" type="button" onClick={onBackHome}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
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
  const [user, setUser] = React.useState<LocalAppUser | null>(() => getStoredUser());

  const navigateTo = React.useCallback((nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPath(getPath());
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, []);

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
      navigateTo(href);
    };

    document.addEventListener("click", clickHandler);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", clickHandler);
    };
  }, [navigateTo]);

  const portal = getPortalKind(path);
  const requiredRole = getRequiredRole(path);
  const visualRole = roleForPath(path, user);
  const canAccessCurrentPortal = roleCanAccess(user, requiredRole);
  const headerCopy = getHeaderCopy(path, visualRole);

  const handlePortalLogin = (role: NormalizedRole, email: string) => {
    const nextUser = makeLocalUser(role, email);

    saveAuthUser(nextUser);
    setUser(nextUser);

    if (role === "client") {
      navigateTo("/client");
      return;
    }

    if (role === "employee") {
      navigateTo("/employee");
      return;
    }

    if (role === "superadmin") {
      navigateTo("/superadmin");
      return;
    }

    navigateTo("/admin");
  };

  const handleClientRegistered = (token: string, registeredUser: AuthUser) => {
    const nextUser: LocalAppUser = {
      id: String(registeredUser.id || "client-local-user"),
      email: String(registeredUser.email || "client@nmd.local"),
      displayName: String(
        registeredUser.displayName || registeredUser.email || "NMD Client"
      ),
      name: String(registeredUser.displayName || registeredUser.email || "NMD Client"),
      role: "client"
    };

    saveAuthUser(nextUser, token);
    setUser(nextUser);
    navigateTo("/client");
  };

  const onLogout = () => {
    clearAuthUser();
    setUser(null);
    navigateTo("/");
  };

  const renderPage = () => {
    if (path === "/" || path === "/home") return <LandingPage />;

    if (path === "/login") {
      return (
        <LoginPortalPage
          portal="admin"
          onLogin={handlePortalLogin}
          onBackHome={() => navigateTo("/")}
        />
      );
    }

    if (path === "/admin" && !canAccessCurrentPortal) {
      return (
        <LoginPortalPage
          portal="admin"
          onLogin={handlePortalLogin}
          onBackHome={() => navigateTo("/")}
        />
      );
    }

    if (path === "/employee" && !canAccessCurrentPortal) {
      return (
        <LoginPortalPage
          portal="employee"
          onLogin={handlePortalLogin}
          onBackHome={() => navigateTo("/")}
        />
      );
    }

    if (path === "/superadmin" && !canAccessCurrentPortal) {
      return (
        <LoginPortalPage
          portal="superadmin"
          onLogin={handlePortalLogin}
          onBackHome={() => navigateTo("/")}
        />
      );
    }

    if (
      path === "/client" &&
      !canAccessCurrentPortal
    ) {
      return (
        <LoginPortalPage
          portal="client"
          onLogin={handlePortalLogin}
          onBackHome={() => navigateTo("/")}
        />
      );
    }

    if (path === "/client/register") {
      return (
        <ClientRegisterPage
          onRegistered={handleClientRegistered}
          onBackToLogin={() => navigateTo("/client")}
        />
      );
    }

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
      return visualRole === "employee" ? (
        <EmployeeDashboardPage />
      ) : (
        <DashboardPage role={visualRole} />
      );
    }

    if (path === "/clients") return <ClientsPage />;
    if (path === "/employees") return <EmployeesPage />;
    if (path === "/requests") return <RequestsPage />;
    if (path === "/quotes") return <QuotesPage />;
    if (path === "/invoices") return <InvoicesPage />;
    if (path === "/schedule") return <SchedulePage role={visualRole} />;
    if (path === "/availability") return <AvailabilityPage />;
    if (path === "/recurring") return <RecurringPage />;
    if (path === "/treatments") return <TreatmentsPage role={visualRole as AuthUserRole} />;
    if (path === "/photos") return <JobPhotosPage role={visualRole} />;
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
          <a className="primaryButton" href="/admin">
            Admin Login
          </a>
          <a className="secondaryButton" href="/employee">
            Employee Login
          </a>
          <a className="secondaryButton" href="/client">
            Client Login
          </a>
        </div>
      </section>
    );
  };

  const showPortalShell =
    path !== "/" &&
    path !== "/home" &&
    path !== "/login" &&
    path !== "/client/register" &&
    canAccessCurrentPortal;

  const shellUser = user || makeLocalUser(visualRole);
  const guruUser = (user || makeLocalUser(visualRole)) as unknown as AuthUser;

  if (!showPortalShell) {
    return (
      <>
        <AppUpdateBanner />
        {renderPage()}
        <GuruChat user={guruUser} />
      </>
    );
  }

  return (
    <>
      <AppUpdateBanner />

      <div className="appShell">
        <Sidebar role={visualRole} user={shellUser} activePage={getPageKey(path)} />

        <div className="appMain">
          <Header
            title={headerCopy.title}
            subtitle={headerCopy.subtitle}
            role={visualRole}
            user={shellUser}
            onLogout={onLogout}
          />

          <div style={{ marginTop: 18 }}>{renderPage()}</div>
        </div>
      </div>

      <MobileNav role={visualRole} activePage={getPageKey(path)} />
      <GuruChat user={guruUser} />
    </>
  );
}

export default App;

import React from "react";

type ClientPortalCard = {
  key: string;
  title: string;
  subtitle: string;
  value: string;
  status: string;
  href: string;
};

const clientPortalItems: ClientPortalCard[] = [
  {
    key: "recurring",
    title: "My Recurring Services",
    subtitle: "Manage repeat cleanings, subscription services, and upcoming recurring visits.",
    value: "0",
    status: "No active recurring services",
    href: "/client/recurring"
  },
  {
    key: "quotes",
    title: "My Quotes",
    subtitle: "Review quote drafts, approved quotes, and quote history.",
    value: "0",
    status: "No pending quotes",
    href: "/client/quotes"
  },
  {
    key: "requests",
    title: "My Service Requests",
    subtitle: "Track submitted service requests, estimate requests, and property photo submissions.",
    value: "0",
    status: "No open requests",
    href: "/client/requests"
  },
  {
    key: "invoices",
    title: "My Invoices",
    subtitle: "View invoices, payment status, and payment links.",
    value: "0",
    status: "No unpaid invoices",
    href: "/client/invoices"
  },
  {
    key: "appointments",
    title: "My Appointments",
    subtitle: "See scheduled service dates, arrival windows, and service status.",
    value: "0",
    status: "No upcoming appointments",
    href: "/client/appointments"
  }
];

const quickActions = [
  {
    title: "Request a Quote",
    text: "Send service details, preferred timing, and property photos for an estimate.",
    href: "/client/request-service",
    button: "Start Request"
  },
  {
    title: "Upload Property Photos",
    text: "Add pictures of surfaces, stains, access areas, or pre-existing damage.",
    href: "/client/request-service",
    button: "Add Photos"
  },
  {
    title: "Message NMD",
    text: "Ask questions, confirm details, or send updates directly through the app.",
    href: "/chat",
    button: "Open Chat"
  }
];

const serviceHighlights = [
  "House Washing",
  "Roof Cleaning",
  "Driveway & Sidewalk Cleaning",
  "Pool Cage & Enclosure Washing",
  "Paver Cleaning & Sealing",
  "Commercial Exterior Washing"
];

export default function ClientDashboardPage() {
  return (
    <div className="clientPortalPage">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">NMD Client Portal</span>
          <h1>Welcome to your No More Dirt service hub.</h1>
          <p>
            Request service, review quotes, track appointments, view invoices, and keep
            your before-and-after photos organized in one place.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/client/request-service">
              Request Quote
            </a>
            <a className="secondaryButton" href="/chat">
              Message NMD
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Service Status</div>
          <div className="clientStatusTitle">Ready for your next request</div>
          <p>
            Once a job is scheduled, this area will show safe status updates like on the
            way, ETA, arrived, and completed.
          </p>
        </div>
      </section>

      <section className="clientPortalLayout">
        <aside className="clientLeftRail">
          <div className="clientRailHeader">
            <div>
              <h2>My Portal</h2>
              <p>Quick access to your service records.</p>
            </div>
          </div>

          <nav className="clientRailNav" aria-label="Client portal navigation">
            {clientPortalItems.map((item) => (
              <a key={item.key} href={item.href} className="clientRailLink">
                <span className="clientRailText">
                  <strong>{item.title}</strong>
                  <small>{item.status}</small>
                </span>
                <span className="clientRailCount">{item.value}</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="clientMainArea">
          <div className="clientSectionHeader">
            <div>
              <h2>Client Dashboard</h2>
              <p>
                This client area is designed for customers, separate from the employee
                field portal.
              </p>
            </div>
          </div>

          <div className="clientMetricGrid">
            {clientPortalItems.map((item) => (
              <a key={item.key} href={item.href} className="clientMetricCard">
                <div className="statLabel">{item.title}</div>
                <div className="statValue">{item.value}</div>
                <p>{item.status}</p>
              </a>
            ))}
          </div>

          <div className="clientActionGrid">
            {quickActions.map((action) => (
              <article key={action.title} className="clientActionCard">
                <h3>{action.title}</h3>
                <p>{action.text}</p>
                <a className="secondaryButton" href={action.href}>
                  {action.button}
                </a>
              </article>
            ))}
          </div>

          <section className="clientInfoPanel">
            <div>
              <h2>Common Services</h2>
              <p>
                Browse common NMD services or request a custom estimate if your surface,
                stain, or property condition needs review.
              </p>
            </div>

            <div className="clientServicePills">
              {serviceHighlights.map((service) => (
                <span key={service} className="clientServicePill">
                  {service}
                </span>
              ))}
            </div>
          </section>

          <section className="clientInfoPanel clientPhotoPanel">
            <div>
              <h2>Photos & Property Notes</h2>
              <p>
                Upload property photos during service requests. Photos can help identify
                surfaces, stains, access issues, and pre-existing damage before service.
              </p>
            </div>

            <a className="primaryButton" href="/client/request-service">
              Upload Photos
            </a>
          </section>
        </main>
      </section>
    </div>
  );
}

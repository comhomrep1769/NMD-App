import React from "react";

const clientNavItems = [
  {
    title: "My Recurring Services",
    href: "/client/recurring",
    text: "Manage repeat service options."
  },
  {
    title: "My Quotes",
    href: "/client/quotes",
    text: "Review official NMD quotes."
  },
  {
    title: "My Service Requests",
    href: "/client/requests",
    text: "Track submitted requests."
  },
  {
    title: "My Invoices",
    href: "/client/invoices",
    text: "View payments and invoices."
  },
  {
    title: "My Appointments",
    href: "/client/appointments",
    text: "Track scheduled service."
  },
  {
    title: "My Photos",
    href: "/client/photos",
    text: "View property/job photos."
  }
];

export default function ClientPortalNav({
  activeHref = ""
}: {
  activeHref?: string;
}) {
  return (
    <aside className="clientLeftRail">
      <div className="clientRailHeader">
        <h2>My Portal</h2>
        <p>Quick access to your client records.</p>
      </div>

      <nav className="clientRailNav" aria-label="Client portal navigation">
        {clientNavItems.map((item) => {
          const active =
            activeHref === item.href ||
            (typeof window !== "undefined" && window.location.pathname === item.href);

          return (
            <a
              key={item.href}
              href={item.href}
              className={active ? "clientRailLink active" : "clientRailLink"}
            >
              <span className="clientRailText">
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </span>

              <span className="clientRailCount">›</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

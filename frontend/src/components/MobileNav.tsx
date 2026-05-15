import React from "react";
import type { AuthUserRole, PageKey } from "../types";

type MobileNavItem = {
  key: PageKey;
  label: string;
};

function getMobileItems(role: AuthUserRole): MobileNavItem[] {
  if (role === "admin") {
    return [
      { key: "dashboard", label: "Home" },
      { key: "guru-estimates", label: "Guru" },
      { key: "schedule", label: "Schedule" },
      { key: "quotes", label: "Quotes" },
      { key: "invoices", label: "Invoices" },
      { key: "clients", label: "Clients" },
      { key: "pos", label: "POS" },
      { key: "pricing", label: "Pricing" },
      { key: "treatments", label: "Treatments" },
      { key: "chat", label: "Chat" },
      { key: "employees", label: "Team" },
      { key: "expenses", label: "Expenses" },
      { key: "mileage", label: "Mileage" },
      { key: "recurring", label: "Recurring" }
    ];
  }

  if (role === "employee") {
    return [
      { key: "dashboard", label: "Home" },
      { key: "schedule", label: "Schedule" },
      { key: "timeclock", label: "Clock" },
      { key: "treatments", label: "Treatments" },
      { key: "tips", label: "Tips" },
      { key: "pos", label: "POS" },
      { key: "chat", label: "Chat" },
      { key: "availability", label: "Available" },
      { key: "my-ledger", label: "Ledger" }
    ];
  }

  return [
    { key: "dashboard", label: "Home" },
    { key: "client-estimates", label: "Estimates" },
    { key: "client-quotes", label: "Quotes" },
    { key: "chat", label: "Chat" }
  ];
}

export default function MobileNav({
  currentPage,
  onNavigate,
  role
}: {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  role: AuthUserRole;
}) {
  const items = getMobileItems(role);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;

    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 4);
  }, []);

  React.useEffect(() => {
    updateScrollState();

    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, items.length]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const activeButton = el.querySelector<HTMLButtonElement>(
      `[data-page-key="${currentPage}"]`
    );

    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
      });
    }

    window.setTimeout(updateScrollState, 150);
  }, [currentPage, updateScrollState]);

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({
      left: amount,
      behavior: "smooth"
    });
  };

  return (
    <nav className="mobileNavWrap" aria-label="Mobile navigation">
      {canScrollLeft && (
        <button
          type="button"
          className="mobileNavArrow mobileNavArrowLeft"
          onClick={() => scrollByAmount(-180)}
          aria-label="Scroll navigation left"
        >
          ‹
        </button>
      )}

      <div className="mobileNavScroll" ref={scrollRef}>
        {items.map((item) => {
          const active = currentPage === item.key;

          return (
            <button
              key={item.key}
              data-page-key={item.key}
              type="button"
              className={`mobileNavButton ${active ? "mobileNavButtonActive" : ""}`}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          className="mobileNavArrow mobileNavArrowRight"
          onClick={() => scrollByAmount(180)}
          aria-label="Scroll navigation right"
        >
          ›
        </button>
      )}
    </nav>
  );
}

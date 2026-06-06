"use client";

import { useEffect, useRef, useState } from "react";

export default function MissionPage() {
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    Object.entries(refs.current).forEach(([key, el]) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible((prev) => new Set([...prev, key]));
            obs.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const setRef = (key: string) => (el: HTMLElement | null) => {
    refs.current[key] = el;
  };

  const isVisible = (key: string) => visible.has(key);

  return (
    <main className="mission-root">
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-grid" />
          <div className="hero-orb orb-1" />
          <div className="hero-orb orb-2" />
        </div>
        <div className="container">
          <div
            ref={setRef("hero-badge")}
            className={`badge fade-up ${isVisible("hero-badge") ? "in" : ""}`}
          >
            <span className="badge-dot" />
            Who We Are
          </div>
          <h1
            ref={setRef("hero-h1")}
            className={`hero-title fade-up delay-1 ${isVisible("hero-h1") ? "in" : ""}`}
          >
            Built on
            <br />
            <em>Trust & Results</em>
          </h1>
          <p
            ref={setRef("hero-sub")}
            className={`hero-sub fade-up delay-2 ${isVisible("hero-sub") ? "in" : ""}`}
          >
            NMD Pressure Washing Services LLC — where every job is personal,
            every property matters, and every team member is valued.
          </p>
          <div
            ref={setRef("hero-divider")}
            className={`hero-divider fade-up delay-3 ${isVisible("hero-divider") ? "in" : ""}`}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ── COMPANY MISSION ── */}
      <section className="mission-section">
        <div className="container two-col">
          <div
            ref={setRef("company-label")}
            className={`col-label fade-left ${isVisible("company-label") ? "in" : ""}`}
          >
            <div className="label-line" />
            <span>Company Mission</span>
          </div>

          <div className="col-content">
            <h2
              ref={setRef("company-h2")}
              className={`section-title fade-up ${isVisible("company-h2") ? "in" : ""}`}
            >
              Restore. Protect. Revive.
            </h2>

            <div
              ref={setRef("company-card-1")}
              className={`mission-card primary-card fade-up delay-1 ${isVisible("company-card-1") ? "in" : ""}`}
            >
              <div className="card-accent" aria-hidden="true" />
              <p className="mission-text">
                At NMD Pressure Washing Services LLC, our mission is to{" "}
                <strong>restore, protect, and revive properties</strong> with
                professionalism, integrity, and attention to detail. We believe
                every client deserves honest communication, quality workmanship,
                fair pricing, and service performed with genuine care for their
                home or business.
              </p>
              <p className="mission-text">
                Our goal is not just to clean surfaces, but to{" "}
                <strong>build long-term trust</strong>, create lasting results,
                and continuously raise the standard for exterior restoration
                through discipline, innovation, and respect for both people and
                property.
              </p>
            </div>

            <div
              ref={setRef("company-card-2")}
              className={`mission-card secondary-card fade-up delay-2 ${isVisible("company-card-2") ? "in" : ""}`}
            >
              <div className="secondary-header">
                <span className="secondary-label">Leadership Standard</span>
              </div>
              <p className="mission-text">
                Our mission is to deliver{" "}
                <strong>high-quality exterior restoration services</strong> that
                improve the appearance, value, and longevity of every property
                we touch. We operate with honesty, accountability, precision,
                and respect — treating every customer's property as if it were
                our own.
              </p>
              <p className="mission-text">
                Through hard work, continuous learning, and a commitment to
                excellence, we aim to build a company known not only for
                exceptional results, but for the way we treat people, solve
                problems, and stand behind our work.
              </p>
            </div>

            {/* Value pillars */}
            <div
              ref={setRef("company-pillars")}
              className={`pillars fade-up delay-3 ${isVisible("company-pillars") ? "in" : ""}`}
            >
              {[
                { icon: "🤝", label: "Integrity" },
                { icon: "🎯", label: "Precision" },
                { icon: "💬", label: "Honesty" },
                { icon: "🏆", label: "Excellence" },
              ].map(({ icon, label }) => (
                <div key={label} className="pillar">
                  <span className="pillar-icon">{icon}</span>
                  <span className="pillar-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="section-divider" aria-hidden="true">
        <div className="divider-line" />
        <div className="divider-diamond" />
        <div className="divider-line" />
      </div>

      {/* ── EMPLOYEE MISSION ── */}
      <section className="employee-section">
        <div className="container two-col reverse">
          <div className="col-content">
            <h2
              ref={setRef("emp-h2")}
              className={`section-title fade-up ${isVisible("emp-h2") ? "in" : ""}`}
            >
              Our People Are Our Foundation
            </h2>

            <div
              ref={setRef("emp-card-1")}
              className={`mission-card emp-card fade-up delay-1 ${isVisible("emp-card-1") ? "in" : ""}`}
            >
              <div className="card-accent emp-accent" aria-hidden="true" />
              <p className="mission-text">
                At NMD Pressure Washing Services LLC, we believe{" "}
                <strong>great employees are the foundation</strong> of a great
                company. Our mission is to create an environment where team
                members are respected, properly trained, fairly rewarded, and
                given opportunities to grow both professionally and personally.
              </p>
              <p className="mission-text">
                We value accountability, teamwork, communication, reliability,
                and pride in workmanship. Every employee represents the company
                in the field, and we strive to build a culture where hard work,
                positive attitude, continuous improvement, and mutual respect
                are recognized and rewarded.
              </p>
            </div>

            <div
              ref={setRef("emp-card-2")}
              className={`mission-card emp-card-2 fade-up delay-2 ${isVisible("emp-card-2") ? "in" : ""}`}
            >
              <div className="secondary-header">
                <span className="secondary-label team-label">Team Vision</span>
              </div>
              <p className="mission-text">
                We are building more than a workforce —{" "}
                <strong>we are building a team of dependable professionals</strong>{" "}
                who take pride in their work and in how they treat others. Our
                mission is to create opportunities for growth, reward effort and
                performance, maintain a respectful and supportive work
                environment, and help every employee develop valuable skills
                that benefit them both inside and outside the company.
              </p>
              <p className="mission-text">
                Success at NMD Pressure Washing Services LLC comes from
                discipline, teamwork, integrity, and consistently showing up
                with the mindset to improve every day.{" "}
                <strong>
                  It's important for people to understand what this company
                  stands for — and for every employee to know how they will be
                  treated.
                </strong>
              </p>
            </div>

            {/* Culture pillars */}
            <div
              ref={setRef("emp-pillars")}
              className={`pillars fade-up delay-3 ${isVisible("emp-pillars") ? "in" : ""}`}
            >
              {[
                { icon: "💪", label: "Accountability" },
                { icon: "🌱", label: "Growth" },
                { icon: "🤜", label: "Teamwork" },
                { icon: "⭐", label: "Reward" },
              ].map(({ icon, label }) => (
                <div key={label} className="pillar emp-pillar">
                  <span className="pillar-icon">{icon}</span>
                  <span className="pillar-label">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={setRef("emp-label")}
            className={`col-label fade-right ${isVisible("emp-label") ? "in" : ""}`}
          >
            <div className="label-line" />
            <span>Employee Mission</span>
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="cta-section">
        <div
          ref={setRef("cta")}
          className={`container cta-inner fade-up ${isVisible("cta") ? "in" : ""}`}
        >
          <h2 className="cta-title">
            Ready to experience the NMD difference?
          </h2>
          <p className="cta-sub">
            Whether you're a homeowner, business owner, or looking to join our
            growing team — we'd love to hear from you.
          </p>
          <div className="cta-actions">
            <a href="/client/request-service" className="btn-primary">
              Request a Quote
            </a>
            <a href="/employee/login" className="btn-secondary">
              Join Our Team
            </a>
          </div>
        </div>
      </section>

      <style>{`
        /* ── RESET & BASE ── */
        .mission-root {
          font-family: 'DM Sans', sans-serif;
          background: #0a0f0d;
          color: #e8ede9;
          overflow-x: hidden;
        }

        .container {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ── ANIMATIONS ── */
        .fade-up {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .fade-up.in { opacity: 1; transform: translateY(0); }

        .fade-left {
          opacity: 0;
          transform: translateX(-32px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .fade-left.in { opacity: 1; transform: translateX(0); }

        .fade-right {
          opacity: 0;
          transform: translateX(32px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .fade-right.in { opacity: 1; transform: translateX(0); }

        .delay-1 { transition-delay: 0.1s; }
        .delay-2 { transition-delay: 0.22s; }
        .delay-3 { transition-delay: 0.34s; }

        /* ── HERO ── */
        .hero {
          position: relative;
          padding: 120px 0 100px;
          text-align: center;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(30,180,80,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,180,80,0.06) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent);
        }

        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(22,163,74,0.18), transparent 70%);
          top: -150px; left: 50%;
          transform: translateX(-50%);
        }
        .orb-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(14,116,144,0.12), transparent 70%);
          bottom: -100px; right: 10%;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(22,163,74,0.1);
          border: 1px solid rgba(22,163,74,0.25);
          color: #4ade80;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 100px;
          margin-bottom: 28px;
        }

        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(48px, 8vw, 88px);
          font-weight: 800;
          line-height: 1.05;
          color: #f0f7f1;
          margin: 0 0 24px;
          letter-spacing: -0.03em;
        }

        .hero-title em {
          font-style: normal;
          background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: clamp(16px, 2vw, 20px);
          color: #8fa895;
          max-width: 560px;
          margin: 0 auto 40px;
          line-height: 1.65;
        }

        .hero-divider {
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #16a34a, #0e7490);
          border-radius: 2px;
          margin: 0 auto;
        }

        /* ── TWO-COL LAYOUT ── */
        .two-col {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 64px;
          align-items: start;
          padding-top: 80px;
          padding-bottom: 80px;
        }

        .two-col.reverse {
          grid-template-columns: 1fr 160px;
        }

        .col-label {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          position: sticky;
          top: 80px;
        }

        .two-col.reverse .col-label {
          align-items: flex-end;
          text-align: right;
        }

        .label-line {
          width: 2px;
          height: 48px;
          background: linear-gradient(180deg, #16a34a, transparent);
        }

        .two-col.reverse .label-line {
          background: linear-gradient(180deg, #0e7490, transparent);
        }

        .col-label span {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #4ade80;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
        }

        .two-col.reverse .col-label span {
          color: #22d3ee;
          transform: none;
          writing-mode: vertical-rl;
        }

        /* ── SECTION TITLE ── */
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800;
          color: #f0f7f1;
          margin: 0 0 36px;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }

        /* ── MISSION CARDS ── */
        .mission-card {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 20px;
          overflow: hidden;
          transition: border-color 0.3s ease;
        }

        .mission-card:hover {
          border-color: rgba(22,163,74,0.25);
        }

        .card-accent {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 3px;
          background: linear-gradient(90deg, #16a34a, #0e7490, transparent);
        }

        .emp-accent {
          background: linear-gradient(90deg, #0e7490, #16a34a, transparent);
        }

        .secondary-header {
          margin-bottom: 16px;
        }

        .secondary-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #4ade80;
          background: rgba(22,163,74,0.1);
          border: 1px solid rgba(22,163,74,0.2);
          padding: 4px 10px;
          border-radius: 100px;
        }

        .team-label {
          color: #22d3ee;
          background: rgba(14,116,144,0.1);
          border-color: rgba(14,116,144,0.2);
        }

        .mission-text {
          font-size: 16px;
          line-height: 1.75;
          color: #b8c9bc;
          margin: 0 0 16px;
        }

        .mission-text:last-child { margin-bottom: 0; }

        .mission-text strong {
          color: #e8ede9;
          font-weight: 600;
        }

        /* ── PILLARS ── */
        .pillars {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 8px;
        }

        .pillar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 12px;
          background: rgba(22,163,74,0.06);
          border: 1px solid rgba(22,163,74,0.12);
          border-radius: 12px;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .pillar:hover {
          background: rgba(22,163,74,0.12);
          border-color: rgba(22,163,74,0.25);
        }

        .emp-pillar {
          background: rgba(14,116,144,0.06);
          border-color: rgba(14,116,144,0.12);
        }

        .emp-pillar:hover {
          background: rgba(14,116,144,0.12);
          border-color: rgba(14,116,144,0.25);
        }

        .pillar-icon { font-size: 22px; }

        .pillar-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8fa895;
        }

        /* ── DIVIDER ── */
        .section-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        }

        .divider-diamond {
          width: 8px; height: 8px;
          background: #16a34a;
          transform: rotate(45deg);
          flex-shrink: 0;
        }

        /* ── EMPLOYEE SECTION ── */
        .employee-section {
          background: rgba(14,116,144,0.04);
          border-top: 1px solid rgba(14,116,144,0.1);
          border-bottom: 1px solid rgba(14,116,144,0.1);
        }

        .emp-card:hover {
          border-color: rgba(14,116,144,0.25);
        }

        .emp-card-2:hover {
          border-color: rgba(14,116,144,0.25);
        }

        /* ── CTA ── */
        .cta-section {
          padding: 100px 0;
          text-align: center;
        }

        .cta-inner {
          background: linear-gradient(135deg, rgba(22,163,74,0.08), rgba(14,116,144,0.08));
          border: 1px solid rgba(22,163,74,0.15);
          border-radius: 24px;
          padding: 64px 48px;
        }

        .cta-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(26px, 4vw, 40px);
          font-weight: 800;
          color: #f0f7f1;
          margin: 0 0 16px;
          letter-spacing: -0.02em;
        }

        .cta-sub {
          font-size: 17px;
          color: #8fa895;
          max-width: 480px;
          margin: 0 auto 36px;
          line-height: 1.65;
        }

        .cta-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          padding: 14px 32px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          border-radius: 10px;
          text-decoration: none;
          transition: opacity 0.2s ease, transform 0.2s ease;
          letter-spacing: 0.01em;
        }

        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          padding: 14px 32px;
          background: transparent;
          color: #4ade80;
          font-weight: 700;
          font-size: 15px;
          border: 1px solid rgba(22,163,74,0.3);
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .btn-secondary:hover {
          background: rgba(22,163,74,0.08);
          border-color: rgba(22,163,74,0.5);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .two-col,
          .two-col.reverse {
            grid-template-columns: 1fr;
            gap: 32px;
            padding-top: 60px;
            padding-bottom: 60px;
          }

          .col-label {
            flex-direction: row;
            align-items: center;
            position: static;
          }

          .two-col.reverse .col-label {
            order: -1;
            align-items: center;
            text-align: left;
          }

          .col-label span {
            writing-mode: horizontal-tb;
            transform: none;
          }

          .two-col.reverse .col-label span {
            writing-mode: horizontal-tb;
          }

          .label-line {
            width: 32px;
            height: 2px;
            background: linear-gradient(90deg, #16a34a, transparent);
          }

          .pillars {
            grid-template-columns: repeat(2, 1fr);
          }

          .cta-inner {
            padding: 40px 24px;
          }

          .hero {
            padding: 80px 0 64px;
          }
        }
      `}</style>
    </main>
  );
}
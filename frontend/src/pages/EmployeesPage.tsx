import React from "react";
import LiveCalendarPanel from "../components/LiveCalendarPanel";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";

const employeeStats = [
  {
    title: "Employees",
    value: "0",
    text: "Team members and role-based users."
  },
  {
    title: "Scheduled Today",
    value: "0",
    text: "Employees assigned to jobs today."
  },
  {
    title: "Open Photo Tasks",
    value: "0",
    text: "Jobs needing before/after photo records."
  },
  {
    title: "Unread Chats",
    value: "0",
    text: "Employee/admin chat notifications."
  }
];

const employeeCards = [
  {
    title: "Employee Pay Rates",
    text: "Admin/Super Admin should be able to view and update employee hourly pay rates without direct database access."
  },
  {
    title: "Owed Wage Balance",
    text: "Wage balances should connect to clock-in/out, paid lunch, breaks, job hours, and admin review."
  },
  {
    title: "Date Joined Team",
    text: "Date joined should be manually input, admin-editable, and protected from accidental deletion."
  },
  {
    title: "Quick Chat",
    text: "Each employee card should include a quick-chat button routed to the chat page."
  },
  {
    title: "Job Board",
    text: "Employees can claim available jobs after confirmation and conflict checks."
  },
  {
    title: "Performance",
    text: "Track completed jobs, revenue generated, hours, punctuality, bonuses, and quality notes."
  }
];

export default function EmployeesPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Employee Management</span>
          <h1>Team scheduling, pay details, performance, and job photo workflow.</h1>
          <p>
            Manage employees, schedules, pay rates, job assignments, photo requirements,
            reimbursements, and communication from the admin portal.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/schedule">
              Open Schedule
            </a>
            <a className="secondaryButton" href="/photos">
              Job Photos
            </a>
            <a className="secondaryButton" href="/chat">
              Open Chat
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Admin Control</div>
          <div className="clientStatusTitle">Pay, schedule, chat</div>
          <p>
            Employee records should stay role-protected while giving admins fast access
            to scheduling, pay rates, performance, and communication.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {employeeStats.map((stat) => (
            <div key={stat.title} className="statCard">
              <div className="statLabel">{stat.title}</div>
              <div className="statValue">{stat.value}</div>
              <p className="cardLine">{stat.text}</p>
            </div>
          ))}
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {employeeCards.map((card) => (
            <article key={card.title} className="quoteCard">
              <div className="quoteNumber">{card.title}</div>
              <p className="cardLine">{card.text}</p>

              <div className="buttonRow" style={{ marginTop: 12 }}>
                <a className="secondaryButton" href="/chat">
                  Quick Chat
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="listCard">
          Employee database integration will connect employee profiles, pay rates, date
          joined, job assignments, clock records, reimbursements, and performance metrics.
        </div>
      </section>

      <LiveCalendarPanel role="admin" currentEmployeeName="NMD Team Member" />

      <PhotoGalleryPanel
        role="admin"
        title="Employee Job Photo Review"
        subtitle="Review photo records uploaded by employees for assigned jobs, before/after proof, and damage notes."
      />
    </div>
  );
}

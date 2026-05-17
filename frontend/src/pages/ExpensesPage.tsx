import React from "react";
import PhotoUploadPanel from "../components/PhotoUploadPanel";
import PhotoGalleryPanel from "../components/PhotoGalleryPanel";

const expenseStats = [
  {
    title: "Pending Review",
    value: "$0",
    text: "Employee reimbursements or business expenses waiting for admin approval."
  },
  {
    title: "Approved",
    value: "$0",
    text: "Approved expenses and reimbursements."
  },
  {
    title: "Fuel / Gas",
    value: "$0",
    text: "Employee fuel reimbursement category."
  },
  {
    title: "Tools / Equipment",
    value: "$0",
    text: "Business tools, parts, supplies, and equipment purchases."
  }
];

const expenseCategories = [
  "Employee Fuel Reimbursement",
  "Employee Food Reimbursement",
  "Tools / Equipment",
  "Chemicals",
  "Vehicle / Trailer",
  "Marketing",
  "Personal Business Expense",
  "Other"
];

export default function ExpensesPage() {
  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Expenses</span>
          <h1>Track business expenses and employee reimbursements.</h1>
          <p>
            Upload receipt photos, categorize purchases, record notes/reasons, and track
            employee refunds or reimbursements for cleaner bookkeeping and tax records.
          </p>

          <div className="clientHeroActions">
            <a className="primaryButton" href="/mileage">
              Mileage
            </a>
            <a className="secondaryButton" href="/invoices">
              Invoices
            </a>
            <a className="secondaryButton" href="/photos">
              Receipt Photos
            </a>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Receipt Proof</div>
          <div className="clientStatusTitle">Photo required later</div>
          <p>
            Expense entries should support receipt screenshots, camera photos, notes,
            categories, and admin approval status.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="statsGrid">
          {expenseStats.map((stat) => (
            <div key={stat.title} className="statCard">
              <div className="statLabel">{stat.title}</div>
              <div className="statValue">{stat.value}</div>
              <p className="cardLine">{stat.text}</p>
            </div>
          ))}
        </div>

        <div className="cardsGrid" style={{ marginTop: 16 }}>
          {expenseCategories.map((category) => (
            <article key={category} className="quoteCard">
              <div className="quoteNumber">{category}</div>
              <p className="cardLine">
                Expense records in this category will appear here once backend storage
                and approval workflow are connected.
              </p>
            </article>
          ))}
        </div>

        <div className="listCard">
          Future expense backend should include amount, category, date, employee, receipt
          image, notes, reimbursement status, admin approval, and bookkeeping export.
        </div>
      </section>

      <PhotoUploadPanel
        role="admin"
        uploadedByName="Admin"
        defaultCategory="cash_payment_proof"
        title="Upload Receipt / Expense Proof"
        subtitle="Upload receipt screenshots or camera photos for expenses, reimbursements, fuel, tools, chemicals, and business purchases."
      />

      <PhotoGalleryPanel
        role="admin"
        title="Expense / Receipt Photo Records"
        subtitle="Review uploaded receipt images, cash/payment proof, and expense documentation."
      />
    </div>
  );
}

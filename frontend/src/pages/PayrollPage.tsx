import React from "react";
import { apiFetch } from "../api";

type EmployeePOSSummary = {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  totalRecords: number;
  approvedCollectedTotal: number;
  approvedSubtotalTotal: number;
  approvedSalesTaxTotal: number;
  pendingCashTotal: number;
  pendingCashCount: number;
  approvedCashTotal: number;
  approvedCashCount: number;
  rejectedCashCount: number;
  cardCollectedTotal: number;
};

export default function PayrollPage() {
  const [employees, setEmployees] = React.useState<EmployeePOSSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadData = React.useCallback(async () => {
    setError("");

    try {
      const data = await apiFetch<{ employees: EmployeePOSSummary[] }>(
        "/api/ledger/employee-pos-summary"
      );

      setEmployees(data.employees);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payroll POS summary");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const totalCollected = employees.reduce(
    (sum, employee) => sum + employee.approvedCollectedTotal,
    0
  );

  const totalSubtotal = employees.reduce(
    (sum, employee) => sum + employee.approvedSubtotalTotal,
    0
  );

  const totalSalesTax = employees.reduce(
    (sum, employee) => sum + employee.approvedSalesTaxTotal,
    0
  );

  const totalPendingCash = employees.reduce(
    (sum, employee) => sum + employee.pendingCashTotal,
    0
  );

  const totalCard = employees.reduce(
    (sum, employee) => sum + employee.cardCollectedTotal,
    0
  );

  const totalCash = employees.reduce(
    (sum, employee) => sum + employee.approvedCashTotal,
    0
  );

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Payroll Prep</h2>
        <div className="listCard">Loading payroll prep...</div>
      </section>
    );
  }

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Payroll Prep</h2>
            <p className="brandSubtitle">
              Review employee collected totals, approved cash, card totals, sales tax, and pending cash before payroll.
            </p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Approved POS Collected</div>
            <div className="statValue">${totalCollected.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Approved Subtotal</div>
            <div className="statValue">${totalSubtotal.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Sales Tax Tracked</div>
            <div className="statValue">${totalSalesTax.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Card Collected</div>
            <div className="statValue">${totalCard.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Approved Cash</div>
            <div className="statValue">${totalCash.toFixed(2)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Pending Cash</div>
            <div className="statValue">${totalPendingCash.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Employee POS Collection Summary</h2>

        <div className="cardsGrid">
          {employees.map((employee) => (
            <div key={employee.employeeId} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{employee.employeeName}</div>
                {employee.pendingCashCount > 0 && (
                  <span className="statusBadge status-pending_admin_approval">
                    {employee.pendingCashCount} pending
                  </span>
                )}
              </div>

              <div className="cardLine">
                <strong>Email:</strong> {employee.employeeEmail}
              </div>

              <div className="cardLine">
                <strong>Total Records:</strong> {employee.totalRecords}
              </div>

              <div className="cardLine">
                <strong>Approved Collected:</strong> ${employee.approvedCollectedTotal.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Approved Subtotal:</strong> ${employee.approvedSubtotalTotal.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Sales Tax:</strong> ${employee.approvedSalesTaxTotal.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Card Collected:</strong> ${employee.cardCollectedTotal.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Approved Cash:</strong> ${employee.approvedCashTotal.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Approved Cash Count:</strong> {employee.approvedCashCount}
              </div>

              <div className="cardLine">
                <strong>Pending Cash:</strong> ${employee.pendingCashTotal.toFixed(2)}
              </div>

              <div className="cardLine">
                <strong>Rejected Cash Records:</strong> {employee.rejectedCashCount}
              </div>
            </div>
          ))}

          {employees.length === 0 && (
            <div className="listCard">No employee POS collection records yet.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Payroll Notes</h2>

        <div className="cardsGrid">
          <div className="quoteCard">
            <div className="quoteNumber">Collected Totals</div>
            <div className="cardLine">
              These totals show what each employee collected or submitted through POS records. They are not payroll wages by themselves.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Sales Tax</div>
            <div className="cardLine">
              Sales tax is separated so it does not get confused with company income or employee-generated subtotal.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Cash Approval</div>
            <div className="cardLine">
              Pending cash should be approved or rejected before payroll review so records are clean.
            </div>
          </div>

          <div className="quoteCard">
            <div className="quoteNumber">Future Payroll</div>
            <div className="cardLine">
              Later this page can combine time clock hours, wage rates, bonuses, reimbursements, and employee revenue generation.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

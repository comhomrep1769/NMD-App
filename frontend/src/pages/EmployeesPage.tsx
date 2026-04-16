import React from "react";
import { apiFetch } from "../api";
import type { Employee } from "../types";

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    apiFetch<{ employees: Employee[] }>("/api/employees")
      .then((data) => setEmployees(data.employees))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load employees"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2 className="panelTitle">Employees</h2>
      </div>

      {loading && <div className="listCard">Loading employees...</div>}
      {error && <div className="errorBox">{error}</div>}

      {!loading && !error && (
        <div className="responsiveTableWrap">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.displayName}</td>
                  <td>{employee.email}</td>
                  <td>{employee.role}</td>
                  <td>{new Date(employee.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

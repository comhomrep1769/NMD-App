import React from "react";
import { apiFetch } from "../api";
import type {
  Employee,
  MileageLog,
  MileageStatus
} from "../types";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read image."));
      }
    };

    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

export default function MileagePage() {
  const [logs, setLogs] = React.useState<MileageLog[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [error, setError] = React.useState("");

  const [employeeId, setEmployeeId] = React.useState("");
  const [tripDate, setTripDate] = React.useState(
    new Date().toISOString().slice(0,10)
  );
  const [startLocation, setStartLocation] = React.useState("");
  const [endLocation, setEndLocation] = React.useState("");
  const [milesDriven, setMilesDriven] = React.useState("");
  const [reimbursementRate, setReimbursementRate] =
    React.useState("0.60");

  const [purpose, setPurpose] = React.useState("");
  const [photo, setPhoto] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const [mileageData, employeeData] = await Promise.all([
        apiFetch<{ mileageLogs: MileageLog[] }>("/api/mileage"),
        apiFetch<{ employees: Employee[] }>("/api/employees")
      ]);

      setLogs(mileageData.mileageLogs);
      setEmployees(employeeData.employees);
    } catch (err) {
      setError("Failed to load mileage");
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePhoto = async (file?: File) => {
    if (!file) {
      setPhoto(null);
      return;
    }

    try {
      const data = await fileToDataUrl(file);
      setPhoto(data);
    } catch {
      setError("Failed to upload odometer photo");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiFetch("/api/mileage", {
        method: "POST",
        body: JSON.stringify({
          employeeId,
          tripDate,
          startLocation,
          endLocation,
          milesDriven,
          reimbursementRate,
          purpose,
          odometerPhotoDataUrl: photo
        })
      });

      setStartLocation("");
      setEndLocation("");
      setMilesDriven("");
      setPurpose("");
      setPhoto(null);

      loadData();
    } catch {
      setError("Failed to save mileage log");
    }
  };

  const updateStatus = async (
    id: string,
    status: MileageStatus
  ) => {
    try {
      await apiFetch(`/api/mileage/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      loadData();
    } catch {
      setError("Failed updating mileage");
    }
  };

  const deleteLog = async (id: string) => {
    if (!window.confirm("Delete mileage log?")) return;

    await apiFetch(`/api/mileage/${id}`, {
      method: "DELETE"
    });

    loadData();
  };

  const totalMileage = logs.reduce(
    (sum, log) => sum + log.milesDriven,
    0
  );

  const totalReimbursements = logs.reduce(
    (sum, log) => sum + log.reimbursementTotal,
    0
  );

  return (
    <div className="pageGrid">
      <section className="panel">
        <h2 className="panelTitle">
          Mileage Reimbursement
        </h2>

        {error && <div className="errorBox">{error}</div>}

        <form className="formGrid" onSubmit={submit}>
          <select
            className="textInput"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">
              Select employee
            </option>

            {employees.map((employee) => (
              <option
                key={employee.id}
                value={employee.id}
              >
                {employee.displayName}
              </option>
            ))}
          </select>

          <input
            className="textInput"
            type="date"
            value={tripDate}
            onChange={(e) =>
              setTripDate(e.target.value)
            }
          />

          <input
            className="textInput"
            placeholder="Start location"
            value={startLocation}
            onChange={(e) =>
              setStartLocation(e.target.value)
            }
          />

          <input
            className="textInput"
            placeholder="End location"
            value={endLocation}
            onChange={(e) =>
              setEndLocation(e.target.value)
            }
          />

          <input
            className="textInput"
            placeholder="Miles driven"
            value={milesDriven}
            onChange={(e) =>
              setMilesDriven(e.target.value)
            }
          />

          <input
            className="textInput"
            placeholder="Rate per mile"
            value={reimbursementRate}
            onChange={(e) =>
              setReimbursementRate(
                e.target.value
              )
            }
          />

          <textarea
            className="textInput"
            rows={4}
            placeholder="Trip purpose"
            value={purpose}
            onChange={(e) =>
              setPurpose(e.target.value)
            }
          />

          <input
            className="textInput"
            type="file"
            accept="image/*"
            onChange={(e) =>
              handlePhoto(
                e.target.files?.[0]
              )
            }
          />

          {photo && (
            <img
              src={photo}
              alt="Odometer"
              style={{
                width: "100%",
                maxHeight: 250,
                objectFit: "cover",
                borderRadius: "12px"
              }}
            />
          )}

          <button
            className="primaryButton"
            type="submit"
          >
            Save Mileage Log
          </button>
        </form>
      </section>

      <section className="panel">
        <h2 className="panelTitle">
          Mileage History
        </h2>

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">
              Total Miles
            </div>
            <div className="statValue">
              {totalMileage.toFixed(2)}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">
              Total Reimbursements
            </div>
            <div className="statValue">
              $
              {totalReimbursements.toFixed(
                2
              )}
            </div>
          </div>
        </div>

        <div className="cardsGrid">
          {logs.map((log) => (
            <div
              key={log.id}
              className="quoteCard"
            >
              <div className="quoteNumber">
                {log.employeeName}
              </div>

              <div className="cardLine">
                {log.startLocation} →{" "}
                {log.endLocation}
              </div>

              <div className="cardLine">
                Miles: {log.milesDriven}
              </div>

              <div className="cardLine">
                Rate: $
                {log.reimbursementRate}
              </div>

              <div className="cardLine">
                Total: $
                {log.reimbursementTotal.toFixed(
                  2
                )}
              </div>

              <div className="cardLine">
                Purpose: {log.purpose}
              </div>

              {log.odometerPhotoDataUrl && (
                <img
                  src={
                    log.odometerPhotoDataUrl
                  }
                  alt="odometer"
                  style={{
                    width: "100%",
                    maxHeight: 220,
                    objectFit: "cover",
                    borderRadius: "12px"
                  }}
                />
              )}

              <div className="buttonRow">
                <button
                  className="secondaryButton"
                  onClick={() =>
                    updateStatus(
                      log.id,
                      "approved"
                    )
                  }
                >
                  Approve
                </button>

                <button
                  className="secondaryButton"
                  onClick={() =>
                    updateStatus(
                      log.id,
                      "reimbursed"
                    )
                  }
                >
                  Mark Paid
                </button>

                <button
                  className="secondaryButton"
                  onClick={() =>
                    deleteLog(log.id)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

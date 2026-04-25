import React from "react";
import { apiFetch } from "../api";

type Availability = {
  id: string;
  user_id: string;
  display_name?: string;
  start_time: string;
  end_time: string;
  reason?: string;
};

export default function AvailabilityPage() {
  const [entries, setEntries] = React.useState<Availability[]>([]);
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");

  const load = async () => {
    try {
      const data = await apiFetch<{ availability: Availability[] }>("/api/availability");
      setEntries(data.availability);
    } catch (err) {
      setError("Failed to load availability");
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiFetch("/api/availability", {
        method: "POST",
        body: JSON.stringify({ startTime, endTime, reason })
      });

      setStartTime("");
      setEndTime("");
      setReason("");
      await load();
    } catch {
      setError("Failed to save");
    }
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/availability/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="pageGrid">
      <section className="panel">
        <h2 className="panelTitle">Set Unavailability</h2>

        {error && <div className="errorBox">{error}</div>}

        <form className="formGrid" onSubmit={submit}>
          <input
            type="datetime-local"
            className="textInput"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <input
            type="datetime-local"
            className="textInput"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Reason optional"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <button className="primaryButton">Save</button>
        </form>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Availability</h2>

        <div className="cardsGrid">
          {entries.map((e) => (
            <div key={e.id} className="quoteCard">
              <div className="cardLine">
                <strong>User:</strong> {e.display_name || "You"}
              </div>

              <div className="cardLine">
                <strong>From:</strong> {new Date(e.start_time).toLocaleString()}
              </div>

              <div className="cardLine">
                <strong>To:</strong> {new Date(e.end_time).toLocaleString()}
              </div>

              <div className="cardLine">
                <strong>Reason:</strong> {e.reason || "—"}
              </div>

              <button className="secondaryButton" onClick={() => remove(e.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

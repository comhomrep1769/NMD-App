import React from "react";
import { apiFetch } from "../api";
import type { BreakLog, BreakType, Role, TimeSession } from "../types";

function minutesToHours(minutes: number) {
  return (minutes / 60).toFixed(2);
}

function breakLabel(type: BreakType) {
  if (type === "break_15_1") return "15 Minute Break #1";
  if (type === "break_15_2") return "15 Minute Break #2";
  if (type === "lunch_30") return "30 Minute Paid Lunch";
  return "1 Hour Break";
}

function getRemainingSeconds(activeBreak: BreakLog | undefined) {
  if (!activeBreak) return 0;

  const started = new Date(activeBreak.startedAt).getTime();
  const end = started + activeBreak.allowedMinutes * 60 * 1000;
  const remaining = Math.max(Math.floor((end - Date.now()) / 1000), 0);

  return remaining;
}

export default function TimeClockPage({ role }: { role: Role }) {
  const [activeSession, setActiveSession] = React.useState<TimeSession | null>(null);
  const [breaks, setBreaks] = React.useState<BreakLog[]>([]);
  const [history, setHistory] = React.useState<TimeSession[]>([]);
  const [adminSessions, setAdminSessions] = React.useState<TimeSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [remainingSeconds, setRemainingSeconds] = React.useState(0);
  const [alarmShown, setAlarmShown] = React.useState(false);

  const activeBreak = breaks.find((item) => item.status === "active");
  const usedTypes = breaks.map((item) => item.breakType);
  const oneHourUsed = usedTypes.includes("break_60");

  const loadData = React.useCallback(async () => {
    setError("");

    try {
      const [meData, historyData, adminData] = await Promise.all([
        apiFetch<{ activeSession: TimeSession | null; breaks: BreakLog[] }>("/api/timeclock/me"),
        apiFetch<{ sessions: TimeSession[] }>("/api/timeclock/my-history"),
        role === "admin"
          ? apiFetch<{ sessions: TimeSession[] }>("/api/timeclock/admin/sessions")
          : Promise.resolve({ sessions: [] as TimeSession[] })
      ]);

      setActiveSession(meData.activeSession);
      setBreaks(meData.breaks);
      setHistory(historyData.sessions);
      setAdminSessions(adminData.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load time clock");
    } finally {
      setLoading(false);
    }
  }, [role]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(activeBreak));

      if (activeBreak) {
        const started = new Date(activeBreak.startedAt).getTime();
        const alarmAt = started + activeBreak.allowedMinutes * 60 * 1000;
        const now = Date.now();

        if (now >= alarmAt && !alarmShown) {
          setAlarmShown(true);

          try {
            new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play();
          } catch {
            // browser may block audio until user interaction
          }

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Break time is over", {
              body: "Please clock back in. After 1 minute, extra time works against paid hours."
            });
          } else {
            alert("Break time is over. Please clock back in.");
          }
        }
      } else {
        setAlarmShown(false);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeBreak, alarmShown]);

  const clockIn = async () => {
    try {
      await apiFetch("/api/timeclock/clock-in", { method: "POST" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clock in");
    }
  };

  const clockOut = async () => {
    try {
      await apiFetch("/api/timeclock/clock-out", { method: "POST" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clock out");
    }
  };

  const startBreak = async (breakType: BreakType) => {
    try {
      await apiFetch("/api/timeclock/break/start", {
        method: "POST",
        body: JSON.stringify({ breakType })
      });

      setAlarmShown(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start break");
    }
  };

  const endBreak = async () => {
    try {
      await apiFetch("/api/timeclock/break/end", { method: "POST" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end break");
    }
  };

  const isDisabled = (type: BreakType) => {
    if (!activeSession) return true;
    if (activeBreak) return true;
    if (oneHourUsed) return true;
    if (usedTypes.includes(type)) return true;
    if (type === "break_60" && usedTypes.length > 0) return true;
    return false;
  };

  const activeBreakOvertimeSeconds = activeBreak
    ? Math.max(
        Math.floor(
          (Date.now() -
            new Date(activeBreak.startedAt).getTime() -
            activeBreak.allowedMinutes * 60 * 1000 -
            60 * 1000) /
            1000
        ),
        0
      )
    : 0;

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Time Clock</h2>
        <div className="listCard">Loading time clock...</div>
      </section>
    );
  }

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">My Time Clock</h2>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Status</div>
            <div className="statValue">
              {activeSession ? "Clocked In" : "Clocked Out"}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">Active Break</div>
            <div className="statValue">
              {activeBreak ? breakLabel(activeBreak.breakType) : "None"}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">Break Timer</div>
            <div className="statValue">
              {activeBreak
                ? `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`
                : "—"}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">Penalty Time</div>
            <div className="statValue danger">
              {activeBreakOvertimeSeconds > 0
                ? `${Math.floor(activeBreakOvertimeSeconds / 60)}:${String(activeBreakOvertimeSeconds % 60).padStart(2, "0")}`
                : "0:00"}
            </div>
          </div>
        </div>

        <div className="buttonRow" style={{ marginTop: 16 }}>
          {!activeSession && (
            <button className="primaryButton" onClick={clockIn}>
              Clock In For Day
            </button>
          )}

          {activeSession && !activeBreak && (
            <button className="primaryButton" onClick={clockOut}>
              Clock Out For Day
            </button>
          )}

          {activeBreak && (
            <button className="primaryButton" onClick={endBreak}>
              Clock Back In / End Break
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Break Options</h2>

        <div className="cardsGrid">
          {(["break_15_1", "break_15_2", "lunch_30", "break_60"] as BreakType[]).map((type) => (
            <div
              key={type}
              className="quoteCard"
              style={{
                opacity: isDisabled(type) ? 0.45 : 1,
                filter: isDisabled(type) ? "blur(0.4px)" : "none"
              }}
            >
              <div className="quoteNumber">{breakLabel(type)}</div>

              <div className="cardLine">
                {type === "break_60"
                  ? "Taking this locks all other break options."
                  : "This option disables after use."}
              </div>

              <button
                className="secondaryButton"
                disabled={isDisabled(type)}
                onClick={() => startBreak(type)}
              >
                Start {breakLabel(type)}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">Today’s Breaks</h2>

        <div className="cardsGrid">
          {breaks.map((item) => (
            <div key={item.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">{breakLabel(item.breakType)}</div>
                <span className={`statusBadge status-${item.status}`}>
                  {item.status}
                </span>
              </div>

              <div className="cardLine">
                <strong>Started:</strong> {new Date(item.startedAt).toLocaleString()}
              </div>

              <div className="cardLine">
                <strong>Ended:</strong>{" "}
                {item.endedAt ? new Date(item.endedAt).toLocaleString() : "Active"}
              </div>

              <div className="cardLine">
                <strong>Penalty:</strong> {item.overtimePenaltyMinutes.toFixed(2)} min
              </div>
            </div>
          ))}

          {breaks.length === 0 && (
            <div className="listCard">No breaks taken during this session.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panelTitle">My Time History</h2>

        <div className="cardsGrid">
          {history.map((session) => (
            <div key={session.id} className="quoteCard">
              <div className="quoteTopRow">
                <div className="quoteNumber">
                  {new Date(session.clockInAt).toLocaleDateString()}
                </div>
                <span className={`statusBadge status-${session.status}`}>
                  {session.status}
                </span>
              </div>

              <div className="cardLine">
                <strong>Clock In:</strong> {new Date(session.clockInAt).toLocaleString()}
              </div>

              <div className="cardLine">
                <strong>Clock Out:</strong>{" "}
                {session.clockOutAt ? new Date(session.clockOutAt).toLocaleString() : "—"}
              </div>

              <div className="cardLine">
                <strong>Paid Hours:</strong> {minutesToHours(session.paidMinutes)}
              </div>

              <div className="cardLine">
                <strong>Penalty Minutes:</strong> {session.penaltyMinutes.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {role === "admin" && (
        <section className="panel">
          <h2 className="panelTitle">Admin Time Sessions</h2>

          <div className="cardsGrid">
            {adminSessions.map((session) => (
              <div key={session.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">{session.employeeName}</div>
                  <span className={`statusBadge status-${session.status}`}>
                    {session.status}
                  </span>
                </div>

                <div className="cardLine">
                  <strong>Clock In:</strong> {new Date(session.clockInAt).toLocaleString()}
                </div>

                <div className="cardLine">
                  <strong>Clock Out:</strong>{" "}
                  {session.clockOutAt ? new Date(session.clockOutAt).toLocaleString() : "—"}
                </div>

                <div className="cardLine">
                  <strong>Total Hours:</strong> {minutesToHours(session.totalMinutes)}
                </div>

                <div className="cardLine">
                  <strong>Paid Hours:</strong> {minutesToHours(session.paidMinutes)}
                </div>

                <div className="cardLine">
                  <strong>Penalty:</strong> {session.penaltyMinutes.toFixed(2)} min
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

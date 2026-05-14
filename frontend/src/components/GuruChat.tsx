import React from "react";
import { apiFetch } from "../api";
import type { AuthUser } from "../types";

type GuruMessage = {
  id: string;
  sender: "guru" | "user";
  body: string;
  createdAt: string;
};

type BackendGuruMessage = {
  id: string;
  userId: string;
  roleContext: "admin" | "employee" | "client";
  sender: "guru" | "user";
  body: string;
  createdAt: string;
};

function getRoleLabel(user: AuthUser | null) {
  if (!user) return "Client";
  if (user.role === "admin") return "Admin";
  if (user.role === "employee") return "Employee";
  return "Client";
}

function getGreeting(user: AuthUser | null) {
  if (!user || user.role === "client") {
    return "Hi, I’m Guru. What services are you looking to utilize to revive your home?";
  }

  if (user.role === "employee") {
    return "Hi, I’m Guru. I can help with job notes, treatment guidance, safety reminders, surface questions, and field workflow.";
  }

  return "Hi, I’m Guru. I can help with quotes, invoices, scheduling, payments, treatments, pricing, job planning, and business operations.";
}

function getQuickPrompts(user: AuthUser | null) {
  if (!user || user.role === "client") {
    return [
      "I need a quote",
      "I want recurring service",
      "What services do you offer?",
      "I want to upload photos"
    ];
  }

  if (user.role === "employee") {
    return [
      "Help with a treatment",
      "What should I check on this job?",
      "Open field tips",
      "Help collect payment"
    ];
  }

  return [
    "Create quote draft",
    "Review pending estimates",
    "Check payments",
    "Help price a job"
  ];
}

function mapBackendMessage(message: BackendGuruMessage): GuruMessage {
  return {
    id: message.id,
    sender: message.sender,
    body: message.body,
    createdAt: message.createdAt
  };
}

function localStorageKey(user: AuthUser | null) {
  return user ? `nmd-guru-open-${user.id}` : "nmd-guru-open-public";
}

export default function GuruChat({ user }: { user: AuthUser | null }) {
  const [open, setOpen] = React.useState(false);
  const [hasUnread, setHasUnread] = React.useState(true);
  const [typing, setTyping] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [error, setError] = React.useState("");

  const [messages, setMessages] = React.useState<GuruMessage[]>([
    {
      id: "welcome",
      sender: "guru",
      body: getGreeting(user),
      createdAt: new Date().toISOString()
    }
  ]);

  React.useEffect(() => {
    const savedOpen = localStorage.getItem(localStorageKey(user));
    setOpen(savedOpen === "true");
  }, [user?.id]);

  React.useEffect(() => {
    localStorage.setItem(localStorageKey(user), String(open));
  }, [open, user?.id]);

  React.useEffect(() => {
    setError("");

    if (!user) {
      setMessages([
        {
          id: "welcome-public",
          sender: "guru",
          body: getGreeting(null),
          createdAt: new Date().toISOString()
        }
      ]);
      return;
    }

    setLoadingHistory(true);

    apiFetch<{ messages: BackendGuruMessage[] }>("/api/guru/messages")
      .then((data) => {
        if (data.messages.length === 0) {
          setMessages([
            {
              id: "welcome",
              sender: "guru",
              body: getGreeting(user),
              createdAt: new Date().toISOString()
            }
          ]);
        } else {
          setMessages(data.messages.map(mapBackendMessage));
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load Guru history");
        setMessages([
          {
            id: "welcome-error",
            sender: "guru",
            body: getGreeting(user),
            createdAt: new Date().toISOString()
          }
        ]);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [user?.id, user?.role]);

  const openGuru = () => {
    setOpen(true);
    setHasUnread(false);
    setTyping(true);

    window.setTimeout(() => {
      setTyping(false);
    }, 650);
  };

  const closeGuru = () => {
    setOpen(false);
  };

  const getLocalGuruReply = (messageBody: string) => {
    const lower = messageBody.toLowerCase();

    if (lower.includes("quote") || lower.includes("estimate")) {
      return "I can help start your estimate. Please tell me what area needs cleaning, the surface type, approximate size, condition, and whether you can upload photos.";
    }

    if (lower.includes("recurring")) {
      return "Recurring service is a great option. NMD can help with routine exterior cleaning, trash can cleaning, and maintenance schedules. I can help collect the details for admin review.";
    }

    return "I have this noted. Once you create or log into a client account, Guru will save your chat history and help continue your request.";
  };

  const submitMessage = async (body?: string) => {
    const messageBody = (body || input).trim();
    if (!messageBody) return;

    setError("");
    setInput("");

    if (!user) {
      const userMessage: GuruMessage = {
        id: `local-user-${Date.now()}`,
        sender: "user",
        body: messageBody,
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, userMessage]);
      setTyping(true);

      window.setTimeout(() => {
        const guruMessage: GuruMessage = {
          id: `local-guru-${Date.now()}`,
          sender: "guru",
          body: getLocalGuruReply(messageBody),
          createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, guruMessage]);
        setTyping(false);
      }, 700);

      return;
    }

    const optimisticUserMessage: GuruMessage = {
      id: `optimistic-user-${Date.now()}`,
      sender: "user",
      body: messageBody,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setTyping(true);

    try {
      const data = await apiFetch<{
        userMessage: BackendGuruMessage;
        guruMessage: BackendGuruMessage;
      }>("/api/guru/messages", {
        method: "POST",
        body: JSON.stringify({
          body: messageBody
        })
      });

      setMessages((prev) => {
        const withoutOptimistic = prev.filter(
          (message) => message.id !== optimisticUserMessage.id
        );

        return [
          ...withoutOptimistic,
          mapBackendMessage(data.userMessage),
          mapBackendMessage(data.guruMessage)
        ];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guru message failed");

      setMessages((prev) => [
        ...prev,
        {
          id: `guru-error-${Date.now()}`,
          sender: "guru",
          body: "I could not save that message right now. Please try again.",
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setTyping(false);
    }
  };

  const clearHistory = async () => {
    if (!user) {
      setMessages([
        {
          id: "welcome-public-reset",
          sender: "guru",
          body: getGreeting(null),
          createdAt: new Date().toISOString()
        }
      ]);
      return;
    }

    const ok = window.confirm("Clear your Guru chat history?");
    if (!ok) return;

    setError("");

    try {
      await apiFetch("/api/guru/messages", {
        method: "DELETE"
      });

      setMessages([
        {
          id: "welcome-reset",
          sender: "guru",
          body: getGreeting(user),
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear Guru history");
    }
  };

  const roleLabel = getRoleLabel(user);
  const quickPrompts = getQuickPrompts(user);

  return (
    <>
      <button
        type="button"
        onClick={openGuru}
        aria-label="Open Guru chat"
        style={{
          position: "fixed",
          right: 18,
          bottom: open ? 18 : 86,
          zIndex: 120,
          width: 68,
          height: 68,
          borderRadius: "999px",
          border: "1px solid rgba(52, 211, 153, 0.65)",
          background:
            "radial-gradient(circle at 30% 25%, rgba(59,130,246,0.95), rgba(16,185,129,0.9) 45%, rgba(2,6,23,0.98) 100%)",
          color: "#ffffff",
          fontWeight: 900,
          fontSize: 16,
          cursor: "pointer",
          boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
          display: "grid",
          placeItems: "center"
        }}
      >
        <span>Guru</span>

        {hasUnread && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 15,
              height: 15,
              borderRadius: "999px",
              background: "#ef4444",
              border: "2px solid #ffffff"
            }}
          />
        )}
      </button>

      {open && (
        <section
          style={{
            position: "fixed",
            right: 18,
            bottom: 92,
            zIndex: 130,
            width: "min(92vw, 420px)",
            height: "min(78vh, 680px)",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 26px 80px rgba(0,0,0,0.55)",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid var(--border)",
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(37,99,235,0.16))"
            }}
          >
            <div className="panelHeader">
              <div>
                <h2 className="panelTitle" style={{ margin: 0 }}>
                  Guru
                </h2>
                <p className="brandSubtitle">
                  {roleLabel} assistant • NMD Pressure Washing
                </p>
              </div>

              <button className="secondaryButton" type="button" onClick={closeGuru}>
                Close
              </button>
            </div>

            <div className="buttonRow" style={{ marginTop: 10 }}>
              <button className="secondaryButton" type="button" onClick={clearHistory}>
                Clear Chat
              </button>
            </div>
          </div>

          <div
            style={{
              padding: 14,
              overflowY: "auto",
              flex: 1,
              display: "grid",
              gap: 10,
              alignContent: "start"
            }}
          >
            {error && <div className="errorBox">{error}</div>}

            {loadingHistory && (
              <div className="listCard">Loading Guru history...</div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  justifySelf: message.sender === "user" ? "end" : "start",
                  maxWidth: "88%",
                  padding: "10px 12px",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  background:
                    message.sender === "user"
                      ? "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(37,99,235,0.18))"
                      : "rgba(255,255,255,0.04)"
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.75,
                    marginBottom: 4,
                    fontWeight: 800
                  }}
                >
                  {message.sender === "user" ? "You" : "Guru"}
                </div>

                <div className="cardLine" style={{ margin: 0 }}>
                  {message.body}
                </div>
              </div>
            ))}

            {typing && (
              <div
                className="listCard"
                style={{
                  justifySelf: "start",
                  maxWidth: "88%"
                }}
              >
                Guru is typing...
              </div>
            )}
          </div>

          <div
            style={{
              padding: 14,
              borderTop: "1px solid var(--border)",
              display: "grid",
              gap: 10
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 2
              }}
            >
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="secondaryButton"
                  style={{
                    whiteSpace: "nowrap",
                    flex: "0 0 auto"
                  }}
                  onClick={() => submitMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMessage();
              }}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8
              }}
            >
              <input
                className="textInput"
                placeholder="Ask Guru..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />

              <button className="primaryButton" type="submit">
                Send
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}

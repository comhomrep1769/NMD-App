import React from "react";
import type { AuthUserRole } from "../types";
import {
  adminDeleteMessage,
  loadChatThreads,
  normalizeChatRole,
  roleCanSeeThread,
  sendThreadMessage,
  subscribeChatThreads,
  threadTypeLabel,
  type NmdChatRole,
  type NmdChatThread,
  type NmdChatThreadType
} from "../utils/chatStorage";

const filterOptions: Array<{
  value: "all" | NmdChatThreadType;
  label: string;
}> = [
  { value: "all", label: "All Chats" },
  { value: "client_admin", label: "Client ↔ Admin" },
  { value: "admin_employee", label: "Admin ↔ Employee" },
  { value: "company_group", label: "Company Group" },
  { value: "guru_handoff", label: "Guru Handoff" }
];

function roleDisplayName(role: NmdChatRole) {
  if (role === "superadmin") return "Super Admin";
  if (role === "admin") return "Admin";
  if (role === "employee") return "Employee";
  if (role === "client") return "Client";
  return "Guru";
}

function canDelete(role: NmdChatRole) {
  return role === "admin" || role === "superadmin";
}

function canSendToThread(role: NmdChatRole, thread: NmdChatThread) {
  if (role === "superadmin") return true;
  return roleCanSeeThread(role, thread);
}

export default function ChatPage({
  role = "admin"
}: {
  role?: AuthUserRole | string;
}) {
  const safeRole = normalizeChatRole(String(role));
  const [threads, setThreads] = React.useState<NmdChatThread[]>(() => loadChatThreads());
  const [activeThreadId, setActiveThreadId] = React.useState<string>("");
  const [filter, setFilter] = React.useState<"all" | NmdChatThreadType>("all");
  const [message, setMessage] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    return subscribeChatThreads(() => {
      setThreads(loadChatThreads());
    });
  }, []);

  const visibleThreads = threads.filter((thread) => {
    const roleAllowed = roleCanSeeThread(safeRole, thread);
    const filterAllowed = filter === "all" || thread.type === filter;

    const value = search.trim().toLowerCase();
    const matchesSearch =
      !value ||
      [
        thread.title,
        thread.subtitle,
        thread.clientName,
        thread.employeeName,
        thread.type,
        ...thread.messages.map((entry) => entry.body)
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);

    return roleAllowed && filterAllowed && matchesSearch;
  });

  React.useEffect(() => {
    if (!activeThreadId && visibleThreads[0]) {
      setActiveThreadId(visibleThreads[0].id);
    }

    if (
      activeThreadId &&
      !visibleThreads.some((thread) => thread.id === activeThreadId) &&
      visibleThreads[0]
    ) {
      setActiveThreadId(visibleThreads[0].id);
    }
  }, [activeThreadId, visibleThreads]);

  const activeThread =
    visibleThreads.find((thread) => thread.id === activeThreadId) ||
    visibleThreads[0] ||
    null;

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!activeThread) {
      setError("Choose a chat thread first.");
      return;
    }

    if (!canSendToThread(safeRole, activeThread)) {
      setError("You do not have permission to send messages in this thread.");
      return;
    }

    if (!message.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    sendThreadMessage({
      threadId: activeThread.id,
      senderRole: safeRole,
      senderName: `NMD ${roleDisplayName(safeRole)}`,
      body: message.trim()
    });

    setThreads(loadChatThreads());
    setMessage("");
    setSuccess("Message sent.");
  };

  const deleteMessage = (threadId: string, messageId: string) => {
    if (!canDelete(safeRole)) {
      setError("Only Admin or Super Admin can delete messages.");
      return;
    }

    adminDeleteMessage(threadId, messageId);
    setThreads(loadChatThreads());
    setSuccess("Message deleted by Admin.");
  };

  const threadCounts = {
    clientAdmin: visibleThreads.filter((thread) => thread.type === "client_admin").length,
    adminEmployee: visibleThreads.filter((thread) => thread.type === "admin_employee").length,
    company: visibleThreads.filter((thread) => thread.type === "company_group").length,
    guru: visibleThreads.filter((thread) => thread.type === "guru_handoff").length
  };

  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">NMD Chat Center</span>
          <h1>Separated chats for clients, employees, admins, and Guru.</h1>
          <p>
            Client/Admin messages, Admin/Employee messages, Company Group Chat, and Guru
            handoffs are separated so private conversations do not merge into one thread.
          </p>

          <div className="clientHeroActions">
            <button
              className="secondaryButton"
              type="button"
              onClick={() => setFilter("client_admin")}
            >
              Client/Admin
            </button>

            <button
              className="secondaryButton"
              type="button"
              onClick={() => setFilter("admin_employee")}
            >
              Admin/Employee
            </button>

            <button
              className="secondaryButton"
              type="button"
              onClick={() => setFilter("company_group")}
            >
              Company Group
            </button>

            <button
              className="secondaryButton"
              type="button"
              onClick={() => setFilter("guru_handoff")}
            >
              Guru
            </button>
          </div>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Current Access</div>
          <div className="clientStatusTitle">{roleDisplayName(safeRole)}</div>
          <p>
            You only see threads allowed for this role. Super Admin can see everything.
          </p>
        </div>
      </section>

      {error && <div className="errorBox">{error}</div>}

      {success && (
        <div className="listCard" style={{ borderColor: "rgba(34, 197, 94, 0.65)" }}>
          {success}
        </div>
      )}

      <section className="panel">
        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Client/Admin</div>
            <div className="statValue">{threadCounts.clientAdmin}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Admin/Employee</div>
            <div className="statValue">{threadCounts.adminEmployee}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Company Group</div>
            <div className="statValue">{threadCounts.company}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Guru</div>
            <div className="statValue">{threadCounts.guru}</div>
          </div>
        </div>
      </section>

      <section className="chatWorkspace">
        <aside className="chatThreadList">
          <div className="panelHeader">
            <div>
              <h2 className="panelTitle" style={{ fontSize: "1.25rem" }}>
                Threads
              </h2>
              <p className="brandSubtitle">Role-separated conversations.</p>
            </div>
          </div>

          <div className="formGrid" style={{ marginTop: 14 }}>
            <label className="fieldLabel">
              Search Chats
              <input
                className="textInput"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search messages, clients, employees..."
              />
            </label>

            <label className="fieldLabel">
              Chat Type
              <select
                className="textInput"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as "all" | NmdChatThreadType)
                }
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="chatThreadButtons">
            {visibleThreads.map((thread) => (
              <button
                key={thread.id}
                className={
                  activeThread?.id === thread.id
                    ? "chatThreadButton active"
                    : "chatThreadButton"
                }
                type="button"
                onClick={() => setActiveThreadId(thread.id)}
              >
                <span>
                  <strong>{thread.title}</strong>
                  <small>{thread.subtitle}</small>
                </span>

                <span className="statusBadge status-approved">
                  {threadTypeLabel(thread.type)}
                </span>
              </button>
            ))}

            {visibleThreads.length === 0 && (
              <div className="listCard">No chats are visible for this role/filter.</div>
            )}
          </div>
        </aside>

        <main className="chatMessagePanel">
          {activeThread ? (
            <>
              <div className="panelHeader">
                <div>
                  <h2 className="panelTitle">{activeThread.title}</h2>
                  <p className="brandSubtitle">{activeThread.subtitle}</p>
                </div>

                <span className="statusBadge status-approved">
                  {threadTypeLabel(activeThread.type)}
                </span>
              </div>

              {activeThread.type === "company_group" && (
                <div className="errorBox">
                  <strong>Company group rule:</strong> This chat is pinned. Employees
                  cannot delete messages. Admin/Super Admin may delete individual
                  messages only.
                </div>
              )}

              {activeThread.type === "client_admin" && (
                <div className="listCard">
                  <strong>Client/Admin chat:</strong> Clients do not see internal
                  Admin/Employee conversations.
                </div>
              )}

              {activeThread.type === "admin_employee" && (
                <div className="listCard">
                  <strong>Internal chat:</strong> Clients cannot see this thread.
                </div>
              )}

              {activeThread.type === "guru_handoff" && (
                <div className="listCard">
                  <strong>Guru handoff:</strong> Use this for Guru estimate notes,
                  treatment questions, AI-generated summaries, and review handoffs.
                </div>
              )}

              <div className="chatMessages">
                {activeThread.messages.map((entry) => {
                  const mine = entry.senderRole === safeRole;

                  return (
                    <article
                      key={entry.id}
                      className={mine ? "chatBubble mine" : "chatBubble"}
                    >
                      <div className="chatBubbleMeta">
                        <strong>{entry.senderName}</strong>
                        <small>{new Date(entry.createdAt).toLocaleString()}</small>
                      </div>

                      <p>{entry.body}</p>

                      {entry.imageUrl && (
                        <img
                          src={entry.imageUrl}
                          alt={entry.imageName || "Chat upload"}
                          className="chatImagePreview"
                        />
                      )}

                      {canDelete(safeRole) && !entry.deletedByAdmin && (
                        <button
                          className="dangerButton"
                          type="button"
                          onClick={() => deleteMessage(activeThread.id, entry.id)}
                        >
                          Delete Message
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>

              <form className="chatComposer" onSubmit={sendMessage}>
                <textarea
                  className="textInput"
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={`Message ${activeThread.title}...`}
                />

                <div className="buttonRow">
                  <button className="primaryButton" type="submit">
                    Send Message
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="listCard">Choose a chat thread to begin.</div>
          )}
        </main>
      </section>
    </div>
  );
}

export type NmdChatRole = "superadmin" | "admin" | "employee" | "client" | "guru";

export type NmdChatThreadType =
  | "client_admin"
  | "admin_employee"
  | "company_group"
  | "guru_handoff";

export type NmdChatMessage = {
  id: string;
  threadId: string;
  senderRole: NmdChatRole;
  senderName: string;
  body: string;
  createdAt: string;
  imageName?: string;
  imageUrl?: string;
  deletedByAdmin?: boolean;
};

export type NmdChatThread = {
  id: string;
  type: NmdChatThreadType;
  title: string;
  subtitle: string;
  participantRoles: NmdChatRole[];
  pinned?: boolean;
  clientName?: string;
  employeeName?: string;
  lastUpdatedAt: string;
  messages: NmdChatMessage[];
};

const CHAT_STORAGE_KEY = "nmd_role_based_chat_threads";
const CHAT_STORAGE_EVENT = "nmd-role-chat-updated";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function normalizeChatRole(role?: string): NmdChatRole {
  const value = String(role || "").toLowerCase();

  if (value === "superadmin" || value === "super_admin" || value === "super-admin") {
    return "superadmin";
  }

  if (value === "admin") return "admin";
  if (value === "employee") return "employee";
  if (value === "client") return "client";
  if (value === "guru") return "guru";

  return "admin";
}

export function starterChatThreads(): NmdChatThread[] {
  const createdAt = nowIso();

  return [
    {
      id: "company-group",
      type: "company_group",
      title: "Company Group Chat",
      subtitle: "Pinned chat for Admin, Super Admin, and Employees. Employees cannot delete messages.",
      participantRoles: ["superadmin", "admin", "employee"],
      pinned: true,
      lastUpdatedAt: createdAt,
      messages: [
        {
          id: makeId("message"),
          threadId: "company-group",
          senderRole: "admin",
          senderName: "NMD Admin",
          body: "Company group chat is separated from client conversations.",
          createdAt
        }
      ]
    },
    {
      id: "client-admin-sample",
      type: "client_admin",
      title: "Client ↔ Admin",
      subtitle: "Private client/admin service conversation for quotes, invoices, appointments, and photos.",
      participantRoles: ["superadmin", "admin", "client"],
      clientName: "Sample Client",
      lastUpdatedAt: createdAt,
      messages: [
        {
          id: makeId("message"),
          threadId: "client-admin-sample",
          senderRole: "client",
          senderName: "Sample Client",
          body: "Client/admin chat is separate from employee chat.",
          createdAt
        }
      ]
    },
    {
      id: "admin-employee-sample",
      type: "admin_employee",
      title: "Admin ↔ Employee",
      subtitle: "Internal admin/employee job communication. Clients cannot see this thread.",
      participantRoles: ["superadmin", "admin", "employee"],
      employeeName: "NMD Team Member",
      lastUpdatedAt: createdAt,
      messages: [
        {
          id: makeId("message"),
          threadId: "admin-employee-sample",
          senderRole: "admin",
          senderName: "NMD Admin",
          body: "Admin/employee chat is internal only.",
          createdAt
        }
      ]
    },
    {
      id: "guru-handoff",
      type: "guru_handoff",
      title: "Guru Handoff",
      subtitle: "Guru-related notes, estimate handoffs, treatment questions, and AI review references.",
      participantRoles: ["superadmin", "admin", "employee", "client", "guru"],
      lastUpdatedAt: createdAt,
      messages: [
        {
          id: makeId("message"),
          threadId: "guru-handoff",
          senderRole: "guru",
          senderName: "Guru",
          body: "Guru chat remains separated from direct client/admin and admin/employee conversations.",
          createdAt
        }
      ]
    }
  ];
}

export function loadChatThreads() {
  const raw = localStorage.getItem(CHAT_STORAGE_KEY);

  if (!raw) {
    const starter = starterChatThreads();
    saveChatThreads(starter);
    return starter;
  }

  try {
    const parsed = JSON.parse(raw) as NmdChatThread[];

    if (!Array.isArray(parsed)) {
      const starter = starterChatThreads();
      saveChatThreads(starter);
      return starter;
    }

    return parsed;
  } catch {
    const starter = starterChatThreads();
    saveChatThreads(starter);
    return starter;
  }
}

export function saveChatThreads(threads: NmdChatThread[]) {
  const sorted = [...threads].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    return b.lastUpdatedAt.localeCompare(a.lastUpdatedAt);
  });

  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sorted));
  window.dispatchEvent(new CustomEvent(CHAT_STORAGE_EVENT));

  return sorted;
}

export function subscribeChatThreads(callback: () => void) {
  window.addEventListener(CHAT_STORAGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CHAT_STORAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function roleCanSeeThread(role: NmdChatRole, thread: NmdChatThread) {
  if (role === "superadmin") return true;
  return thread.participantRoles.includes(role);
}

export function visibleThreadsForRole(role: NmdChatRole) {
  return loadChatThreads().filter((thread) => roleCanSeeThread(role, thread));
}

export function sendThreadMessage({
  threadId,
  senderRole,
  senderName,
  body,
  imageName,
  imageUrl
}: {
  threadId: string;
  senderRole: NmdChatRole;
  senderName: string;
  body: string;
  imageName?: string;
  imageUrl?: string;
}) {
  const threads = loadChatThreads();

  const updated = threads.map((thread) => {
    if (thread.id !== threadId) return thread;

    const message: NmdChatMessage = {
      id: makeId("message"),
      threadId,
      senderRole,
      senderName,
      body,
      imageName,
      imageUrl,
      createdAt: nowIso()
    };

    return {
      ...thread,
      lastUpdatedAt: message.createdAt,
      messages: [...thread.messages, message]
    };
  });

  return saveChatThreads(updated);
}

export function adminDeleteMessage(threadId: string, messageId: string) {
  const threads = loadChatThreads();

  const updated = threads.map((thread) => {
    if (thread.id !== threadId) return thread;

    return {
      ...thread,
      messages: thread.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              deletedByAdmin: true,
              body: "Message deleted by Admin."
            }
          : message
      )
    };
  });

  return saveChatThreads(updated);
}

export function threadTypeLabel(type: NmdChatThreadType) {
  const labels: Record<NmdChatThreadType, string> = {
    client_admin: "Client/Admin",
    admin_employee: "Admin/Employee",
    company_group: "Company Group",
    guru_handoff: "Guru"
  };

  return labels[type];
}

export type ThemeMode = "dark" | "light";

export type PageKey =
  | "dashboard"
  | "clients"
  | "quotes"
  | "invoices"
  | "schedule"
  | "employees"
  | "chat"
  | "my-ledger";

export type Role = "admin" | "employee";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
};

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
};

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export type Quote = {
  id: string;
  quoteNumber: number;
  clientName: string;
  serviceType: string;
  total: number;
  status: QuoteStatus;
};

export type InvoiceStatus = "paid" | "unpaid";

export type Invoice = {
  id: string;
  invoiceNumber: number;
  clientName: string;
  jobName: string;
  total: number;
  status: InvoiceStatus;
};

export type Employee = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string;
};

export type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type AssignedEmployee = {
  id: string;
  displayName: string;
  email: string;
};

export type Job = {
  id: string;
  title: string;
  client_name: string;
  address: string;
  start_time: string;
  end_time: string;
  status: JobStatus;
  notes: string | null;
  assigned_employees: AssignedEmployee[];
};

export type ChatUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
};

export type Conversation = {
  id: string;
  created_at: string;
  members: ChatUser[];
  last_message: string | null;
  last_message_at: string | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_display_name: string;
  sender_email: string;
  sender_role: Role;
};

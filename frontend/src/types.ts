export type ThemeMode = "dark" | "light";

export type PageKey =
  | "dashboard"
  | "clients"
  | "quotes"
  | "invoices"
  | "schedule"
  | "employees"
  | "chat"
  | "availability"
  | "tips"
  | "payroll"
  | "requests"
  | "expenses"
  | "service-request"
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
  clientId?: string | null;
  clientName: string;
  serviceType: string;
  total: number;
  status: QuoteStatus;
  createdAt?: string;
};

export type InvoiceStatus = "paid" | "unpaid";

export type Invoice = {
  id: string;
  invoiceNumber: number;
  clientId?: string | null;
  clientName: string;
  jobName: string;
  total: number;
  status: InvoiceStatus;
  jobId?: string | null;
  jobTitle?: string | null;
  assignedUserId?: string | null;
  assignedEmployeeName?: string | null;
  createdAt?: string;

  paymentProvider?: string | null;
  paymentLinkId?: string | null;
  paymentLinkUrl?: string | null;
  paymentStatus?: "unpaid" | "link_created" | "paid" | "expired";
  paymentCreatedAt?: string | null;
  stripeCheckoutSessionId?: string | null;
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

export type TipNote = {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};

export type PayRunItem = {
  id?: string;
  userId: string;
  displayName: string;
  email: string;
  amount: number;
  notes?: string | null;
};

export type PayRun = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "approved" | "paid_in_roll";
  notes?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  items: PayRunItem[];
};

export type ServiceRequestStatus = "pending" | "reviewed" | "scheduled" | "declined";

export type ServiceRequest = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  address: string;
  serviceType: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
  photoDataUrl?: string | null;
  photoNote?: string | null;
  waiverAccepted?: boolean;
  waiverSignature?: string | null;
  waiverSignedAt?: string | null;
  status: ServiceRequestStatus;
  createdAt: string;
};

export type ExpenseReimbursementStatus =
  | "not_reimbursed"
  | "pending"
  | "approved"
  | "reimbursed";

export type Expense = {
  id: string;
  employeeId?: string | null;
  employeeName?: string | null;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  vendor?: string | null;
  notes?: string | null;
  receiptDataUrl?: string | null;
  reimbursementStatus: ExpenseReimbursementStatus;
  createdBy?: string | null;
  createdAt: string;
};

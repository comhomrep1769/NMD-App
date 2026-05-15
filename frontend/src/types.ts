export type ThemeMode = "dark" | "light";

export type AuthUserRole = "superadmin" | "admin" | "employee" | "client";

export type Role = AuthUserRole;

export type PageKey =
  | "dashboard"
  | "clients"
  | "quotes"
  | "invoices"
  | "employees"
  | "schedule"
  | "chat"
  | "availability"
  | "tips"
  | "payroll"
  | "requests"
  | "expenses"
  | "mileage"
  | "recurring"
  | "timeclock"
  | "equipment"
  | "treatments"
  | "pricing"
  | "email"
  | "pos"
  | "my-ledger"
  | "guru-estimates"
  | "client-estimates"
  | "client-quotes";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: AuthUserRole;
  payRate?: number | null;
  phone?: string | null;
  dateJoined?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Client = {
  id: string;

  name: string;
  firstName: string;
  lastName: string;

  email: string;
  phone: string;
  address: string;

  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export type Quote = {
  id: string;
  quoteNumber: number;

  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;

  serviceType?: string | null;
  serviceAddress?: string | null;
  description?: string | null;

  jobName?: string | null;
  convertedInvoiceId?: string | null;

  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  salesTaxAmount?: number;

  total: number;
  status: QuoteStatus;

  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  sentAt?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
};

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "partial"
  | "overdue"
  | "void"
  | "cancelled"
  | "unpaid";

export type Invoice = {
  id: string;
  invoiceNumber: number;

  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;

  serviceType?: string | null;
  serviceAddress?: string | null;
  description?: string | null;

  jobName?: string | null;

  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  salesTaxAmount?: number;

  total: number;
  amountPaid?: number;
  balanceDue?: number;

  status: InvoiceStatus;
  paymentStatus?: "paid" | "unpaid" | "partial" | "overdue" | "void" | "cancelled";
  paymentLinkUrl?: string | null;

  dueDate?: string | null;
  notes?: string | null;

  createdAt?: string;
  updatedAt?: string;
  sentAt?: string | null;
  paidAt?: string | null;
};

export type GuruEstimateStatus =
  | "needs_review"
  | "reviewed"
  | "converted_to_quote"
  | "declined"
  | "archived";

export type GuruEstimate = {
  id: string;

  clientUserId?: string | null;
  clientId?: string | null;
  clientName: string;
  phone: string;
  email: string;
  address: string;

  serviceType: string;
  propertyArea: string;
  surfaceType: string;
  conditionLevel: string;
  squareFootage: string;
  preferredSchedule: string;
  specialConcerns: string;

  photoDataUrl?: string | null;
  photoNote?: string | null;

  preliminaryEstimateLow: number;
  preliminaryEstimateHigh: number;
  preliminaryNotes?: string | null;

  status: GuruEstimateStatus;

  quoteId?: string | null;
  quoteNumber?: number | null;
  quoteTotal?: number | null;
  quoteStatus?: QuoteStatus | string | null;

  createdAt?: string;
  updatedAt?: string;
  reviewedAt?: string | null;
  convertedAt?: string | null;
  declinedAt?: string | null;
  archivedAt?: string | null;
};

export type ServiceRequestStatus =
  | "new"
  | "reviewing"
  | "scheduled"
  | "quoted"
  | "completed"
  | "archived";

export type ServiceRequest = {
  id: string;
  clientName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  serviceType?: string | null;
  message?: string | null;
  preferredSchedule?: string | null;
  photoDataUrl?: string | null;
  status: ServiceRequestStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type Employee = {
  id: string;
  displayName: string;
  email: string;
  phone?: string | null;
  role: "employee";
  payRate?: number | null;
  dateJoined: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type JobStatus =
  | "new"
  | "scheduled"
  | "assigned"
  | "claimed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "archived";

export type Job = {
  id: string;
  title: string;
  clientId?: string | null;
  clientName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  status: JobStatus;
  serviceType?: string | null;
  location?: string | null;
  address?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  scheduledDate?: string | null;
  estimatedHours?: number | null;
  estimatedPayout?: number | null;
  notes?: string | null;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ScheduleEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  employeeId?: string | null;
  employeeName?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  location?: string | null;
  notes?: string | null;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ChatUser = {
  id: string;
  displayName: string;
  email?: string | null;
  role: AuthUserRole;
  avatarUrl?: string | null;
  isOnline?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  type?: "direct" | "group" | "client" | "company";
  participantIds?: string[];
  participants?: ChatUser[];
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ChatMessage = {
  id: string;

  senderId: string;
  senderName: string;
  senderRole: AuthUserRole;
  body: string;
  roomId?: string | null;

  createdAt: string;
  deletedAt?: string | null;

  sender_id?: string;
  sender_display_name?: string;
  created_at?: string;
  conversation_id?: string;
};

export type ExpenseStatus = "pending" | "approved" | "rejected" | "paid";

export type ExpenseReimbursementStatus =
  | "not_reimbursable"
  | "needs_reimbursement"
  | "reimbursed"
  | "pending"
  | "approved"
  | "rejected"
  | "paid";

export type Expense = {
  id: string;

  title: string;
  category: string;
  amount: number;

  expenseDate: string;
  vendor: string;

  employeeId?: string | null;
  employeeName?: string | null;

  notes?: string | null;
  receiptDataUrl?: string | null;

  status: ExpenseStatus;
  reimbursementStatus: ExpenseReimbursementStatus;

  createdAt?: string;
  updatedAt?: string;
};

export type MileageEntryStatus = "pending" | "approved" | "rejected" | "paid";

export type MileageStatus = MileageEntryStatus;

export type MileageEntry = {
  id: string;
  employeeId?: string | null;
  employeeName?: string | null;
  startOdometer?: number | null;
  endOdometer?: number | null;
  miles: number;
  ratePerMile: number;
  reimbursementTotal: number;
  reason?: string | null;
  proofDataUrl?: string | null;
  status: MileageEntryStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type MileageLog = MileageEntry & {
  date?: string;
  tripDate?: string;
  startLocation?: string;
  endLocation?: string;
  purpose?: string;
  odometerStart?: number | null;
  odometerEnd?: number | null;
  amount?: number;
};

export type RecurringFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "biannual"
  | "annual";

export type RecurringServiceStatus = "active" | "paused" | "cancelled" | "completed";

export type RecurringStatus = RecurringServiceStatus;

export type RecurringService = {
  id: string;
  clientId?: string | null;
  clientName: string;

  phone?: string | null;
  email?: string | null;
  address?: string | null;

  serviceType: string;
  frequency: RecurringFrequency;
  price: number;
  nextServiceDate?: string | null;
  status: RecurringServiceStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RecurringServiceWithStripe = RecurringService & {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePaymentLinkUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type TimeClockStatus = "clocked_out" | "clocked_in" | "on_break" | "on_lunch";

export type BreakType = "break_15" | "lunch_30" | "break_60" | "paid_lunch" | "unpaid_break";

export type BreakLog = {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  type: BreakType;
  startAt: string;
  endAt?: string | null;
  durationMinutes?: number;
  paid?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TimeSession = {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  status: TimeClockStatus;
  breaks?: BreakLog[];
  paidHours?: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TimeClockEntry = {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  breakStartAt?: string | null;
  breakEndAt?: string | null;
  lunchStartAt?: string | null;
  lunchEndAt?: string | null;
  status: TimeClockStatus;
  paidHours?: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Equipment = {
  id: string;
  name: string;
  category?: string | null;
  assignedEmployeeId?: string | null;
  assignedEmployeeName?: string | null;
  condition?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TreatmentItem = {
  id: string;
  name: string;
  category: string;
  surfaceTypes?: string[];
  chemical?: string | null;
  dilutionRatio?: string | null;
  useCase?: string | null;
  safetyNotes?: string | null;
  instructions?: string | null;
  purchaseLink?: string | null;
  costReference?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TipNote = {
  id: string;
  title: string;
  category: string;
  body: string;
  tags?: string[];
  roleVisibility?: AuthUserRole[] | "all";
  createdAt?: string;
  updatedAt?: string;
};

export type PricingReferenceItem = {
  id: string;
  serviceCategory: string;
  serviceName: string;
  surfaceType?: string | null;
  conditionLevel?: string | null;
  priceLow?: number | null;
  priceHigh?: number | null;
  unit?: "flat" | "sqft" | "hourly" | "monthly" | "custom";
  minimumCharge?: number | null;
  notes?: string | null;
  quoteGuidance?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type POSPaymentMethod =
  | "cash"
  | "card"
  | "stripe"
  | "payment_link"
  | "zelle"
  | "check"
  | "other";

export type POSPaymentStatus =
  | "draft"
  | "pending"
  | "collected"
  | "approved"
  | "rejected"
  | "refunded"
  | "failed";

export type POSPayment = {
  id: string;

  invoiceId?: string | null;
  quoteId?: string | null;
  clientId?: string | null;

  clientName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;

  amount: number;
  method: POSPaymentMethod;
  status: POSPaymentStatus;

  cashProofDataUrl?: string | null;
  paymentLinkUrl?: string | null;
  notes?: string | null;

  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string | null;
};

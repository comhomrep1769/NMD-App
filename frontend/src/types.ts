export type ThemeMode = "dark" | "light";

export type AuthUserRole = "admin" | "employee" | "client";

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
  email?: string | null;
  phone?: string | null;
  address?: string | null;
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
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
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
  | "cancelled";

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
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  status: InvoiceStatus;
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
  dateJoined?: string | null;
  isActive?: boolean;
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

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: AuthUserRole;
  body: string;
  roomId?: string | null;
  createdAt: string;
  deletedAt?: string | null;
};

export type ExpenseStatus = "pending" | "approved" | "rejected" | "paid";

export type Expense = {
  id: string;
  employeeId?: string | null;
  employeeName?: string | null;
  category: string;
  amount: number;
  notes?: string | null;
  receiptDataUrl?: string | null;
  status: ExpenseStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type MileageEntryStatus = "pending" | "approved" | "rejected" | "paid";

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

export type RecurringServiceStatus = "active" | "paused" | "cancelled" | "completed";

export type RecurringService = {
  id: string;
  clientId?: string | null;
  clientName: string;
  serviceType: string;
  frequency: "weekly" | "biweekly" | "monthly" | "bimonthly" | "quarterly" | "biannual" | "annual";
  price: number;
  nextServiceDate?: string | null;
  status: RecurringServiceStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TimeClockStatus = "clocked_out" | "clocked_in" | "on_break" | "on_lunch";

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

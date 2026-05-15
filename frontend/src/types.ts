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

export type QuoteStatus = string;

export type Quote = {
  id: string;
  quoteNumber: number;

  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;

  serviceType: string;
  serviceAddress: string;
  description: string;

  jobName: string;
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

export type InvoiceStatus = string;

export type Invoice = {
  id: string;
  invoiceNumber: number;

  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;

  serviceType: string;
  serviceAddress: string;
  description: string;

  jobName: string;

  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  salesTaxAmount?: number;

  total: number;
  amountPaid?: number;
  balanceDue?: number;

  status: InvoiceStatus;
  paymentStatus?: string;
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

export type JobStatus = string;

export type AssignedEmployee = {
  id: string;
  displayName?: string;
  name?: string;
  email?: string;
  color?: string;
};

export type Job = {
  id: string;
  title: string;

  clientId?: string | null;
  clientName?: string | null;
  client_name?: string | null;

  employeeId?: string | null;
  employeeName?: string | null;

  assigned_employees?: AssignedEmployee[];

  status: JobStatus;
  serviceType?: string | null;

  location?: string | null;
  address?: string | null;

  startTime?: string | null;
  endTime?: string | null;
  start_time?: string | null;
  end_time?: string | null;

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

  display_name?: string;
};

export type ConversationMember = {
  id: string;
  userId?: string;
  user_id?: string;
  displayName?: string;
  display_name?: string;
  email?: string;
  role?: AuthUserRole;
};

export type Conversation = {
  id: string;
  title: string;
  type?: "direct" | "group" | "client" | "company";

  participantIds?: string[];
  participants?: ChatUser[];

  members: ConversationMember[];

  lastMessage?: string | null;
  last_message?: string | null;
  lastMessageAt?: string | null;
  last_message_at?: string | null;

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
  created_at: string;
  conversation_id?: string;
};

export type ExpenseStatus = string;

export type ExpenseReimbursementStatus = string;

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

export type MileageEntryStatus = string;

export type MileageStatus = MileageEntryStatus;

export type MileageEntry = {
  id: string;
  employeeId?: string | null;
  employeeName?: string | null;

  startOdometer?: number | null;
  endOdometer?: number | null;

  miles: number;
  milesDriven?: number;

  ratePerMile: number;
  reimbursementRate?: number;

  reimbursementTotal: number;

  reason?: string | null;
  proofDataUrl?: string | null;
  odometerPhotoDataUrl?: string | null;

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
  milesDriven: number;
  reimbursementRate: number;
  odometerPhotoDataUrl?: string | null;
};

export type RecurringFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "biannual"
  | "annual";

export type RecurringServiceStatus = string;

export type RecurringStatus = RecurringServiceStatus;

export type RecurringService = {
  id: string;
  clientId?: string | null;
  clientName: string;

  phone: string;
  email: string;
  address: string;

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
};

export type TimeClockStatus = string;

export type BreakType = string;

export type BreakLog = {
  id: string;
  employeeId: string;
  employeeName?: string | null;

  type?: BreakType;
  breakType?: BreakType;

  startAt?: string | null;
  startedAt?: string | null;

  endAt?: string | null;
  endedAt?: string | null;

  durationMinutes?: number;
  allowedMinutes?: number;
  paidMinutes?: number;
  overtimePenaltyMinutes?: number;

  paid?: boolean;
  status?: string;

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
  paidMinutes?: number;
  penaltyMinutes?: number;
  totalMinutes?: number;

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

  body?: string;
  content: string;

  tags?: string[];
  roleVisibility?: AuthUserRole[] | "all";

  pinned?: boolean;

  createdAt?: string;
  updatedAt?: string;
  updated_at?: string;
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

export type POSPaymentMethod = string;

export type POSPaymentStatus = string;

export type POSPayment = {
  id: string;

  invoiceId?: string | null;
  quoteId?: string | null;
  clientId?: string | null;

  clientName?: string | null;

  employeeId?: string | null;
  employeeName?: string | null;

  collectedByName?: string | null;
  approvedByName?: string | null;

  amount: number;
  totalCollected: number;
  salesTaxAmount: number;

  method: POSPaymentMethod;
  paymentMethod: POSPaymentMethod;

  status: POSPaymentStatus;

  cashProofDataUrl?: string | null;
  cashPhotoDataUrl?: string | null;

  paymentLinkUrl?: string | null;
  notes?: string | null;

  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string | null;
};

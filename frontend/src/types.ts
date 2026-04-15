export type ThemeMode = "dark" | "light";

export type PageKey =
  | "dashboard"
  | "clients"
  | "quotes"
  | "invoices";

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

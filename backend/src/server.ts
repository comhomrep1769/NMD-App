import "dotenv/config";
import express from "express";
import cors from "cors";
import salesRoutes from "./routes/sales.js";
import authRoutes from "./routes/auth.js";
import guruRoutes from "./routes/guru.js";
import guruTrainingRoutes from "./routes/guruTraining.js";
import paymentsRoutes from "./routes/payments.js";
import posRoutes from "./routes/pos.js";
import treatmentsRoutes from "./routes/treatments.js";
import chatRoutes from "./routes/chat.js";
import emailTestRoutes from "./routes/email-test.js";
import employeesRoutes from "./routes/employees.js";
import employeeDashboardRoutes from "./routes/employee-dashboard.js";
import clientPortalRoutes from "./routes/client-portal.js";
import timeclockRoutes from "./routes/timeclock.js";
import mileageRoutes from "./routes/mileage.js";
import invoicesRoutes from "./routes/invoices.js";
import clientsRoutes from "./routes/clients.js";
import dashboardRoutes from "./routes/dashboard.js";
import expensesRoutes from "./routes/expenses.js";
import payrollRoutes from "./routes/payroll.js";
import notificationsRoutes from "./routes/notifications.js";
import jobsRoutes from "./routes/jobs.js";
import quotesRoutes from "./routes/quotes.js";
import recurringRoutes from "./routes/recurring.js";
import pricingRoutes from "./routes/pricing.js";
import bonusRoutes from "./routes/bonus.js";
import requestsRoutes from "./routes/requests.js";
import smsRoutes from "./routes/sms.js";
import routePlannerRoutes from "./routes/routePlanner.js";
import applicantsRoutes from "./routes/applicants.js";
import activityRoutes from "./routes/activity.js";

const app = express();

const PORT = Number(process.env.PORT || 10000);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000"
].filter(Boolean) as string[];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) { callback(null, true); return; }
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true); return;
      }
      callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "NMD backend", message: "NMD backend is running." });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "NMD backend", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/guru", guruRoutes);
app.use("/api/guru-training", guruTrainingRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/treatments", treatmentsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/email-test", emailTestRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/employee-dashboard", employeeDashboardRoutes);
app.use("/api/client-portal", clientPortalRoutes);
app.use("/api/timeclock", timeclockRoutes);
app.use("/api/mileage", mileageRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/quotes", quotesRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/bonus", bonusRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/routes", routePlannerRoutes);
app.use("/api/applicants", applicantsRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/activity", activityRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled backend error:", err);
  const message = err instanceof Error ? err.message : "Unexpected backend server error.";
  if (message.toLowerCase().includes("request entity too large")) {
    return res.status(413).json({
      message: "Upload file is too large for the backend request limit. The backend limit has been increased to 25mb, redeploy and try again."
    });
  }
  return res.status(500).json({ message });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NMD backend listening on port ${PORT}`);
});
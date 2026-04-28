import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import jobsRoutes from "./routes/jobs.js";
import ledgerRoutes from "./routes/ledger.js";
import chatRoutes from "./routes/chat.js";
import clientRoutes from "./routes/clients.js";
import quoteRoutes from "./routes/quotes.js";
import invoiceRoutes from "./routes/invoices.js";
import paymentRoutes from "./routes/payments.js";
import notificationRoutes from "./routes/notifications.js";
import availabilityRoutes from "./routes/availability.js";
import tipsRoutes from "./routes/tips.js";
import payrollRoutes from "./routes/payroll.js";
import requestRoutes from "./routes/requests.js";
import expenseRoutes from "./routes/expenses.js";
import mileageRoutes from "./routes/mileage.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: false
  })
);

app.post(
  "/api/payments/stripe-webhook",
  express.raw({ type: "application/json" }),
  paymentRoutes
);

app.use(express.json({ limit: "3mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    const db = await pool.query("SELECT NOW()");
    res.json({
      ok: true,
      time: db.rows[0].now
    });
  } catch (error) {
    console.error("health error", error);
    res.status(500).json({ ok: false });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/tips", tipsRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/mileage", mileageRoutes);

const port = Number(process.env.PORT || 10000);

app.listen(port, () => {
  console.log(`NMD backend listening on port ${port}`);
});

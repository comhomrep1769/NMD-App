import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import guruRoutes from "./routes/guru";
import paymentsRoutes from "./routes/payments";
import posRoutes from "./routes/pos";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 10000);
const FRONTEND_URL = process.env.FRONTEND_URL || "";

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://nmdpowash.com",
  "https://www.nmdpowash.com"
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, true);
    },
    credentials: true
  })
);

app.use("/api/payments/stripe-webhook", express.raw({ type: "application/json" }));

app.use(
  express.json({
    limit: "3mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "3mb"
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "NMD backend",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/guru", guruRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/pos", posRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.path}`
  });
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled backend error:", err);

    res.status(500).json({
      message: err instanceof Error ? err.message : "Internal server error"
    });
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NMD backend listening on port ${PORT}`);
});

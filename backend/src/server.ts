import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: false
  })
);

app.use(express.json());

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

const port = Number(process.env.PORT || 10000);

app.listen(port, () => {
  console.log(`NMD backend listening on port ${port}`);
});

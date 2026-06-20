// New file: backend/src/services/activityLog.ts
// Helper to write entries to the activity_log table from anywhere in the backend.

import { pool } from "../db.js";

export type ActorType = "client" | "employee" | "admin" | "system";

export async function logActivity(params: {
  actorType: ActorType;
  actorName?: string | null;
  actorId?: string | null;
  action: string;
  description: string;
  metadata?: Record<string, any> | null;
}) {
  try {
    await pool.query(
      `INSERT INTO activity_log (actor_type, actor_name, actor_id, action, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.actorType,
        params.actorName || null,
        params.actorId || null,
        params.action,
        params.description,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ]
    );
  } catch (error) {
    // Never let activity logging break the main request flow
    console.error("activity log error", error);
  }
}
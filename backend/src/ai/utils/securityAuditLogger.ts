import { supabaseServer } from "../middleware/auth";

export type SecurityEventType =
  | "PROMPT_INJECTION_DROPPED"
  | "PII_REDACTED"
  | "CRISIS_INTERCEPTED"
  | "EGRESS_SECRET_BLOCKED"
  | "RATE_LIMIT_EXCEEDED"
  | "DAILY_QUOTA_EXCEEDED"
  | "DANGEROUS_EXERCISE_INTERCEPTED"
  | "SAFETY_FILTER_TRIGGERED";

export interface SecurityEventPayload {
  eventType: SecurityEventType;
  userId?: string;
  ip?: string;
  details?: Record<string, any>;
  snippet?: string;
}

/**
 * Centralized Security Audit Telemetry.
 * Logs security occurrences with structured formatting and attempts async persistence
 * to Supabase `security_audit_logs` without ever blocking user request latency.
 */
export function logSecurityEvent(event: SecurityEventPayload) {
  const timestamp = new Date().toISOString();

  console.warn(
    `[SECURITY AUDIT LOG] [${timestamp}] [${event.eventType}] User: ${event.userId || "anonymous"} | IP: ${event.ip || "unknown"}` +
      (event.snippet ? ` | Snippet: "${event.snippet.slice(0, 100)}"` : "") +
      (event.details ? ` | Meta: ${JSON.stringify(event.details)}` : ""),
  );

  // Non-blocking async fire-and-forget logging to Supabase if table exists
  Promise.resolve().then(async () => {
    try {
      await supabaseServer.from("security_audit_logs").insert([
        {
          event_type: event.eventType,
          user_id: event.userId && event.userId !== "dev-user" ? event.userId : null,
          ip_address: event.ip || null,
          details: event.details || {},
          snippet: event.snippet ? event.snippet.slice(0, 200) : null,
          created_at: timestamp,
        },
      ]);
    } catch {
      // Table might not be migrated yet in some environments; quietly suppress
    }
  });
}

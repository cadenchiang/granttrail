/**
 * Structured logging. Every entry records what happened, why, in what context,
 * and what it affects, so demo interactions and failures are traceable in the console.
 */

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  ts: string;
  level: LogLevel;
  action: string;
  cause: string;
  context: Record<string, unknown>;
  impact: string;
}

/**
 * Write one structured log entry to the console as JSON.
 * @param level severity; "error" goes to console.error, "warn" to console.warn
 * @param action short machine-friendly name, e.g. "flag.resolve"
 * @param cause why it happened (user click, validation failure, ...)
 * @param context identifiers and values needed to reproduce it
 * @param impact what changes for the user or the data
 * @returns the entry that was written (useful in tests)
 */
export function logEvent(
  level: LogLevel,
  action: string,
  cause: string,
  context: Record<string, unknown>,
  impact: string,
): LogEntry {
  const entry: LogEntry = { ts: new Date().toISOString(), level, action, cause, context, impact };
  const line = `[granttrail] ${JSON.stringify(entry)}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
  return entry;
}

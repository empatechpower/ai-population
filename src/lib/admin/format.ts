const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

// Returns a Date for epoch-ms numbers or ISO-8601 strings, else null.
export function toDate(value: unknown): Date | null {
  if (typeof value === "number" && value > 1e12) return new Date(value);
  if (typeof value === "string" && ISO_DATE.test(value)) return new Date(value);
  return null;
}

export function formatDate(value: unknown, withTime = false): string | null {
  const d = toDate(value);
  if (!d) return null;
  return d.toLocaleString("en-GB", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

// Presentational status vocabulary shared across apps: the bill lifecycle
// statuses and their Badge tone / dot / label mappings. The literal union
// mirrors the payables status enum owned by each app's domain model (which
// stays the source of truth for the API contract); this copy lets shared UI
// render a status without importing the app's domain layer.

export type BillStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "SCHEDULED"
  | "PAID"
  | "REJECTED"
  | "FAILED";

type Tone = "neutral" | "positive" | "negative" | "warning" | "info" | "accent";

export const STATUS_LABEL: Record<BillStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PAID: "Paid",
  REJECTED: "Rejected",
  FAILED: "Failed",
};

export const STATUS_TONE: Record<BillStatus, Tone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  APPROVED: "positive",
  SCHEDULED: "warning",
  PAID: "positive",
  REJECTED: "negative",
  FAILED: "negative",
};

// Which statuses render with a leading badge dot (in-flight states).
export const STATUS_DOT: Record<BillStatus, boolean> = {
  DRAFT: false,
  SUBMITTED: true,
  APPROVED: true,
  SCHEDULED: true,
  PAID: false,
  REJECTED: true,
  FAILED: true,
};

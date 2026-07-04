// Money is integer cents end to end (matching the API). The UI form works in
// dollars; convert to cents just before calling a server fn, and format cents
// back to a currency string for display.

/** Parse a dollar amount (number or string) into integer cents. */
export function toCents(dollars: number | string): number {
  const n = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Cents → dollars (float), for editing in inputs. */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** Format integer cents as a localized currency string (deterministic locale). */
export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

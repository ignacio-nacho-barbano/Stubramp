// Presentational helpers shared across apps: deterministic date formatting
// (SSR-safe), initials, and a stable name→color hash for avatars and
// split-allocation segments. All pure and client-safe.

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** ISO string → "Jul 1, 2026". Returns an em dash for empty/invalid input. */
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_FMT.format(d);
}

/** ISO date → yyyy-mm-dd for <input type="date"> values. */
export function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Up to two uppercase initials from a name. */
export function initials(name: string): string {
  return String(name || "")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Warm/navy/accent palette; every entry is dark enough for white text.
const AVATAR_PALETTE = [
  "var(--navy-700)",
  "var(--green-600)",
  "var(--amber-600)",
  "var(--accent-700)",
  "var(--gray-600)",
  "var(--red-600)",
];

function hash(s: string): number {
  let h = 0;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Stable background color for a vendor/person avatar, derived from the name. */
export function avatarColor(name: string): string {
  return (
    AVATAR_PALETTE[hash(name) % AVATAR_PALETTE.length] ?? "var(--gray-600)"
  );
}

// Categorical palette for split-allocation bars and legends.
export const ALLOCATION_PALETTE = [
  "var(--navy-700)",
  "var(--green-600)",
  "var(--amber-600)",
  "var(--accent-700)",
  "var(--gray-500)",
  "var(--red-600)",
  "var(--navy-500)",
];

export function allocationColor(index: number): string {
  return (
    ALLOCATION_PALETTE[index % ALLOCATION_PALETTE.length] ?? "var(--gray-500)"
  );
}

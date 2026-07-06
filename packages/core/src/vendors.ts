// Vendor-name matching — shared business logic used to reconcile a free-text
// vendor name (e.g. parsed off an uploaded invoice) against the vendors already
// on record. It's a heuristic, not a wire contract: the goal is to auto-select
// an existing vendor when we're confident, and otherwise leave the choice to the
// user. Kept generic (over `{ name }`) so both the web app's vendor DTO and the
// API's Prisma row can use it without either depending on the other's shape.

// Company/legal suffixes that shouldn't affect a match: "Acme Inc." and "Acme"
// are the same vendor. Matched as whole trailing words, punctuation-insensitive.
const COMPANY_SUFFIXES = new Set([
  "inc",
  "incorporated",
  "llc",
  "llp",
  "ltd",
  "limited",
  "co",
  "corp",
  "corporation",
  "company",
  "gmbh",
  "sa",
  "ag",
  "plc",
]);

/**
 * Normalize a vendor name for comparison: lowercase, drop punctuation, collapse
 * whitespace, and strip trailing company suffixes ("Inc", "LLC", "Co", …). So
 * "Northwind Sample Co." and "northwind  sample" both normalize to
 * "northwind sample".
 */
export function normalizeVendorName(name: string): string {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // punctuation -> space
    .split(/\s+/)
    .filter(Boolean);

  // Peel off trailing suffix words ("acme cloud inc ltd" -> "acme cloud").
  while (words.length > 1 && COMPANY_SUFFIXES.has(words[words.length - 1]!)) {
    words.pop();
  }

  return words.join(" ");
}

/**
 * Find the vendor whose name matches `name` after normalization, or `undefined`
 * if none does. Deliberately conservative — exact normalized equality only — so
 * we never auto-select the wrong vendor; ambiguous names fall through to the
 * user. Returns the first match when several normalize identically.
 */
export function matchVendor<T extends { name: string }>(
  name: string,
  vendors: readonly T[],
): T | undefined {
  const target = normalizeVendorName(name);
  if (!target) return undefined;
  return vendors.find((v) => normalizeVendorName(v.name) === target);
}

import { PDFParse } from "pdf-parse";
import type {
  ParsedBillDocument,
  ParsedLineItem,
} from "../schemas/bill.schema.js";

// ---------------------------------------------------------------------------
// Document parsing facade.
//
// `pdf-parse` is fully hidden behind the `DocumentParser` port: this file is the
// ONLY module in the codebase that imports the library. Callers (the route, the
// services plugin) depend on `DocumentParser`, never the concrete class or the
// library — so swapping pdf-parse for OCR / an AI extractor / a different lib
// later means editing this one file (or supplying an alternate implementation),
// with zero changes anywhere else.
//
// Field extraction is deliberately best-effort heuristics over the extracted
// text: good enough for text-based invoices, and unmatched fields come back
// empty so the user fills them on the confirm screen. It never fabricates data.
// Scanned/image-only PDFs yield no text here (no OCR) and thus mostly-empty
// results — an acceptable, honest limitation for this pass.
// ---------------------------------------------------------------------------

/** The stable contract the rest of the app depends on. */
export interface DocumentParser {
  parse(input: { type: "bill"; file: Buffer }): Promise<ParsedBillDocument>;
}

export class ParseDocumentService implements DocumentParser {
  async parse(input: {
    type: "bill";
    file: Buffer;
  }): Promise<ParsedBillDocument> {
    const text = await this.extractText(input.file);
    return extractBillFields(text);
  }

  // The single point of contact with the PDF library. Returns plain text; if the
  // library can't read the buffer we surface empty text rather than throwing, so
  // a low-signal PDF degrades to an empty (user-fillable) result instead of a 500.
  private async extractText(file: Buffer): Promise<string> {
    // pdf.js takes ownership of a passed TypedArray; hand it a private copy so we
    // never mutate the caller's buffer.
    const parser = new PDFParse({ data: new Uint8Array(file) });
    try {
      const result = await parser.getText();
      return result.text ?? "";
    } finally {
      await parser.destroy();
    }
  }
}

// --- Heuristic extraction (private to this module) -------------------------

// Invoice / bill number, e.g. "Invoice #INV-0042", "Bill No: 12345".
// The label is bounded (`\b`) so it can't match inside "billing@…" or "invoice"
// in an email/domain, and the number must contain a digit so a stray heading
// word ("Bill To", "INVOICE") isn't mistaken for an identifier.
const BILL_NUMBER_RE =
  /\b(?:invoice|bill|inv)\b\s*(?:number|no|#)?\s*[:#]?\s*((?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{2,})/i;

function extractBillFields(text: string): ParsedBillDocument {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    vendorName: extractVendorName(lines),
    billNumber: extractBillNumber(text),
    issueDate: extractIssueDate(text),
    dueDate: extractDueDate(text),
    totalCents: extractTotal(lines),
    lines: extractLineItems(lines),
  };
}

function extractBillNumber(text: string): string {
  return text.match(BILL_NUMBER_RE)?.[1]?.trim() ?? "";
}

// Best-effort: the first non-empty line of an invoice is usually the vendor's
// name / letterhead. Skip a leading generic "Invoice" heading if present.
function extractVendorName(lines: string[]): string {
  for (const line of lines.slice(0, 3)) {
    if (/^(invoice|bill|statement|receipt)\b/i.test(line)) continue;
    return line;
  }
  return lines[0] ?? "";
}

// Dates: find every recognizable date, in document order. An explicit "due"
// label wins for the due date; otherwise the earliest date is the issue date and
// the latest the due date. Labels are matched flexibly ("Invoice Date",
// "Date Issued", "Due Date", "Payment Due") since real invoices vary.
function extractIssueDate(text: string): string | null {
  const labeled = findLabeledDate(
    text,
    /(?:invoice|issue|bill)\s*date|date\s*(?:issued|of\s*issue)/i,
  );
  if (labeled) return labeled;
  const all = findAllDates(text);
  return all[0] ?? null;
}

function extractDueDate(text: string): string | null {
  const labeled = findLabeledDate(text, /due\s*date|payment\s*due|due\b/i);
  if (labeled) return labeled;
  const all = findAllDates(text);
  return all.length > 1 ? (all[all.length - 1] ?? null) : null;
}

// A date immediately following a label on the same portion of text. The label
// is wrapped in a non-capturing group so its own alternation can't leak to the
// top level and swallow the match without capturing the date (group 1).
function findLabeledDate(text: string, label: RegExp): string | null {
  const re = new RegExp(
    `(?:${label.source})[^0-9A-Za-z]{0,20}(${DATE_SOURCE})`,
    "i",
  );
  const m = text.match(re);
  return m?.[1] ? normalizeDate(m[1]) : null;
}

// yyyy-mm-dd | mm/dd/yyyy | mm-dd-yyyy | "Mon DD, YYYY" | "DD Mon YYYY".
const DATE_SOURCE =
  "\\d{4}-\\d{2}-\\d{2}" +
  "|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}" +
  "|[A-Za-z]{3,9}\\.?\\s+\\d{1,2},?\\s+\\d{4}" +
  "|\\d{1,2}\\s+[A-Za-z]{3,9}\\.?\\s+\\d{4}";
const DATE_RE = new RegExp(DATE_SOURCE, "g");

function findAllDates(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(DATE_RE)) {
    const iso = normalizeDate(m[0]);
    if (iso) found.push(iso);
  }
  // De-dupe while preserving order, then sort chronologically.
  const unique = [...new Set(found)];
  return unique.sort();
}

// Normalize a matched date string to yyyy-mm-dd, or null if it isn't a real date.
function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  // Already ISO.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidIso(trimmed) ? trimmed : null;
  }
  // mm/dd/yyyy or mm-dd-yyyy (assume US ordering; 2-digit years -> 20xx).
  const numeric = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (numeric) {
    const mm = numeric[1]!;
    const dd = numeric[2]!;
    const yy = numeric[3]!;
    const year = yy.length === 2 ? `20${yy}` : yy;
    return buildIso(year, mm, dd);
  }
  // "Mon DD, YYYY" / "Month DD YYYY".
  const worded = trimmed.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (worded) {
    const month = MONTHS[worded[1]!.slice(0, 3).toLowerCase()];
    if (month) return buildIso(worded[3]!, String(month), worded[2]!);
  }
  // "DD Mon YYYY" / "DD Month YYYY" (e.g. "06 Jul 2026").
  const dmy = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})$/);
  if (dmy) {
    const month = MONTHS[dmy[2]!.slice(0, 3).toLowerCase()];
    if (month) return buildIso(dmy[3]!, String(month), dmy[1]!);
  }
  return null;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function buildIso(year: string, month: string, day: string): string | null {
  const iso = `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return isValidIso(iso) ? iso : null;
}

function isValidIso(iso: string): boolean {
  const [, m, d] = iso.split("-").map(Number);
  if (m === undefined || d === undefined) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

// Line items. Real invoices lay the item table out in one of two ways:
//
//   (a) one row per line   "Sample Widget Design Services 1 $500.00 $500.00"
//       (description, then qty / unit-price / amount columns), or
//   (b) description and amounts on separate lines:
//           Enterprise Cloud Infrastructure Hosting
//           …wrapped detail…
//           $2,450.00  1  $2,450.00
//
// We anchor on the table's header row ("Description … Amount") and walk the rows
// until the summary (Subtotal / Tax / Total …). A row that carries currency is
// an item; its amount is the last money token on the line. If the row has no
// leading text of its own (layout b) we fall back to the block's title — the
// first buffered description line since the previous item. Summary/notes/page
// rows are excluded so the confirm screen can sum the lines itself.
const SUMMARY_ROW_RE =
  /\b(total|subtotal|sub-total|tax|vat|balance|amount due|amount paid)\b/i;

// A currency amount: "$2,450.00", "$45.00", or a bare "1,505.00". Requires a
// "$" or explicit cents so a stray year ("2026") or qty ("12") is never money.
const MONEY_RE = /\$\s*\d[\d,]*(?:\.\d{2})?|\d{1,3}(?:,\d{3})*\.\d{2}/g;

// The line-item table's header row, e.g. "Description Qty Unit Price Amount".
const TABLE_HEADER_RE = /description/i;
const TABLE_HEADER_COLS_RE = /amount|price|qty|quantity|total/i;

// Rows that terminate the item table: summary totals, notes, payment terms.
const TABLE_END_RE =
  /^\s*(?:sub-?total|total|tax|vat|amount\s+due|balance|notes?\b|payment)\b/i;

// Standalone page markers inside a table ("Page 1 of 2", "-- 1 of 2 --").
const PAGE_MARKER_RE =
  /^\s*(?:page\s+\d+\s+of\s+\d+|-{2,}\s*\d+\s+of\s+\d+\s*-{2,})\s*$/i;

function extractLineItems(lines: string[]): ParsedLineItem[] {
  const headerIdx = lines.findIndex(
    (l) => TABLE_HEADER_RE.test(l) && TABLE_HEADER_COLS_RE.test(l),
  );
  const headerFound = headerIdx >= 0;
  const start = headerFound ? headerIdx + 1 : 0;

  const items: ParsedLineItem[] = [];
  // Description lines seen since the last item — its [0] is the block title,
  // used when an amount row carries no inline description (layout b). Only
  // trusted inside a detected table; without a header we can't tell item text
  // from an address or a footer, so we take inline-described rows only.
  let titleBuffer: string[] = [];

  for (let i = start; i < lines.length; i++) {
    const line = lines[i]!;
    if (headerFound && TABLE_END_RE.test(line)) break;
    if (PAGE_MARKER_RE.test(line)) continue;

    const money = line.match(MONEY_RE);
    if (!money) {
      if (headerFound) titleBuffer.push(line);
      continue;
    }

    const unitCents = toCents(money[money.length - 1]!);
    const description = descriptionFromRow(line) || titleBuffer[0] || "";
    titleBuffer = [];

    if (!description || unitCents === null) continue;
    if (SUMMARY_ROW_RE.test(description)) continue;
    items.push({ description, unitCents });
  }

  return items;
}

// The invoice's stated grand total — the "Total Due" line, NOT the subtotal. We
// scan the summary rows and score each label: an explicit due/balance/grand
// variant beats a bare "Total", and among equal-strength matches the later one
// wins (Total Due is printed after Subtotal). Subtotal rows are skipped outright:
// `\btotal\b` already can't match inside "Subtotal" (no word boundary), but the
// explicit skip also covers the hyphenated "Sub-total" / "Sub Total" forms.
const SUBTOTAL_LABEL_RE = /^\s*sub[\s-]*total\b/i;
const STRONG_TOTAL_LABEL_RE =
  /^\s*(?:total\s*(?:amount\s*)?due|amount\s*due|balance\s*due|grand\s*total|total\b.*\bdue)\b/i;
const WEAK_TOTAL_LABEL_RE = /^\s*total\b/i;

function extractTotal(lines: string[]): number | null {
  let best: { cents: number; score: number } | null = null;
  for (const line of lines) {
    if (SUBTOTAL_LABEL_RE.test(line)) continue;
    const score = STRONG_TOTAL_LABEL_RE.test(line)
      ? 2
      : WEAK_TOTAL_LABEL_RE.test(line)
        ? 1
        : 0;
    if (score === 0) continue;
    const money = line.match(MONEY_RE);
    if (!money) continue;
    const cents = toCents(money[money.length - 1]!);
    if (cents === null) continue;
    // `>=` so a later same-strength match (e.g. a final "Total Due") wins.
    if (!best || score >= best.score) best = { cents, score };
  }
  return best?.cents ?? null;
}

// Strip the trailing numeric columns (currency amounts + a bare qty) off a row
// to leave just its description. Empty when the row is amounts-only (layout b).
function descriptionFromRow(line: string): string {
  return line
    .replace(MONEY_RE, " ") // drop currency amounts
    .replace(/\s+\d+(?:\.\d+)?\s*$/, "") // drop a trailing bare quantity
    .replace(/[\s\t|:;•\-–—]+$/, "") // drop trailing separators
    .replace(/\s{2,}/g, " ")
    .trim();
}

// "$1,250.00" / "1,250.00" -> 125000. Returns null on a malformed amount.
function toCents(amount: string): number | null {
  const normalized = amount.replace(/[$,\s]/g, "");
  if (normalized === "") return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

// Exposed only for unit tests — the parsing logic is worth testing without a
// real PDF. Not part of the DocumentParser port.
export const __test = {
  extractBillFields,
  extractTotal,
  normalizeDate,
  toCents,
};

import { describe, expect, it } from "vitest";
import { __test } from "./parse-document.service.js";

const { extractBillFields, extractTotal, normalizeDate, toCents } = __test;

// A realistic text-based invoice as pdf-parse would extract it (line per row).
const INVOICE_TEXT = `Acme Cloud Inc.
123 Market Street, San Francisco, CA

Invoice #INV-0042
Invoice Date: 2026-06-12
Due Date: 07/12/2026

Description                         Amount
Software subscription               $1,000.00
Implementation & onboarding         $250.00

Subtotal                            $1,250.00
Tax                                 $0.00
Total                               $1,250.00
`;

// One-row-per-line table with qty / unit-price / amount columns, and a vendor
// email that embeds "invoice"/"bill" (a trap for the bill-number heuristic).
const COLUMNAR_INVOICE = `Northwind Sample Co.
123 Fictional Ave, Suite 400
billing@example-invoice-test.com
INVOICE
Bill To:
Acme Testing LLC
Invoice #: INV-TEST-00123
Invoice Date: July 01, 2026
Due Date: July 15, 2026
Terms: Net 14
Description Qty Unit Price Amount
Sample Widget Design Services 1 $500.00 $500.00
Fictional Consulting Hours 10 $75.00 $750.00
Test Product Bundle (Placeholder) 3 $45.00 $135.00
Software License (Demo) 1 $120.00 $120.00
Subtotal: $1,505.00
Tax (8%): $120.40
Total Due: $1,625.40
`;

// Multi-line layout: description spans several lines, then a bare
// unit-price / qty / amount row. Dates are "DD Mon YYYY". Spans two pages.
const MULTILINE_INVOICE = `Apex Global Technologies
INVOICE
No: INV-2026-0894
INVOICE DETAILS
Date Issued: \t06 Jul 2026
Due Date: \t05 Aug 2026
Payment Term: \tNet 30
DESCRIPTION \tUNIT PRICE \tQTY \tAMOUNT
Enterprise Cloud Infrastructure Hosting
Premium AWS/GCP hybrid production cluster environment management (June 2026
usage tier).
$2,450.00 \t1 \t$2,450.00
Dedicated DevOps Engineering Support Hours
On-demand systems architecture optimization and security compliance audit.
$150.00 \t12 \t$1,800.00
Automated SSL/TLS Certificate Administration
Annual provisioning and wildcard validation across external testing domains.
$45.00 \t1 \t$45.00
Page 1 of 2

-- 1 of 2 --

Subtotal: \t$5,055.00
Tax / VAT (8.5%): \t$429.68
Total Due (USD): \t$5,484.68
`;

describe("extractBillFields", () => {
  it("pulls vendor, bill number, dates and line items from a text invoice", () => {
    const result = extractBillFields(INVOICE_TEXT);

    expect(result.vendorName).toBe("Acme Cloud Inc.");
    expect(result.billNumber).toBe("INV-0042");
    expect(result.issueDate).toBe("2026-06-12");
    expect(result.dueDate).toBe("2026-07-12");
    // Bare "Total  $1,250.00" (no "due"): a weak match, still the grand total.
    expect(result.totalCents).toBe(125000);
    expect(result.lines).toEqual([
      { description: "Software subscription", unitCents: 100000 },
      { description: "Implementation & onboarding", unitCents: 25000 },
    ]);
  });

  it("excludes subtotal/tax/total summary rows from line items", () => {
    const { lines } = extractBillFields(INVOICE_TEXT);
    const descriptions = lines.map((l) => l.description.toLowerCase());
    expect(descriptions.some((d) => d.includes("total"))).toBe(false);
    expect(descriptions.some((d) => d.includes("tax"))).toBe(false);
  });

  it("returns empty fields for a low-signal PDF instead of throwing", () => {
    const result = extractBillFields("   \n \n ");
    expect(result).toEqual({
      vendorName: "",
      billNumber: "",
      issueDate: null,
      dueDate: null,
      totalCents: null,
      lines: [],
    });
  });

  it("skips a leading 'Invoice' heading when guessing the vendor", () => {
    const text = "INVOICE\nGlobex Corporation\nInvoice #A-1\n";
    expect(extractBillFields(text).vendorName).toBe("Globex Corporation");
  });

  it("parses a columnar qty/unit-price/amount table using the amount column", () => {
    const result = extractBillFields(COLUMNAR_INVOICE);

    expect(result.vendorName).toBe("Northwind Sample Co.");
    // "bill"/"invoice" in the email and headings must not become the number.
    expect(result.billNumber).toBe("INV-TEST-00123");
    expect(result.issueDate).toBe("2026-07-01");
    expect(result.dueDate).toBe("2026-07-15");
    // "Total Due: $1,625.40", not the "Subtotal: $1,505.00" above it.
    expect(result.totalCents).toBe(162540);
    expect(result.lines).toEqual([
      { description: "Sample Widget Design Services", unitCents: 50000 },
      // amount column (10 x $75 = $750), not the unit price
      { description: "Fictional Consulting Hours", unitCents: 75000 },
      { description: "Test Product Bundle (Placeholder)", unitCents: 13500 },
      { description: "Software License (Demo)", unitCents: 12000 },
    ]);
  });

  it("parses a multi-line table (description above a bare amount row)", () => {
    const result = extractBillFields(MULTILINE_INVOICE);

    expect(result.vendorName).toBe("Apex Global Technologies");
    expect(result.billNumber).toBe("INV-2026-0894");
    // "DD Mon YYYY" dates behind "Date Issued:" / "Due Date:" labels.
    expect(result.issueDate).toBe("2026-07-06");
    expect(result.dueDate).toBe("2026-08-05");
    // "Total Due (USD): $5,484.68", not the "Subtotal: $5,055.00".
    expect(result.totalCents).toBe(548468);
    expect(result.lines).toEqual([
      {
        description: "Enterprise Cloud Infrastructure Hosting",
        unitCents: 245000,
      },
      {
        description: "Dedicated DevOps Engineering Support Hours",
        unitCents: 180000,
      },
      {
        description: "Automated SSL/TLS Certificate Administration",
        unitCents: 4500,
      },
    ]);
  });
});

describe("normalizeDate", () => {
  it("normalizes supported formats to yyyy-mm-dd", () => {
    expect(normalizeDate("2026-06-12")).toBe("2026-06-12");
    expect(normalizeDate("07/12/2026")).toBe("2026-07-12");
    expect(normalizeDate("6-1-26")).toBe("2026-06-01");
    expect(normalizeDate("Jun 12, 2026")).toBe("2026-06-12");
    expect(normalizeDate("January 5 2026")).toBe("2026-01-05");
    expect(normalizeDate("06 Jul 2026")).toBe("2026-07-06");
    expect(normalizeDate("5 August 2026")).toBe("2026-08-05");
  });

  it("rejects impossible or unparseable dates", () => {
    expect(normalizeDate("2026-13-40")).toBeNull();
    expect(normalizeDate("not a date")).toBeNull();
  });
});

describe("extractTotal", () => {
  const lines = (text: string) =>
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

  it("prefers 'Total Due' over the subtotal above it", () => {
    expect(
      extractTotal(
        lines("Subtotal: $1,505.00\nTax (8%): $120.40\nTotal Due: $1,625.40"),
      ),
    ).toBe(162540);
  });

  it("never picks up a subtotal-only summary", () => {
    expect(extractTotal(lines("Subtotal: $1,505.00"))).toBeNull();
    expect(extractTotal(lines("Sub-total: $1,505.00"))).toBeNull();
  });

  it("matches a bare 'Total' when no due variant is present", () => {
    expect(extractTotal(lines("Total $1,250.00"))).toBe(125000);
  });

  it("handles 'Amount Due' and trailing currency codes", () => {
    expect(extractTotal(lines("Amount Due: $900.00"))).toBe(90000);
    expect(extractTotal(lines("Total Due (USD): $5,484.68"))).toBe(548468);
  });

  it("returns null when no total line exists", () => {
    expect(extractTotal(lines("Thanks for your business!"))).toBeNull();
  });
});

describe("toCents", () => {
  it("converts currency strings to integer cents", () => {
    expect(toCents("1,000.00")).toBe(100000);
    expect(toCents("250.00")).toBe(25000);
    expect(toCents("0.99")).toBe(99);
    expect(toCents("$2,450.00")).toBe(245000);
  });
});

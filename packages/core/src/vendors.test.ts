import { describe, expect, it } from "vitest";
import { matchVendor, normalizeVendorName } from "./vendors.js";

describe("normalizeVendorName", () => {
  it("lowercases, strips punctuation and collapses whitespace", () => {
    expect(normalizeVendorName("Northwind  Sample")).toBe("northwind sample");
    expect(normalizeVendorName("A.C.M.E.")).toBe("a c m e");
    expect(normalizeVendorName("  Globex,  Corp.  ")).toBe("globex");
  });

  it("strips trailing company suffixes", () => {
    expect(normalizeVendorName("Northwind Sample Co.")).toBe(
      "northwind sample",
    );
    expect(normalizeVendorName("Acme Cloud Inc")).toBe("acme cloud");
    expect(normalizeVendorName("Apex Global Technologies LLC")).toBe(
      "apex global technologies",
    );
    expect(normalizeVendorName("Widgets Inc Ltd")).toBe("widgets");
  });

  it("keeps a suffix-like word when it is the only word", () => {
    expect(normalizeVendorName("Company")).toBe("company");
  });

  it("returns empty string when there is nothing to match on", () => {
    expect(normalizeVendorName("")).toBe("");
    expect(normalizeVendorName("  ,. ")).toBe("");
  });
});

describe("matchVendor", () => {
  const vendors = [
    { id: "1", name: "Acme Supplies" },
    { id: "2", name: "Northwind Sample Co." },
  ];

  it("matches ignoring case, punctuation and company suffixes", () => {
    expect(matchVendor("northwind sample", vendors)?.id).toBe("2");
    expect(matchVendor("NORTHWIND SAMPLE CO.", vendors)?.id).toBe("2");
    expect(matchVendor("Acme Supplies Inc", vendors)?.id).toBe("1");
  });

  it("returns undefined when nothing matches", () => {
    expect(matchVendor("Apex Global Technologies", vendors)).toBeUndefined();
    expect(matchVendor("", vendors)).toBeUndefined();
  });

  it("does not loosely match a different vendor", () => {
    expect(matchVendor("Northwind", vendors)).toBeUndefined();
  });
});

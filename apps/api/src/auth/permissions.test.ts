import { describe, expect, it } from "vitest";
import type { Action } from "./permissions.js";
import { can } from "./permissions.js";

const ALL_ACTIONS: Action[] = [
  "company:manage",
  "user:manage",
  "vendor:manage",
  "vendor:read",
  "bill:create",
  "bill:read",
  "bill:submit",
  "bill:approve",
  "bill:schedule",
  "bill:pay",
  "bill:delete",
  "card:manage",
  "card:read",
];

describe("permission matrix", () => {
  it("SUPERUSER can do everything", () => {
    for (const action of ALL_ACTIONS) {
      expect(can("SUPERUSER", action)).toBe(true);
    }
  });

  it("ADMIN manages users and companies are platform-only", () => {
    expect(can("ADMIN", "user:manage")).toBe(true);
    expect(can("ADMIN", "bill:approve")).toBe(true);
    expect(can("ADMIN", "company:manage")).toBe(false);
  });

  it("ACCOUNTANT can schedule but not approve", () => {
    expect(can("ACCOUNTANT", "bill:schedule")).toBe(true);
    expect(can("ACCOUNTANT", "bill:create")).toBe(true);
    expect(can("ACCOUNTANT", "bill:approve")).toBe(false);
    expect(can("ACCOUNTANT", "user:manage")).toBe(false);
  });

  it("APPROVER can approve but not create or schedule", () => {
    expect(can("APPROVER", "bill:approve")).toBe(true);
    expect(can("APPROVER", "bill:create")).toBe(false);
    expect(can("APPROVER", "bill:schedule")).toBe(false);
  });

  it("EMPLOYEE can create/read bills but not approve or manage users", () => {
    expect(can("EMPLOYEE", "bill:create")).toBe(true);
    expect(can("EMPLOYEE", "bill:read")).toBe(true);
    expect(can("EMPLOYEE", "bill:approve")).toBe(false);
    expect(can("EMPLOYEE", "user:manage")).toBe(false);
  });

  it("ADMIN, ACCOUNTANT, and EMPLOYEE can delete drafts; APPROVER cannot", () => {
    expect(can("ADMIN", "bill:delete")).toBe(true);
    expect(can("ACCOUNTANT", "bill:delete")).toBe(true);
    expect(can("EMPLOYEE", "bill:delete")).toBe(true);
    expect(can("APPROVER", "bill:delete")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  BILL_STATUSES,
  TRANSITIONS,
  canTransition,
  isTerminal,
} from "./bill-state-machine.js";

// Pure unit tests — no database. The DB-touching guards (split-sum, scheduledFor)
// are covered in bill.service.test.ts against injected fakes.
describe("bill state machine", () => {
  it("allows the happy path", () => {
    expect(canTransition("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransition("SUBMITTED", "APPROVED")).toBe(true);
    expect(canTransition("APPROVED", "SCHEDULED")).toBe(true);
    expect(canTransition("SCHEDULED", "PAID")).toBe(true);
  });

  it("allows failure and retry branches", () => {
    expect(canTransition("SUBMITTED", "REJECTED")).toBe(true);
    expect(canTransition("SCHEDULED", "FAILED")).toBe(true);
    expect(canTransition("FAILED", "SCHEDULED")).toBe(true);
  });

  it("rejects illegal jumps", () => {
    expect(canTransition("DRAFT", "PAID")).toBe(false);
    expect(canTransition("DRAFT", "APPROVED")).toBe(false);
    expect(canTransition("APPROVED", "PAID")).toBe(false);
  });

  it("treats PAID and REJECTED as terminal", () => {
    expect(isTerminal("PAID")).toBe(true);
    expect(isTerminal("REJECTED")).toBe(true);
    expect(isTerminal("DRAFT")).toBe(false);
  });

  it("has a transition entry for every status", () => {
    for (const status of BILL_STATUSES) {
      expect(Array.isArray(TRANSITIONS[status])).toBe(true);
    }
  });
});

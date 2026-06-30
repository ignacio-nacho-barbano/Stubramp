import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

const PEPPER = "test-pepper";

describe("password hashing (salt + pepper)", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("s3cret!", PEPPER);
    expect(await verifyPassword("s3cret!", hash, PEPPER)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("s3cret!", PEPPER);
    expect(await verifyPassword("wrong", hash, PEPPER)).toBe(false);
  });

  it("rejects when the pepper differs (DB leak alone is insufficient)", async () => {
    const hash = await hashPassword("s3cret!", PEPPER);
    expect(await verifyPassword("s3cret!", hash, "other-pepper")).toBe(false);
  });

  it("produces a unique salt per hash", async () => {
    const a = await hashPassword("same", PEPPER);
    const b = await hashPassword("same", PEPPER);
    expect(a).not.toBe(b);
  });

  it("rejects a malformed stored hash", async () => {
    expect(await verifyPassword("x", "not-a-valid-hash", PEPPER)).toBe(false);
  });
});

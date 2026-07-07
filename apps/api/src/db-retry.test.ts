import { describe, expect, it, vi } from "vitest";
import { isTransientDbError, retryReads, withDbRetry } from "./db-retry.js";

describe("isTransientDbError", () => {
  it("detects pg SQLSTATEs (admin shutdown on Neon suspend)", () => {
    expect(isTransientDbError({ code: "57P01" })).toBe(true);
    expect(isTransientDbError({ code: "08006" })).toBe(true);
    expect(isTransientDbError({ code: "40001" })).toBe(true);
  });

  it("detects node socket error codes", () => {
    expect(isTransientDbError({ code: "ECONNRESET" })).toBe(true);
    expect(isTransientDbError({ code: "ETIMEDOUT" })).toBe(true);
  });

  it("detects Prisma engine codes", () => {
    expect(isTransientDbError({ code: "P1001" })).toBe(true);
    expect(isTransientDbError({ code: "P2024" })).toBe(true);
    expect(isTransientDbError({ code: "P2028" })).toBe(true);
  });

  it("detects Prisma init/panic errors by name", () => {
    expect(
      isTransientDbError({ name: "PrismaClientInitializationError" }),
    ).toBe(true);
  });

  it("matches transient messages when no code is present", () => {
    expect(
      isTransientDbError(new Error("Connection terminated unexpectedly")),
    ).toBe(true);
    expect(
      isTransientDbError(new Error("timeout exceeded when trying to connect")),
    ).toBe(true);
  });

  it("walks the cause chain (pg error wrapped by Prisma)", () => {
    const wrapped = new Error("query failed", {
      cause: { code: "57P01" },
    });
    expect(isTransientDbError(wrapped)).toBe(true);
  });

  it("does not flag non-transient errors", () => {
    expect(isTransientDbError({ code: "P2002" })).toBe(false); // unique violation
    expect(isTransientDbError(new Error("nope"))).toBe(false);
    expect(isTransientDbError(null)).toBe(false);
    expect(isTransientDbError(undefined)).toBe(false);
  });

  it("does not loop forever on a self-referential cause", () => {
    const e: { message: string; cause?: unknown } = { message: "boom" };
    e.cause = e;
    expect(isTransientDbError(e)).toBe(false);
  });
});

describe("withDbRetry", () => {
  it("returns the result without retrying on success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withDbRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: "57P01" })
      .mockResolvedValue("recovered");
    await expect(
      withDbRetry(fn, { baseDelayMs: 1, maxDelayMs: 2 }),
    ).resolves.toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-transient error", async () => {
    const fn = vi.fn().mockRejectedValue({ code: "P2002" });
    await expect(withDbRetry(fn)).rejects.toEqual({ code: "P2002" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after `attempts` and rethrows the last error", async () => {
    const fn = vi.fn().mockRejectedValue({ code: "ECONNRESET" });
    await expect(
      withDbRetry(fn, { attempts: 3, baseDelayMs: 1, maxDelayMs: 2 }),
    ).rejects.toEqual({ code: "ECONNRESET" });
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("retryReads", () => {
  it("retries read methods but not writes", async () => {
    const findMany = vi
      .fn()
      .mockRejectedValueOnce({ code: "57P01" })
      .mockResolvedValue([{ id: "1" }]);
    const create = vi.fn().mockRejectedValue({ code: "57P01" });
    const delegate = { findMany, create };

    const wrapped = retryReads(delegate);

    // Read: retried and eventually succeeds.
    await expect(wrapped.findMany({})).resolves.toEqual([{ id: "1" }]);
    expect(findMany).toHaveBeenCalledTimes(2);

    // Write: passed through, no retry (avoids duplicate writes).
    await expect(wrapped.create({})).rejects.toEqual({ code: "57P01" });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("preserves `this` binding for delegate methods", async () => {
    const delegate = {
      _rows: [{ id: "x" }],
      findMany() {
        return Promise.resolve(this._rows);
      },
    };
    const wrapped = retryReads(delegate);
    await expect(wrapped.findMany()).resolves.toEqual([{ id: "x" }]);
  });
});

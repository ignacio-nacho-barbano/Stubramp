import {
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

// Password hashing with BOTH a salt and a pepper:
//  - salt: a per-password random value, stored alongside the hash.
//  - pepper: a single server-side secret (env PASSWORD_PEPPER), NEVER stored in
//    the DB. It's mixed in via HMAC, so a database leak alone is insufficient to
//    brute-force passwords — the attacker also needs the pepper.
// The stored value is `<saltHex>:<derivedKeyHex>`. scrypt is Node-built-in (no
// native deps); swap the KDF here without touching callers. The pepper is passed
// in explicitly (not read from env here) to keep this module pure + testable.
const scryptAsync = promisify(scrypt);
const KEY_LEN = 64;

// Combine password + pepper into the scrypt input via keyed HMAC.
function peppered(plain: string, pepper: string): Buffer {
  return createHmac("sha256", pepper).update(plain).digest();
}

export async function hashPassword(
  plain: string,
  pepper: string,
): Promise<string> {
  const salt = randomBytes(16);
  const dk = (await scryptAsync(peppered(plain, pepper), salt, KEY_LEN)) as Buffer;
  return `${salt.toString("hex")}:${dk.toString("hex")}`;
}

export async function verifyPassword(
  plain: string,
  stored: string,
  pepper: string,
): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const key = Buffer.from(keyHex, "hex");
  const dk = (await scryptAsync(
    peppered(plain, pepper),
    Buffer.from(saltHex, "hex"),
    KEY_LEN,
  )) as Buffer;
  return dk.length === key.length && timingSafeEqual(dk, key);
}

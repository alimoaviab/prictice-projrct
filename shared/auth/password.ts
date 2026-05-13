import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// Pre-computed dummy hash to mitigate timing attacks during user enumeration.
// Generated via hashPassword("dummy_password_for_timing_attack_mitigation").
export const DUMMY_HASH = hashPassword("dummy_password_for_timing_attack_mitigation");

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const existing = Buffer.from(hash, "hex");
  return existing.length === derived.length && timingSafeEqual(existing, derived);
}

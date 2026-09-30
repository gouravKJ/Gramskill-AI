import bcrypt from "bcryptjs";

/**
 * Password hashing.
 *
 * bcrypt with a cost factor of 10 — deliberately chosen over a native argon2
 * binding so the project installs on Windows/college lab machines without a
 * build toolchain. Swap `hashPassword`/`verifyPassword` for argon2id in
 * production without touching any call site.
 */

const COST = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

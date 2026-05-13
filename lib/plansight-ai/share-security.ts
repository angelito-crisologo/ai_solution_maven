import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual
} from "node:crypto";
import { promisify } from "node:util";

// ──────────────────────────────────────────────────────────────────────
// Password hashing (scrypt via node:crypto — no npm dep, no pgcrypto)
// ──────────────────────────────────────────────────────────────────────
//
// scrypt is in the same family as bcrypt / argon2 — a slow-on-purpose
// password KDF. node:crypto exposes it natively, so we avoid adding a
// dependency. Stored format: "scrypt$<salt-hex>$<key-hex>". The spec
// explicitly says the algorithm choice matters less than "is it slow on
// purpose" — scrypt qualifies.

const scryptAsync = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number
) => Promise<Buffer>;

const KEY_LEN = 64;
const SALT_BYTES = 16;
const MIN_PASSWORD_LEN = 8;

export const MIN_SHARE_PASSWORD_LENGTH = MIN_PASSWORD_LEN;

export async function hashSharePassword(plain: string): Promise<string> {
  if (typeof plain !== "string" || plain.length < MIN_PASSWORD_LEN) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LEN} characters.`
    );
  }
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = await scryptAsync(plain, salt, KEY_LEN);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifySharePassword(
  plain: string,
  stored: string
): Promise<boolean> {
  if (typeof plain !== "string" || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  if (!salt || !hashHex) return false;
  let derived: Buffer;
  try {
    derived = await scryptAsync(plain, salt, KEY_LEN);
  } catch {
    return false;
  }
  const hash = Buffer.from(hashHex, "hex");
  if (hash.length !== derived.length) return false;
  return timingSafeEqual(hash, derived);
}

// ──────────────────────────────────────────────────────────────────────
// Session cookie (HMAC-signed JSON payload, per-share scoped)
// ──────────────────────────────────────────────────────────────────────
//
// Cookie value: "<base64url(payload)>.<base64url(hmac)>"
// Payload: { shareId, passwordVersion, exp } (exp = ms since epoch)
//
// On revoke / restore / password change, share_password_version is
// incremented in the database. The cookie still verifies cryptographically
// after that, but the embedded passwordVersion no longer matches the
// stored one — the read path rejects it. That's the spec's "server-side
// session invalidation" without needing a session table.

const COOKIE_PREFIX = "plansight_share_";
const COOKIE_LIFETIME_MS = 4 * 60 * 60 * 1000; // 4 hours, absolute (no slide)

export const SHARE_COOKIE_LIFETIME_SECONDS = COOKIE_LIFETIME_MS / 1000;

type SharePayload = {
  shareId: string;
  passwordVersion: number;
  exp: number;
};

function getCookieSecret(): string {
  const secret = process.env.SHARE_COOKIE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SHARE_COOKIE_SECRET must be set to a value of at least 32 characters. " +
        "Generate one with `openssl rand -hex 32` and add it to Vercel env vars."
    );
  }
  return secret;
}

/**
 * Cookie name namespaced by share id so cross-share traffic doesn't
 * carry irrelevant cookies. `Path` further restricts the cookie to
 * `/share/<shareId>` (set when issuing). The cookie name must use only
 * RFC-6265 safe characters — share IDs are random hex / urlsafe and
 * already conform, but we strip defensively.
 */
export function shareCookieName(shareId: string): string {
  return `${COOKIE_PREFIX}${shareId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function signSharePayload(
  shareId: string,
  passwordVersion: number,
  now: number = Date.now()
): string {
  const payload: SharePayload = {
    shareId,
    passwordVersion,
    exp: now + COOKIE_LIFETIME_MS
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getCookieSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyShareCookie(
  token: string | undefined | null,
  expectedShareId: string,
  expectedPasswordVersion: number,
  now: number = Date.now()
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [body, sig] = parts;
  let providedSig: Buffer;
  let expectedSig: Buffer;
  try {
    expectedSig = createHmac("sha256", getCookieSecret()).update(body).digest();
    providedSig = Buffer.from(sig, "base64url");
  } catch {
    return false;
  }
  if (providedSig.length !== expectedSig.length) return false;
  if (!timingSafeEqual(providedSig, expectedSig)) return false;
  let payload: SharePayload;
  try {
    payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as SharePayload;
  } catch {
    return false;
  }
  if (payload.shareId !== expectedShareId) return false;
  if (payload.passwordVersion !== expectedPasswordVersion) return false;
  if (typeof payload.exp !== "number" || now > payload.exp) return false;
  return true;
}

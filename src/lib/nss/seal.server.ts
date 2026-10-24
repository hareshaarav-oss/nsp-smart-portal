import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SEAL_PREFIX = "nsp1.";
const PASS_PREFIX = "nspw1.";

let keyCache: Buffer | null = null;

function key(): Buffer {
  if (keyCache) return keyCache;
  const secret = process.env.NSS_DATA_KEY?.trim() || "nsp-sdabr-mansa-field-seal-v1";
  keyCache = scryptSync(secret, "nsp-seal-salt-v1", 32);
  return keyCache;
}

export function isSealed(value: string) {
  return value.startsWith(SEAL_PREFIX);
}

export function isHashedPassword(value: string) {
  return value.startsWith(PASS_PREFIX);
}

export function sealText(value: string): string {
  const plain = value ?? "";
  if (!plain || isSealed(plain)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return SEAL_PREFIX + Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function openText(value: string): string {
  if (!value || !isSealed(value)) return value;
  try {
    const buf = Buffer.from(value.slice(SEAL_PREFIX.length), "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `${PASS_PREFIX}${salt.toString("base64url")}.${hash.toString("base64url")}`;
}

export function passwordRecord(password: string) {
  const pw = password.trim();
  if (!pw) return "";
  if (isHashedPassword(pw)) return pw;
  return hashPassword(pw);
}

export function verifyPassword(stored: string, input: string) {
  if (!stored.startsWith(PASS_PREFIX)) return false;
  const [saltB64, hashB64] = stored.slice(PASS_PREFIX.length).split(".");
  if (!saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = scryptSync(input, Buffer.from(saltB64, "base64url"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function passwordOk(stored: string, typed: string, phone: string) {
  const input = typed.trim();
  if (stored && isHashedPassword(stored) && verifyPassword(stored, input)) return true;
  if (stored && !isHashedPassword(stored) && !isSealed(stored) && stored === input) return true;
  const passDigits = input.replace(/\D/g, "");
  const mobile = phone.replace(/\D/g, "");
  return passDigits.length >= 10 && mobile.endsWith(passDigits);
}

export function tokenDocId(token: string) {
  return createHash("sha256").update(`nsp-chat:${token}`).digest("hex").slice(0, 40);
}

export function attendanceDocId(mobile: string, eventName: string) {
  const phone = mobile.replace(/\D/g, "").slice(-10);
  const slug = eventName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  if (phone.length < 10 || !slug) return "";
  return createHash("sha256").update(`${phone}:${slug}`).digest("hex").slice(0, 32);
}

export type SignedChatPass = { id: string; name: string; role: string; unit: string; docId: string };

export function signChatPass(pass: SignedChatPass) {
  const payload = Buffer.from(
    JSON.stringify({
      id: pass.id.slice(0, 40),
      name: pass.name.slice(0, 80),
      role: pass.role.slice(0, 20),
      unit: pass.unit.slice(0, 20),
      docId: pass.docId.slice(0, 40),
      exp: Date.now() + 14 * 24 * 60 * 60 * 1000,
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", key()).update(payload).digest("base64url");
  return `nsp.${payload}.${sig}`;
}

export function openChatPass(token: string): SignedChatPass | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "nsp") return null;
  const expected = createHmac("sha256", key()).update(parts[1]).digest("base64url");
  const left = Buffer.from(parts[2]);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as SignedChatPass & { exp?: number };
    if (!data?.id || !data.exp || data.exp < Date.now()) return null;
    return {
      id: String(data.id),
      name: String(data.name || "NSS"),
      role: String(data.role || "volunteer"),
      unit: String(data.unit || ""),
      docId: String(data.docId || ""),
    };
  } catch {
    return null;
  }
}

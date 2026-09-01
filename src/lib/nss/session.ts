import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_SESSION } from "./constants";
import { digitsOnly, firstNameOf } from "./format";
import type { PortalSession, PortalSettings, Volunteer } from "./types";

type SessionState = {
  session: PortalSession | null;
  setSession: (s: PortalSession | null) => void;
  hydrate: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      hydrate: () => {
        void useSessionStore.persist.rehydrate();
      },
    }),
    { name: STORAGE_SESSION, skipHydration: true },
  ),
);

export type LoginResult =
  | { ok: true; session: PortalSession }
  | { ok: false; error: string };

export function loginStaff(
  role: "po" | "admin",
  username: string,
  password: string,
  settings: PortalSettings,
): LoginResult {
  const u = username.trim().toLowerCase();
  const p = password.trim();
  if (role === "po") {
    if (u === settings.poUsername.toLowerCase() && p === settings.poPassword) {
      return {
        ok: true,
        session: { role: "po", name: settings.poName },
      };
    }
    return { ok: false, error: "Invalid Programme Officer username or password." };
  }
  if (u === settings.adminUsername.toLowerCase() && p === settings.adminPassword) {
    return { ok: true, session: { role: "admin", name: settings.poName } };
  }
  return { ok: false, error: "Invalid admin username or password." };
}

function digits(value: string) {
  return digitsOnly(value);
}

function passwordMatches(v: Volunteer, pass: string) {
  const passDigits = digits(pass);
  const options = [v.loginPassword, v.mobile].filter(Boolean);
  return options.some((expected) => {
    const expectedDigits = digits(String(expected));
    return (
      pass === expected ||
      (passDigits.length > 0 && passDigits === expectedDigits) ||
      (expectedDigits.length >= 10 && expectedDigits.endsWith(passDigits) && passDigits.length >= 10)
    );
  });
}

function toSession(v: Volunteer): PortalSession {
  return {
    role: v.nssRole === "Leader" ? "leader" : "volunteer",
    name: v.fullName,
    volunteerId: v.id,
    enrollment: v.enrollment,
    mobile: v.mobile,
  };
}

function candidatesByUsername(username: string, volunteers: Volunteer[]) {
  const key = username.trim();
  const keyUpper = firstNameOf(key);
  const keyLower = key.toLowerCase();
  const keyDigits = digits(key);
  const byFirst = volunteers.filter((s) => firstNameOf(s.fullName) === keyUpper);
  if (byFirst.length) return byFirst;
  return volunteers.filter((s) => {
    const id = s.volunteerId.toLowerCase();
    const enrollment = s.enrollment.toLowerCase();
    const name = s.fullName.toLowerCase();
    const phone = digits(s.mobile);
    return (
      enrollment === keyLower ||
      id === keyLower ||
      name === keyLower ||
      (keyDigits.length >= 8 && phone === keyDigits) ||
      (keyDigits.length >= 8 && phone.endsWith(keyDigits))
    );
  });
}

export function loginVolunteer(
  username: string,
  password: string,
  volunteers: Volunteer[],
): LoginResult {
  const list = candidatesByUsername(username, volunteers);
  if (!list.length) {
    return {
      ok: false,
      error: "Username not found. Type your FIRST NAME in CAPITAL letters (example: MAHI). Use Forgot username if you need help.",
    };
  }
  const matched = list.filter((v) => passwordMatches(v, password));
  if (matched.length === 1) {
    return { ok: true, session: toSession(matched[0]) };
  }
  if (list.length > 1 && !matched.length) {
    return {
      ok: false,
      error: "More than one volunteer shares this first name. Enter the registered mobile number as password.",
    };
  }
  if (!matched.length) {
    return {
      ok: false,
      error: "Password is your registered mobile number (or the new password you set).",
    };
  }
  return { ok: true, session: toSession(matched[0]) };
}

export function loginWithMpin(username: string, mpin: string, volunteers: Volunteer[]): LoginResult {
  const list = candidatesByUsername(username, volunteers);
  const pin = mpin.trim();
  if (!/^\d{4}$/.test(pin)) return { ok: false, error: "MPIN must be 4 digits." };
  const v = list.find((s) => s.mpin === pin);
  if (!v) return { ok: false, error: "MPIN does not match. Set MPIN from your student dashboard first." };
  return { ok: true, session: toSession(v) };
}

export function lookupUsernameByMobile(mobile: string, volunteers: Volunteer[]) {
  const d = digits(mobile);
  if (d.length < 10) return null;
  const v = volunteers.find((s) => digits(s.mobile).slice(-10) === d.slice(-10));
  if (!v) return null;
  return { firstName: firstNameOf(v.fullName), fullName: v.fullName, volunteerId: v.volunteerId };
}

export function resetPasswordToMobile(username: string, mobile: string, volunteers: Volunteer[]) {
  const list = candidatesByUsername(username, volunteers);
  const d = digits(mobile).slice(-10);
  const v = list.find((s) => digits(s.mobile).slice(-10) === d);
  return v ?? null;
}

export function findSessionVolunteer(volunteers: Volunteer[], session: PortalSession | null) {
  if (!session) return undefined;
  const d = digits(session.mobile || "");
  const key = (session.volunteerId || "").trim().toLowerCase();
  const enrollment = (session.enrollment || "").trim().toLowerCase();
  const name = (session.name || "").trim().toLowerCase();
  const first = firstNameOf(session.name || "");
  return (
    volunteers.find((v) => v.id === session.volunteerId) ||
    volunteers.find((v) => v.volunteerId.toLowerCase() === key) ||
    volunteers.find((v) => enrollment && v.enrollment.toLowerCase() === enrollment) ||
    volunteers.find((v) => d.length >= 10 && digits(v.mobile).slice(-10) === d.slice(-10)) ||
    volunteers.find((v) => v.fullName.toLowerCase() === name) ||
    volunteers.find((v) => first && firstNameOf(v.fullName) === first && d.length >= 10 && digits(v.mobile).slice(-10) === d.slice(-10))
  );
}

export function dashboardPath(session: PortalSession | null) {
  if (!session) return "/login";
  if (session.role === "po" || session.role === "admin") return "/po";
  return "/volunteer";
}

export function isOfficer(session: PortalSession | null) {
  return session?.role === "po" || session?.role === "admin";
}

function bufferToB64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let str = "";
  bytes.forEach((b) => {
    str += String.fromCharCode(b);
  });
  return btoa(str).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function registerFingerprint(volunteer: Volunteer) {
  if (!window.PublicKeyCredential) {
    throw new Error("This device does not support fingerprint / Windows Hello.");
  }
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "NSS Smart Portal", id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(volunteer.id).slice(0, 32),
        name: firstNameOf(volunteer.fullName),
        displayName: volunteer.fullName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("Fingerprint was cancelled.");
  return cred.id;
}

export async function loginWithFingerprint(volunteers: Volunteer[]): Promise<LoginResult> {
  if (!window.PublicKeyCredential) {
    return { ok: false, error: "Fingerprint login is not available on this device." };
  }
  const allow = volunteers
    .filter((v) => v.webauthnId)
    .map((v) => {
      const id = v.webauthnId as string;
      const pad = id.replaceAll("-", "+").replaceAll("_", "/");
      const bin = atob(pad + "===".slice((pad.length + 3) % 4));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      return { type: "public-key" as const, id: bytes.buffer };
    });
  try {
    const cred = (await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        timeout: 60_000,
        userVerification: "required",
        allowCredentials: allow.length ? allow : undefined,
      },
    })) as PublicKeyCredential | null;
    if (!cred) return { ok: false, error: "Fingerprint was cancelled." };
    const v = volunteers.find((s) => s.webauthnId === cred.id);
    if (!v) return { ok: false, error: "Fingerprint is not linked to a volunteer on this device." };
    return { ok: true, session: toSession(v) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Fingerprint login failed.",
    };
  }
}

export { bufferToB64 };

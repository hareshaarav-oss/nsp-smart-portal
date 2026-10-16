/** Server-only staff check. Override on Vercel with NSP_PO_PASSWORD / NSP_ADMIN_PASSWORD. */

const PO_USER = process.env.NSP_PO_USERNAME?.trim() || "po";
const PO_PASS = process.env.NSP_PO_PASSWORD?.trim() || "haresh123";
const ADMIN_USER = process.env.NSP_ADMIN_USERNAME?.trim() || "admin";
const ADMIN_PASS = process.env.NSP_ADMIN_PASSWORD?.trim() || "haresh123";

export function staffSession(role: string, username: string, password: string, poName: string) {
  const user = username.trim().toLowerCase();
  const pass = password.trim();
  if (role === "admin") {
    if (user === ADMIN_USER.toLowerCase() && pass === ADMIN_PASS) {
      return { role: "admin" as const, name: poName || "Admin" };
    }
    return null;
  }
  if (user === PO_USER.toLowerCase() && pass === PO_PASS) {
    return { role: "po" as const, name: poName || "Programme Officer" };
  }
  return null;
}

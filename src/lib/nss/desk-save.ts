import { useSessionStore } from "./session";
import { useNssStore } from "./store";

export async function officerCloud(action: "set-role" | "set-status", extra: Record<string, unknown>) {
  const token = useSessionStore.getState().session?.chatToken || "";
  if (!token) throw new Error("Sign out and sign in again so this change is saved on the college roll.");
  const res = await fetch("/api/nss-cloud", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, chatToken: token, ...extra }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || !data.ok) throw new Error(data.error || "Could not save to the college roll.");
}

export async function refreshRoll() {
  const token = useSessionStore.getState().session?.chatToken || "";
  const res = await fetch("/api/nss-cloud", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "roll-sync", chatToken: token }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    private?: boolean;
    volunteers?: [];
    events?: [];
    attendance?: [];
    notices?: [];
    serviceHours?: number;
    visitors?: number;
    degraded?: boolean;
    brand?: { poPhoto?: string; principalPhoto?: string };
  };
  if (!res.ok || !data.ok || data.degraded) return false;
  useNssStore.getState().applyCloud({
    volunteers: data.volunteers,
    events: data.events,
    attendance: data.attendance,
    notices: data.notices,
    serviceHours: data.serviceHours,
    visitors: data.visitors,
    keepPrivate: Boolean(data.private),
    degraded: Boolean(data.degraded),
    brand: data.brand,
  });
  return true;
}


import { useSessionStore } from "./session";
import { useNssStore } from "./store";
import { cloudPost } from "./dual-store";

export async function officerCloud(action: "set-role" | "set-status", extra: Record<string, unknown>) {
  const token = useSessionStore.getState().session?.chatToken || "";
  if (!token) throw new Error("Sign out and sign in again so this change is saved on the college roll.");
  const result = await cloudPost({ action, chatToken: token, ...extra });
  if (!result.ok) {
    throw new Error(
      result.queued
        ? "Saved on this device. The college roll will update when the internet is back."
        : result.error || "Could not save to the college roll.",
    );
  }
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


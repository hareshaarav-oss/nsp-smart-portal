import { useSessionStore } from "./session";

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

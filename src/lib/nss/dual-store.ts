const DB_NAME = "nsp-dual-v1";
const STORE = "kv";
const MIRROR_KEY = "portal";
const OUTBOX_KEY = "outbox";
const FALLBACK_OUTBOX = "nsp-cloud-outbox";

type OutboxItem = {
  id: string;
  at: number;
  body: Record<string, unknown>;
  tries: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function dbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function mirrorPortal(json: string) {
  try {
    const db = await openDb();
    await dbPut(db, MIRROR_KEY, json);
    db.close();
  } catch {
    /* localStorage remains the other copy */
  }
}

export async function readPortalMirror(): Promise<string | null> {
  try {
    const db = await openDb();
    const value = await dbGet<string>(db, MIRROR_KEY);
    db.close();
    return typeof value === "string" && value.length > 2 ? value : null;
  } catch {
    return null;
  }
}

async function readOutbox(): Promise<OutboxItem[]> {
  try {
    const db = await openDb();
    const value = await dbGet<OutboxItem[]>(db, OUTBOX_KEY);
    db.close();
    if (Array.isArray(value)) return value;
  } catch {
    /* fall through */
  }
  try {
    const raw = JSON.parse(localStorage.getItem(FALLBACK_OUTBOX) || "[]") as unknown;
    return Array.isArray(raw) ? (raw as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

async function writeOutbox(items: OutboxItem[]) {
  const next = items.slice(-80);
  try {
    const db = await openDb();
    await dbPut(db, OUTBOX_KEY, next);
    db.close();
  } catch {
    /* the localStorage copy below still holds the queue */
  }
  try {
    localStorage.setItem(FALLBACK_OUTBOX, JSON.stringify(next.slice(-40)));
  } catch {
    /* private mode */
  }
}

export async function outboxCount() {
  return (await readOutbox()).length;
}

export async function enqueueCloud(body: Record<string, unknown>) {
  const item: OutboxItem = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    body,
    tries: 0,
  };
  const items = await readOutbox();
  await writeOutbox([...items, item]);
}

export async function cloudPost(body: Record<string, unknown>): Promise<{ ok: boolean; queued: boolean; error?: string }> {
  try {
    const res = await fetch("/api/nss-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || data.ok === false) {
      if (res.status >= 500 || res.status === 429 || res.status === 0) {
        await enqueueCloud(body);
        return { ok: false, queued: true, error: data.error };
      }
      return { ok: false, queued: false, error: data.error || `Could not save (${res.status})` };
    }
    return { ok: true, queued: false };
  } catch {
    await enqueueCloud(body);
    return { ok: false, queued: true };
  }
}

export async function flushCloudOutbox(): Promise<number> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return 0;
  const items = await readOutbox();
  if (!items.length) return 0;
  const kept: OutboxItem[] = [];
  let sent = 0;
  for (const item of items) {
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (!res.ok) throw new Error(String(res.status));
      sent += 1;
    } catch {
      kept.push({ ...item, tries: item.tries + 1 });
    }
  }
  await writeOutbox(kept.filter((item) => item.tries < 12));
  return sent;
}

let started = false;

export function startDualSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  void flushCloudOutbox();
  window.addEventListener("online", () => {
    void flushCloudOutbox();
  });
  window.setInterval(() => {
    void flushCloudOutbox();
  }, 60_000);
}

const DB_NAME = "nsp-media-v1";
const STORE = "files";
const HD_EDGE = 1920;
const PHOTO_QUALITY = 0.88;
const VIDEO_MAX_BYTES = 80 * 1024 * 1024;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putMedia(key: string, blob: Blob) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getMedia(key: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return blob;
  } catch {
    return null;
  }
}

export async function deleteMedia(key: string) {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("compress failed"))), "image/jpeg", quality);
  });
}

export async function compressImageFile(file: File, maxEdge = HD_EDGE, quality = PHOTO_QUALITY) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await canvasToJpeg(canvas, quality);
  return { blob, width, height };
}

async function drawJpeg(source: CanvasImageSource, sw: number, sh: number, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(sw, sh, 1));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  const blob = await canvasToJpeg(canvas, quality);
  return { blob, width, height };
}

export async function compressHdPhoto(file: File, maxEdge = 1080) {
  if (file.size > 40 * 1024 * 1024) throw new Error("Photograph is over 40 MB.");
  const url = URL.createObjectURL(file);
  let bitmap: ImageBitmap | null = null;
  let image: HTMLImageElement | null = null;
  try {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not read that photograph. Try a JPG or PNG."));
        img.src = url;
      });
    }
    const source = (bitmap ?? image) as CanvasImageSource;
    const sw = bitmap ? bitmap.width : image?.naturalWidth || 1;
    const sh = bitmap ? bitmap.height : image?.naturalHeight || 1;
    let edge = maxEdge;
    let quality = 0.86;
    let result = await drawJpeg(source, sw, sh, edge, quality);
    for (let i = 0; i < 5 && result.blob.size > 260000; i += 1) {
      quality = Math.max(0.6, quality - 0.07);
      if (result.blob.size > 500000) edge = Math.round(edge * 0.82);
      result = await drawJpeg(source, sw, sh, edge, quality);
    }
    return result;
  } finally {
    bitmap?.close();
    URL.revokeObjectURL(url);
  }
}

export function rememberPhoto(keys: string[], photoUrl: string) {
  if (!photoUrl.startsWith("data:image/") && !photoUrl.startsWith("https://")) return;
  try {
    const raw = localStorage.getItem("nsp-photo-map-v2");
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    for (const key of keys) {
      const id = key.trim();
      if (id) map[id] = photoUrl;
    }
    localStorage.setItem("nsp-photo-map-v2", JSON.stringify(map));
  } catch {
    /* the phone is full; the college roll still keeps the photograph */
  }
}

export async function compressPortrait(file: File) {
  return compressHdPhoto(file, 1080);
}

export async function compressPassport(file: File) {
  return compressHdPhoto(file, 1080);
}

export async function compressCardPhoto(file: File) {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    let edge = 140;
    let quality = 0.55;
    let result = await drawJpeg(bitmap, bitmap.width, bitmap.height, edge, quality);
    for (let i = 0; i < 6 && result.blob.size > 4200; i += 1) {
      edge = Math.max(64, Math.round(edge * 0.82));
      quality = Math.max(0.38, quality - 0.05);
      result = await drawJpeg(bitmap, bitmap.width, bitmap.height, edge, quality);
    }
    return result;
  } finally {
    bitmap?.close();
  }
}

export async function videoPoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };
    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.4, (video.duration || 1) / 4);
      } catch {
        resolve(null);
        cleanup();
      }
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        const scale = Math.min(1, 1280 / Math.max(w, h));
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          cleanup();
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve(blob);
          cleanup();
        }, "image/jpeg", 0.82);
      } catch {
        resolve(null);
        cleanup();
      }
    };
    video.onerror = () => {
      resolve(null);
      cleanup();
    };
    video.src = url;
  });
}

export function assertVideoSize(file: File) {
  if (file.size > VIDEO_MAX_BYTES) {
    throw new Error("Video is over 80 MB. Please compress it first, then upload.");
  }
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function folderName(eventName: string) {
  return eventName.trim() || "General";
}


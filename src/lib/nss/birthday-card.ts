import { birthdayWish, groupsForGender } from "./whatsapp";
import type { PortalSettings, Volunteer } from "./types";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (/^https?:/i.test(src)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("photo"));
    image.src = src;
  });
}

function initials(name: string) {
  const parts = name.split(" ").filter((part) => part.length > 1 && !part.endsWith("."));
  return (parts.slice(-2).map((part) => part[0]).join("") || "NSS").toUpperCase();
}

function fitLine(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function roundPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function balloon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.72, r, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.22, y - r * 0.32, r * 0.16, r * 0.26, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 7, y + r - 2);
  ctx.lineTo(x + 7, y + r - 2);
  ctx.lineTo(x, y + r + 14);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.strokeStyle = "rgba(19,41,75,0.28)";
  ctx.lineWidth = 2;
  ctx.moveTo(x, y + r + 14);
  ctx.bezierCurveTo(x + 28, y + r + 70, x - 22, y + r + 120, x + 6, y + r + 180);
  ctx.stroke();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.beginPath();
  for (let i = 0; i < 4; i += 1) {
    const point = (Math.PI / 2) * i - Math.PI / 2;
    const inner = point + Math.PI / 4;
    ctx.lineTo(x + Math.cos(point) * r, y + Math.sin(point) * r);
    ctx.lineTo(x + Math.cos(inner) * r * 0.36, y + Math.sin(inner) * r * 0.36);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function cake(ctx: CanvasRenderingContext2D, cx: number, base: number) {
  ctx.beginPath();
  ctx.ellipse(cx, base + 10, 230, 24, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#E7D3B8";
  ctx.fill();

  roundPath(ctx, cx - 180, base - 96, 360, 96, 16);
  ctx.fillStyle = "#13294B";
  ctx.fill();
  ctx.fillStyle = "#F6E7D4";
  ctx.fillRect(cx - 180, base - 96, 360, 20);
  ctx.fillStyle = "#F6E7D4";
  for (let x = cx - 156; x <= cx + 140; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, base - 76);
    ctx.quadraticCurveTo(x + 16, base - 36, x + 32, base - 76);
    ctx.closePath();
    ctx.fill();
  }

  roundPath(ctx, cx - 120, base - 186, 240, 92, 16);
  ctx.fillStyle = "#C45C26";
  ctx.fill();
  ctx.fillStyle = "#F3D3A1";
  ctx.fillRect(cx - 120, base - 186, 240, 18);

  for (const dx of [-46, 0, 46]) {
    ctx.fillStyle = dx === 0 ? "#F6F1E7" : "#1B5E3B";
    ctx.fillRect(cx + dx - 5, base - 236, 10, 52);
    ctx.beginPath();
    ctx.ellipse(cx + dx, base - 248, 8, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#F2C14E";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + dx, base - 246, 3, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#FFF8DE";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(cx - 70, base - 150, 10, 0, Math.PI * 2);
  ctx.arc(cx + 70, base - 150, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#9E2A2B";
  ctx.fill();
}

const CONFETTI: [number, number, string, number][] = [
  [70, 80, "#C45C26", 0.4],
  [160, 48, "#13294B", -0.3],
  [250, 110, "#1B5E3B", 0.6],
  [820, 60, "#C45C26", -0.5],
  [930, 120, "#E4B15A", 0.3],
  [990, 70, "#13294B", 0.2],
  [40, 700, "#E4B15A", 0.8],
  [1040, 760, "#C45C26", -0.6],
  [80, 1180, "#1B5E3B", 0.2],
  [1000, 1240, "#E4B15A", -0.4],
];

async function warmFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.race([
    Promise.all([
      document.fonts.load("700 72px Fraunces"),
      document.fonts.load('700 40px "Noto Sans Gujarati"'),
    ]),
    new Promise((resolve) => window.setTimeout(resolve, 900)),
  ]);
}

export async function renderBirthdayCard(opts: { name: string; photoUrl?: string; college: string }) {
  await warmFonts();
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1520;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the birthday card.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const sky = ctx.createLinearGradient(0, 0, 0, 1520);
  sky.addColorStop(0, "#FFF8EF");
  sky.addColorStop(0.45, "#F8E2CC");
  sky.addColorStop(1, "#F3D0B4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1080, 1520);

  const glow = ctx.createRadialGradient(540, 620, 40, 540, 620, 420);
  glow.addColorStop(0, "rgba(255,255,255,0.85)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 1520);

  for (const [x, y, color, tilt] of CONFETTI) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.fillStyle = color;
    ctx.fillRect(-8, -16, 16, 32);
    ctx.restore();
  }

  balloon(ctx, 150, 250, 78, "#C45C26");
  balloon(ctx, 78, 430, 52, "#13294B");
  balloon(ctx, 210, 470, 40, "#1B5E3B");
  balloon(ctx, 930, 230, 74, "#9E2A2B");
  balloon(ctx, 1004, 410, 50, "#E4B15A");
  balloon(ctx, 860, 470, 36, "#13294B");
  star(ctx, 300, 180, 16, "#E4B15A");
  star(ctx, 780, 160, 14, "#C45C26");
  star(ctx, 250, 560, 12, "#1B5E3B");
  star(ctx, 830, 560, 12, "#E4B15A");

  ctx.textAlign = "center";
  ctx.fillStyle = "#1B5E3B";
  ctx.font = "600 26px Fraunces, Georgia, serif";
  ctx.fillText("NSS SMART PORTAL", 540, 118);
  ctx.fillStyle = "#13294B";
  ctx.font = "700 78px Fraunces, Georgia, serif";
  ctx.fillText("Happy Birthday", 540, 200);

  const cx = 540;
  const cy = 560;
  const radius = 210;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 22, 0, Math.PI * 2);
  ctx.fillStyle = "#E4B15A";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
  ctx.fillStyle = "#FFF8EF";
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  let drew = false;
  if (opts.photoUrl) {
    try {
      const image = await loadImage(opts.photoUrl);
      const scale = Math.max((radius * 2) / image.width, (radius * 2) / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      ctx.drawImage(image, cx - width / 2, cy - height / 2, width, height);
      drew = true;
    } catch {
      drew = false;
    }
  }
  if (!drew) {
    ctx.fillStyle = "#13294B";
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = "#FFF8EF";
    ctx.font = "700 140px Fraunces, Georgia, serif";
    ctx.textBaseline = "middle";
    ctx.fillText(initials(opts.name), cx, cy);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  ctx.fillStyle = "#13294B";
  let size = 64;
  ctx.font = `700 ${size}px Fraunces, Georgia, serif`;
  while (size > 36 && ctx.measureText(opts.name).width > 920) {
    size -= 2;
    ctx.font = `700 ${size}px Fraunces, Georgia, serif`;
  }
  const nameLines = fitLine(ctx, opts.name, 920);
  nameLines.forEach((line, index) => ctx.fillText(line, 540, 860 + index * (size + 6)));

  const afterName = 860 + nameLines.length * (size + 6) + 8;
  ctx.fillStyle = "#9E2A2B";
  ctx.font = '700 40px "Noto Sans Gujarati", sans-serif';
  ctx.fillText("હાર્દિક જન્મદિવસની શુભેચ્છાઓ", 540, afterName);
  ctx.font = '600 28px "Noto Sans Gujarati", sans-serif';
  ctx.fillStyle = "#1B5E3B";
  ctx.fillText("NSS પરિવાર તરફથી", 540, afterName + 46);
  ctx.font = "600 24px Fraunces, Georgia, serif";
  ctx.fillStyle = "#13294B";
  ctx.fillText("Not Me, But You", 540, afterName + 92);

  cake(ctx, 540, 1368);

  ctx.font = '500 24px "Source Sans 3", "Noto Sans Gujarati", sans-serif';
  ctx.fillStyle = "#5C5348";
  const collegeLines = fitLine(ctx, opts.college || "NSS Unit", 860);
  collegeLines.forEach((line, index) => ctx.fillText(line, 540, 1436 + index * 26));

  ctx.fillStyle = "#C45C26";
  ctx.fillRect(0, 1484, 1080, 12);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 1496, 1080, 8);
  ctx.fillStyle = "#138808";
  ctx.fillRect(0, 1504, 1080, 16);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((file) => (file ? resolve(file) : reject(new Error("Could not save the card."))), "image/png");
  });
  return blob;
}

const readyCards = new Map<string, File>();

function cardKey(volunteer: Volunteer, college: string) {
  return `${volunteer.id}|${volunteer.fullName}|${volunteer.photoUrl?.length || 0}|${college}`;
}

export function cachedBirthdayCard(volunteer: Volunteer, college: string) {
  return readyCards.get(cardKey(volunteer, college));
}

export async function birthdayCardFile(volunteer: Volunteer, college: string) {
  const key = cardKey(volunteer, college);
  const hit = readyCards.get(key);
  if (hit) return hit;
  const blob = await renderBirthdayCard({
    name: volunteer.fullName,
    photoUrl: volunteer.photoUrl,
    college,
  });
  const file = new File([blob], `nss-birthday-${volunteer.volunteerId || "wish"}.png`, { type: "image/png" });
  readyCards.set(key, file);
  return file;
}

export type WishMode = "shared" | "opened" | "cancelled";

function downloadFile(file: File) {
  const href = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = href;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 4000);
}

function canShareFiles(files: File[]) {
  if (typeof navigator.share !== "function" || !files.length) return false;
  if (!navigator.canShare) return true;
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

export function shareReadyCards(files: File[], text: string, groupUrl?: string): Promise<WishMode> {
  const pack = files.slice(0, 8);
  const share = (chosen: File[]) =>
    navigator.share({ files: chosen, text, title: "NSS birthday" }).then(
      () => "shared" as const,
      (error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return "cancelled" as const;
        return openGroupFallback(pack, text, groupUrl);
      },
    );
  if (canShareFiles(pack)) return share(pack);
  if (pack.length > 1 && canShareFiles(pack.slice(0, 1))) {
    pack.slice(1).forEach(downloadFile);
    return share(pack.slice(0, 1));
  }
  return openGroupFallback(pack, text, groupUrl);
}

function openGroupFallback(files: File[], text: string, groupUrl?: string): Promise<WishMode> {
  files.forEach(downloadFile);
  const dest = groupUrl || `https://wa.me/?text=${encodeURIComponent(text.slice(0, 1800))}`;
  window.open(dest, "_blank", "noopener,noreferrer");
  void navigator.clipboard?.writeText(text).catch(() => undefined);
  return Promise.resolve("opened");
}

export async function sendBirthdayWish(volunteer: Volunteer, settings: PortalSettings, template: string) {
  const file = await birthdayCardFile(volunteer, settings.collegeName);
  const text = birthdayWish(volunteer.fullName, template);
  const group = volunteer.gender === "Female" || volunteer.gender === "Male" ? groupsForGender(settings, volunteer.gender)[0] : undefined;
  return shareReadyCards([file], text, group?.url);
}

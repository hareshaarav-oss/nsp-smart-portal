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

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number, limit = 5) {
  const words = text.split(/\s+/).filter(Boolean);
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
  return lines.slice(0, limit);
}

function givenName(fullName: string) {
  const part = fullName
    .trim()
    .split(/\s+/)
    .find((token) => token.length > 1 && !token.endsWith(".")) || fullName.trim() || "Friend";
  const lower = part.toLocaleLowerCase("en-IN");
  return lower.charAt(0).toLocaleUpperCase("en-IN") + lower.slice(1);
}

function posterWords(role: string, name: string) {
  const leader = role !== "Volunteer";
  return {
    leader,
    badge: leader ? "NSS LEADER" : "NSS VOLUNTEER",
    dream: leader ? ["Dream Big...", "Lead Strong...", "Serve Society..."] : ["Dream Big...", "Serve with Heart...", "Not Me, But You..."],
    yellow: leader
      ? "Your dedication, leadership, positive attitude and spirit of social service make you truly special."
      : "Your kindness, discipline and spirit of social service make you truly special.",
    body: leader
      ? "As an NSS Leader, may you continue to inspire others, lead with compassion and create meaningful change in society."
      : "As an NSS volunteer, may you keep learning, helping others and standing beside people who need a hand.",
    blue: "Keep dreaming big, keep serving humanity and keep spreading smiles, wherever you go.",
    pink: "May you achieve greater heights and make your family, institution and NSS proud!",
    foot: leader
      ? `Happy Birthday, ${name}!  Keep Shining, Keep Leading, Keep Inspiring!`
      : `Happy Birthday, ${name}!  Keep Shining, Keep Serving, Keep Inspiring!`,
  };
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-16, -4, -8, -18, 0, -8);
  ctx.bezierCurveTo(8, -18, 16, -4, 0, 8);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function nssSeal(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#0C3C86";
  ctx.fill();
  ctx.lineWidth = r * 0.08;
  ctx.strokeStyle = "#F4C430";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.58, 0, Math.PI * 2);
  ctx.fillStyle = "#E10600";
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(3, r * 0.07);
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * r * 0.5, y + Math.sin(angle) * r * 0.5);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, r * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = "#0C3C86";
  ctx.fill();
}

function rose(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 7; i += 1) {
    const angle = (Math.PI * 2 * i) / 7;
    ctx.beginPath();
    ctx.ellipse(Math.cos(angle) * r * 0.38, Math.sin(angle) * r * 0.32, r * 0.46, r * 0.3, angle, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fill();
  ctx.restore();
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#2E7D32";
  ctx.fill();
  ctx.restore();
}

function cake(ctx: CanvasRenderingContext2D, cx: number, base: number, flicker: number) {
  ctx.beginPath();
  ctx.ellipse(cx, base + 18, 210, 22, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#F3E6D4";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, base + 18, 210, 22, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#E7D3B0";
  ctx.lineWidth = 3;
  ctx.stroke();

  roundPath(ctx, cx - 168, base - 150, 336, 160, 18);
  ctx.fillStyle = "#FFF9F2";
  ctx.fill();
  ctx.save();
  roundPath(ctx, cx - 168, base - 150, 336, 160, 18);
  ctx.clip();
  ctx.fillStyle = "#5D4037";
  ctx.beginPath();
  ctx.moveTo(cx - 180, base - 150);
  ctx.lineTo(cx + 180, base - 150);
  ctx.lineTo(cx + 180, base - 112);
  for (let x = cx + 160; x >= cx - 180; x -= 28) {
    ctx.quadraticCurveTo(x - 8, base - 70, x - 18, base - 112);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#4E342E";
  for (let x = cx - 150; x < cx + 150; x += 22) {
    ctx.beginPath();
    ctx.ellipse(x, base - 28, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  roundPath(ctx, cx - 78, base - 118, 156, 46, 24);
  ctx.fillStyle = "#FFF6E8";
  ctx.fill();
  ctx.strokeStyle = "#E7C9A4";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#5D4037";
  ctx.font = '700 18px "Dancing Script", cursive';
  ctx.textAlign = "center";
  ctx.fillText("Happy Birthday", cx, base - 88);
  heart(ctx, cx + 78, base - 108, 0.7, "#E31C79");

  const candles: [number, string][] = [[-54, "#BA68C8"], [-18, "#FFD54F"], [18, "#81C784"], [54, "#F48FB1"]];
  for (const [dx, color] of candles) {
    ctx.fillStyle = color;
    ctx.fillRect(cx + dx - 5, base - 176, 10, 58);
    const flame = 16 + Math.sin(flicker * 9 + dx) * 3;
    ctx.beginPath();
    ctx.ellipse(cx + dx, base - 184 - flame / 2, 7, flame / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#FFB300";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + dx, base - 180 - flame / 3, 3, flame / 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#FFF8E1";
    ctx.fill();
  }
}

function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export function drawBirthdayPoster(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement | null,
  fullName: string,
  role: string,
  college: string,
  flicker = 0,
) {
  const name = givenName(fullName);
  const copy = posterWords(role, name);
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "alphabetic";

  const paper = ctx.createLinearGradient(0, 0, W, H);
  paper.addColorStop(0, "#FFF9F4");
  paper.addColorStop(1, "#FFF3E8");
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);

  const night = ctx.createLinearGradient(0, 0, 0, H);
  night.addColorStop(0, "#1A237E");
  night.addColorStop(0.55, "#311B72");
  night.addColorStop(1, "#0D2C5A");
  ctx.fillStyle = night;
  ctx.fillRect(0, 0, 640, H);
  const lights: [number, number, number, string][] = [
    [90, 80, 46, "rgba(255,224,130,0.85)"],
    [240, 40, 28, "rgba(255,255,255,0.7)"],
    [420, 110, 36, "rgba(244,143,177,0.75)"],
    [70, 260, 22, "rgba(255,255,255,0.55)"],
    [520, 200, 30, "rgba(255,213,79,0.7)"],
    [180, 520, 40, "rgba(129,212,250,0.35)"],
    [40, 700, 26, "rgba(255,183,77,0.6)"],
  ];
  for (const [x, y, r, color] of lights) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  roundPath(ctx, 36, 150, 560, 760, 36);
  ctx.clip();
  if (photo) {
    cover(ctx, photo, 36, 150, 560, 760);
  } else {
    ctx.fillStyle = "#13294B";
    ctx.fillRect(36, 150, 560, 760);
    ctx.fillStyle = "#FFF8EF";
    ctx.font = "700 160px Fraunces, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(initials(fullName), 316, 560);
  }
  const fade = ctx.createLinearGradient(430, 0, 620, 0);
  fade.addColorStop(0, "rgba(255,249,244,0)");
  fade.addColorStop(1, "rgba(255,249,244,1)");
  ctx.fillStyle = fade;
  ctx.fillRect(400, 150, 220, 760);
  ctx.restore();

  const wash = ctx.createRadialGradient(820, 180, 20, 820, 220, 340);
  wash.addColorStop(0, "rgba(144,202,249,0.55)");
  wash.addColorStop(1, "rgba(144,202,249,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(520, 0, 560, 520);

  ctx.save();
  ctx.translate(58, 78);
  ctx.rotate(-0.12);
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.font = '700 34px "Dancing Script", cursive';
  copy.dream.forEach((line, index) => ctx.fillText(line, 0, index * 40));
  ctx.strokeStyle = "#F5C542";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(8, 118);
  ctx.quadraticCurveTo(90, 108, 168, 122);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "left";
  ctx.fillStyle = "#D4145A";
  ctx.font = '700 92px "Dancing Script", cursive';
  ctx.fillText("Happy", 600, 150);
  heart(ctx, 980, 92, 1.35, "#E31C79");
  ctx.fillStyle = "#7B1FA2";
  ctx.font = '700 108px "Dancing Script", cursive';
  ctx.fillText("Birthday", 560, 250);
  ctx.strokeStyle = "#F5C542";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(620, 268);
  ctx.quadraticCurveTo(820, 250, 1000, 274);
  ctx.stroke();

  let nameSize = 96;
  ctx.textAlign = "center";
  ctx.fillStyle = "#1565C0";
  ctx.font = `700 ${nameSize}px "Dancing Script", cursive`;
  while (nameSize > 54 && ctx.measureText(name).width > 460) {
    nameSize -= 4;
    ctx.font = `700 ${nameSize}px "Dancing Script", cursive`;
  }
  ctx.fillText(name, 820, 360);
  ctx.strokeStyle = "#F48FB1";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(640, 378);
  ctx.quadraticCurveTo(820, 360, 1000, 382);
  ctx.stroke();

  ctx.fillStyle = "#9E2A2B";
  ctx.font = '700 26px "Noto Sans Gujarati", sans-serif';
  ctx.fillText("હાર્દિક જન્મદિવસની શુભેચ્છાઓ", 820, 418);

  nssSeal(ctx, 630, 500, 62);
  ctx.save();
  ctx.translate(700, 468);
  ctx.rotate(-0.04);
  roundPath(ctx, 0, 0, 340, 70, 16);
  ctx.fillStyle = "#0D47A1";
  ctx.fill();
  ctx.fillStyle = "#FFE14A";
  let badgeSize = 34;
  ctx.font = `800 ${badgeSize}px Fraunces, Georgia, serif`;
  while (badgeSize > 22 && ctx.measureText(copy.badge).width > 300) {
    badgeSize -= 2;
    ctx.font = `800 ${badgeSize}px Fraunces, Georgia, serif`;
  }
  ctx.textAlign = "center";
  ctx.fillText(copy.badge, 170, 48);
  ctx.restore();

  ctx.textAlign = "left";
  ctx.font = '600 26px "Source Sans 3", sans-serif';
  const lead = "Wishing you a very ";
  const leadWidth = ctx.measureText(lead).width;
  ctx.font = '700 26px "Source Sans 3", sans-serif';
  const cheer = "Happy Birthday!";
  const cheerWidth = ctx.measureText(cheer).width;
  const wishStart = 820 - (leadWidth + cheerWidth) / 2;
  ctx.font = '600 26px "Source Sans 3", sans-serif';
  ctx.fillStyle = "#1A1A1A";
  ctx.fillText(lead, wishStart, 590);
  ctx.font = '700 26px "Source Sans 3", sans-serif';
  ctx.fillStyle = "#E31C23";
  ctx.fillText(cheer, wishStart + leadWidth, 590);
  ctx.textAlign = "center";
  ctx.fillStyle = "#263238";
  ctx.font = '500 24px "Source Sans 3", sans-serif';
  const shine = wrap(ctx, "May your life always shine with happiness, success and endless opportunities.", 440, 2);
  shine.forEach((line, index) => ctx.fillText(line, 820, 634 + index * 30));

  const yellowTop = 646 + shine.length * 30;
  ctx.save();
  ctx.translate(590, yellowTop);
  ctx.rotate(-0.02);
  roundPath(ctx, 0, 0, 460, 108, 24);
  ctx.fillStyle = "#FFF3B0";
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#E31C23";
  ctx.font = "700 20px Fraunces, Georgia, serif";
  ctx.fillText("★", 620, yellowTop + 36);
  ctx.fillText("★", 1020, yellowTop + 84);
  ctx.fillStyle = "#1A1A1A";
  ctx.font = '700 21px "Source Sans 3", sans-serif';
  const yellow = wrap(ctx, copy.yellow, 400, 3);
  yellow.forEach((line, index) => ctx.fillText(line, 820, yellowTop + 34 + index * 24));

  let y = yellowTop + 124;
  ctx.fillStyle = "#263238";
  ctx.font = '500 22px "Source Sans 3", sans-serif';
  const body = wrap(ctx, copy.body, 450, 3);
  body.forEach((line, index) => ctx.fillText(line, 820, y + index * 28));
  y += body.length * 28 + 14;

  ctx.save();
  ctx.translate(580, y);
  ctx.rotate(-0.03);
  roundPath(ctx, 0, 0, 470, 100, 20);
  ctx.fillStyle = "#1565C0";
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#FFF176";
  ctx.font = '700 26px "Dancing Script", cursive';
  const blue = wrap(ctx, copy.blue, 420, 3);
  blue.forEach((line, index) => ctx.fillText(line, 815, y + 36 + index * 28));
  y += 114;

  ctx.save();
  ctx.translate(590, y);
  ctx.rotate(-0.02);
  roundPath(ctx, 0, 0, 460, 78, 18);
  ctx.fillStyle = "#F48FB1";
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#1A1A1A";
  ctx.font = '700 21px "Source Sans 3", sans-serif';
  const pink = wrap(ctx, copy.pink, 420, 2);
  pink.forEach((line, index) => ctx.fillText(line, 820, y + 32 + index * 24));
  y += 92;

  const footTop = Math.min(y, H - 118);
  roundPath(ctx, 560, footTop, 490, 86, 18);
  ctx.fillStyle = "#6A1B9A";
  ctx.fill();
  ctx.fillStyle = "#FFF176";
  ctx.font = '700 22px "Source Sans 3", sans-serif';
  const foot = wrap(ctx, copy.foot, 450, 2);
  foot.forEach((line, index) => ctx.fillText(line, 805, footTop + 34 + index * 26));

  ctx.fillStyle = "rgba(255,249,244,0.92)";
  ctx.font = '600 18px "Source Sans 3", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText((college || "NSS Unit").slice(0, 42), 40, H - 22);

  for (const [x, yy, rot] of [[120, 980, -0.6], [230, 900, 0.4], [80, 860, 0.8], [430, 940, -0.2]] as [number, number, number][]) {
    leaf(ctx, x, yy, rot);
  }
  rose(ctx, 150, 930, 42, "#E53935");
  rose(ctx, 250, 900, 36, "#F48FB1");
  rose(ctx, 90, 1000, 30, "#AD1457");
  rose(ctx, 340, 980, 34, "#C62828");
  rose(ctx, 200, 1040, 24, "#F8BBD0");
  cake(ctx, 250, 1240, flicker);
}

async function warmFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.race([
    Promise.all([
      document.fonts.load('700 108px "Dancing Script"'),
      document.fonts.load("700 40px Fraunces"),
      document.fonts.load('700 26px "Noto Sans Gujarati"'),
      document.fonts.load('600 24px "Source Sans 3"'),
    ]),
    new Promise((resolve) => window.setTimeout(resolve, 1200)),
  ]);
}

export async function renderBirthdayCard(opts: { name: string; photoUrl?: string; college: string; role?: string }) {
  await warmFonts();
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the birthday card.");
  let photo: HTMLImageElement | null = null;
  if (opts.photoUrl) photo = await loadImage(opts.photoUrl).catch(() => null);
  drawBirthdayPoster(ctx, photo, opts.name, opts.role || "Volunteer", opts.college, 0.4);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((file) => (file ? resolve(file) : reject(new Error("Could not save the card."))), "image/png");
  });
  return blob;
}

const readyCards = new Map<string, File>();

function cardKey(volunteer: Volunteer, college: string) {
  return `${volunteer.id}|${volunteer.fullName}|${volunteer.nssRole}|${volunteer.photoUrl?.length || 0}|${college}|poster`;
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
    role: volunteer.nssRole || "Volunteer",
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

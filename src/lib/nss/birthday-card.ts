import { birthdayWish, copyAndOpenGroup, groupsForGender } from "./whatsapp";
import type { PortalSettings, Volunteer } from "./types";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
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
  return lines.slice(0, 3);
}

export async function renderBirthdayCard(opts: { name: string; photoUrl?: string; college: string }) {
  await document.fonts.load("700 72px Fraunces");
  await document.fonts.load('600 36px "Noto Sans Gujarati"');
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the birthday card.");

  ctx.fillStyle = "#F6F1E7";
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = "#C45C26";
  ctx.fillRect(0, 0, 1080, 22);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 22, 1080, 10);
  ctx.fillStyle = "#138808";
  ctx.fillRect(0, 32, 1080, 10);

  ctx.textAlign = "center";
  ctx.fillStyle = "#1B5E3B";
  ctx.font = "600 28px Fraunces, Georgia, serif";
  ctx.fillText("NSS SMART PORTAL", 540, 120);
  ctx.fillStyle = "#C45C26";
  ctx.font = "700 78px Fraunces, Georgia, serif";
  ctx.fillText("Happy Birthday", 540, 210);

  const cx = 540;
  const cy = 520;
  const radius = 220;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 16, 0, Math.PI * 2);
  ctx.fillStyle = "#C45C26";
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
    ctx.fillStyle = "#F6F1E7";
    ctx.font = "700 150px Fraunces, Georgia, serif";
    ctx.textBaseline = "middle";
    ctx.fillText(initials(opts.name), cx, cy);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  ctx.fillStyle = "#13294B";
  ctx.font = "700 58px Fraunces, Georgia, serif";
  const nameLines = fitLine(ctx, opts.name, 920);
  nameLines.forEach((line, index) => ctx.fillText(line, 540, 860 + index * 68));

  const afterName = 860 + nameLines.length * 68 + 16;
  ctx.fillStyle = "#1B5E3B";
  ctx.font = '700 40px "Noto Sans Gujarati", sans-serif';
  ctx.fillText("હાર્દિક જન્મદિવસની શુભેચ્છાઓ", 540, afterName);
  ctx.font = '500 30px "Noto Sans Gujarati", sans-serif';
  ctx.fillStyle = "#6B6256";
  ctx.fillText("NSS પરિવાર તરફથી", 540, afterName + 48);
  ctx.font = "600 28px Fraunces, Georgia, serif";
  ctx.fillStyle = "#13294B";
  ctx.fillText("Not Me, But You", 540, afterName + 110);
  ctx.font = '500 24px "Source Sans 3", sans-serif';
  ctx.fillStyle = "#6B6256";
  const collegeLines = fitLine(ctx, opts.college, 900);
  collegeLines.forEach((line, index) => ctx.fillText(line, 540, afterName + 160 + index * 32));

  ctx.fillStyle = "#138808";
  ctx.fillRect(0, 1308, 1080, 10);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 1318, 1080, 10);
  ctx.fillStyle = "#C45C26";
  ctx.fillRect(0, 1328, 1080, 22);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((file) => (file ? resolve(file) : reject(new Error("Could not save the card."))), "image/png");
  });
  return blob;
}

export async function sendBirthdayWish(volunteer: Volunteer, settings: PortalSettings, template: string) {
  const text = birthdayWish(volunteer.fullName, template);
  const group = groupsForGender(settings, volunteer.gender || "")[0];
  const blob = await renderBirthdayCard({
    name: volunteer.fullName,
    photoUrl: volunteer.photoUrl,
    college: settings.collegeName,
  });
  const file = new File([blob], `birthday-${volunteer.volunteerId || "nss"}.png`, { type: "image/png" });
  const shareData = { files: [file], text, title: `Birthday · ${volunteer.fullName}` };
  if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(shareData))) {
    await navigator.share(shareData);
    return "shared" as const;
  }
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 4000);
  if (group?.url) await copyAndOpenGroup(group.url, text);
  return "opened" as const;
}

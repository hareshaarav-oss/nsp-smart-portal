import { birthdayCardFile } from "./birthday-card";
import type { Volunteer } from "./types";

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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

/** Original short jingle. Not a copied song. */
function playJingle(ctx: AudioContext, dest: MediaStreamAudioDestinationNode) {
  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(dest);
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 880, 698.46, 523.25, 659.25, 783.99, 523.25];
  const start = ctx.currentTime + 0.08;
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = index % 3 === 0 ? "sine" : "triangle";
    osc.frequency.value = freq;
    const at = start + index * 0.46;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.85, at + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.44);
    osc.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + 0.46);
  });
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement | null,
  name: string,
  college: string,
  t: number,
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#FFF8EF");
  sky.addColorStop(0.5, "#F8E2CC");
  sky.addColorStop(1, "#F3D0B4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 18; i += 1) {
    const x = ((i * 97) % w) + Math.sin(t * 6 + i) * 12;
    const y = ((i * 140 + t * h) % (h + 40)) - 20;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 4 + i);
    ctx.fillStyle = ["#C45C26", "#13294B", "#1B5E3B", "#E4B15A"][i % 4];
    ctx.fillRect(-6, -10, 12, 20);
    ctx.restore();
  }

  const balloons: [number, string, number][] = [
    [110, "#C45C26", 46],
    [210, "#13294B", 32],
    [w - 110, "#9E2A2B", 44],
    [w - 200, "#E4B15A", 30],
  ];
  for (const [x, color, r] of balloons) {
    const y = 180 + Math.sin(t * 5 + x) * 16;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.72, r, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.lineTo(x, y + r + 70 + Math.sin(t * 4) * 8);
    ctx.strokeStyle = "rgba(19,41,75,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#1B5E3B";
  ctx.font = "600 22px Fraunces, Georgia, serif";
  ctx.fillText("NSS SMART PORTAL", w / 2, 78);
  ctx.fillStyle = "#13294B";
  ctx.font = "700 54px Fraunces, Georgia, serif";
  ctx.fillText("Happy Birthday", w / 2, 140);

  const cx = w / 2;
  const cy = 430;
  const radius = 150;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 14, 0, Math.PI * 2);
  ctx.fillStyle = "#E4B15A";
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  if (photo) {
    const scale = Math.max((radius * 2) / photo.width, (radius * 2) / photo.height);
    ctx.drawImage(photo, cx - (photo.width * scale) / 2, cy - (photo.height * scale) / 2, photo.width * scale, photo.height * scale);
  } else {
    ctx.fillStyle = "#13294B";
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = "#FFF8EF";
    ctx.font = "700 92px Fraunces, Georgia, serif";
    ctx.textBaseline = "middle";
    ctx.fillText(initials(name), cx, cy);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  ctx.fillStyle = "#13294B";
  let size = 46;
  ctx.font = `700 ${size}px Fraunces, Georgia, serif`;
  while (size > 28 && ctx.measureText(name).width > w - 80) {
    size -= 2;
    ctx.font = `700 ${size}px Fraunces, Georgia, serif`;
  }
  ctx.fillText(name, w / 2, 660);
  ctx.fillStyle = "#9E2A2B";
  ctx.font = '700 32px "Noto Sans Gujarati", sans-serif';
  ctx.fillText("હાર્દિક જન્મદિવસની શુભેચ્છાઓ", w / 2, 720);
  ctx.fillStyle = "#1B5E3B";
  ctx.font = '600 24px "Noto Sans Gujarati", sans-serif';
  ctx.fillText("NSS પરિવાર તરફથી", w / 2, 762);

  const cakeY = 980 + Math.sin(t * 8) * 2;
  ctx.fillStyle = "#13294B";
  ctx.fillRect(cx - 120, cakeY, 240, 70);
  ctx.fillStyle = "#F6E7D4";
  ctx.fillRect(cx - 120, cakeY, 240, 16);
  ctx.fillStyle = "#C45C26";
  ctx.fillRect(cx - 80, cakeY - 58, 160, 58);
  for (const dx of [-36, 0, 36]) {
    const flicker = 8 + Math.sin(t * 20 + dx) * 3;
    ctx.fillStyle = "#F2C14E";
    ctx.beginPath();
    ctx.ellipse(cx + dx, cakeY - 70 - flicker / 2, 7, flicker, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#5C5348";
  ctx.font = '500 20px "Source Sans 3", "Noto Sans Gujarati", sans-serif';
  ctx.fillText(college || "NSS Unit", w / 2, 1160);
  ctx.fillStyle = "#C45C26";
  ctx.fillRect(0, h - 28, w, 8);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, h - 20, w, 6);
  ctx.fillStyle = "#138808";
  ctx.fillRect(0, h - 14, w, 14);
}

const readyVideos = new Map<string, File>();

function videoKey(volunteer: Volunteer, college: string) {
  return `${volunteer.id}|${volunteer.fullName}|${volunteer.photoUrl?.length || 0}|${college}|video`;
}

export function cachedBirthdayVideo(volunteer: Volunteer, college: string) {
  return readyVideos.get(videoKey(volunteer, college));
}

export async function birthdayVideoFile(volunteer: Volunteer, college: string) {
  const key = videoKey(volunteer, college);
  const hit = readyVideos.get(key);
  if (hit) return hit;
  if (typeof MediaRecorder === "undefined" || typeof AudioContext === "undefined") {
    return birthdayCardFile(volunteer, college);
  }
  const mime = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
  if (!mime) return birthdayCardFile(volunteer, college);

  if (document.fonts) {
    await Promise.race([
      Promise.all([document.fonts.load("700 54px Fraunces"), document.fonts.load('700 32px "Noto Sans Gujarati"')]),
      sleep(700),
    ]);
  }
  let photo: HTMLImageElement | null = null;
  if (volunteer.photoUrl) {
    photo = await loadImage(volunteer.photoUrl).catch(() => null);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d");
  if (!ctx) return birthdayCardFile(volunteer, college);
  const canvasStream = canvas.captureStream(20);
  const audio = new AudioContext();
  await audio.resume().catch(() => undefined);
  const dest = audio.createMediaStreamDestination();
  playJingle(audio, dest);
  const stream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_800_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const stopped = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
  });
  rec.start();
  const started = performance.now();
  const duration = 6200;
  while (performance.now() - started < duration) {
    drawFrame(ctx, photo, volunteer.fullName, college, (performance.now() - started) / 1000);
    await sleep(50);
  }
  rec.stop();
  canvasStream.getTracks().forEach((track) => track.stop());
  const blob = await stopped;
  await audio.close().catch(() => undefined);
  const file = new File([blob], `nss-birthday-${volunteer.volunteerId || "wish"}.webm`, { type: mime });
  readyVideos.set(key, file);
  return file;
}

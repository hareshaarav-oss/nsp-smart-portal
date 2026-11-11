import { birthdayCardFile, drawBirthdayPoster } from "./birthday-card";
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

function drawFrame(ctx: CanvasRenderingContext2D, poster: HTMLCanvasElement, t: number) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#1A237E");
  sky.addColorStop(0.5, "#311B72");
  sky.addColorStop(1, "#0D2C5A");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 16; i += 1) {
    const x = ((i * 83) % w) + Math.sin(t * 3 + i) * 10;
    const y = ((i * 160 + t * 90) % (h + 30)) - 15;
    ctx.fillStyle = ["#FFE14A", "#F48FB1", "#FFFFFF", "#81D4FA"][i % 4];
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(x, y, 3 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const scale = Math.min((w - 24) / poster.width, (h - 36) / poster.height);
  const dw = poster.width * scale;
  const dh = poster.height * scale;
  const x = (w - dw) / 2;
  const y = (h - dh) / 2 + Math.sin(t * 2) * 6;
  ctx.drawImage(poster, x, y, dw, dh);
}

const readyVideos = new Map<string, File>();

function videoKey(volunteer: Volunteer, college: string) {
  return `${volunteer.id}|${volunteer.fullName}|${volunteer.nssRole}|${volunteer.photoUrl?.length || 0}|${college}|poster-video`;
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
      Promise.all([document.fonts.load('700 80px "Dancing Script"'), document.fonts.load("700 34px Fraunces")]),
      sleep(700),
    ]);
  }
  let photo: HTMLImageElement | null = null;
  if (volunteer.photoUrl) {
    photo = await loadImage(volunteer.photoUrl).catch(() => null);
  }

  const poster = document.createElement("canvas");
  poster.width = 1080;
  poster.height = 1350;
  const posterCtx = poster.getContext("2d");
  if (!posterCtx) return birthdayCardFile(volunteer, college);
  drawBirthdayPoster(posterCtx, photo, volunteer.fullName, volunteer.nssRole || "Volunteer", college, 0.6);

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
    drawFrame(ctx, poster, (performance.now() - started) / 1000);
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

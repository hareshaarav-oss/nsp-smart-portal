import { BIRTHDAY_TEMPLATE, WA_BOYS, WA_GIRLS, WA_LEADERS } from "./constants";
import { waPhone } from "./format";
import type { Audience, PortalSettings, Volunteer } from "./types";

export function fillTemplate(template: string, name: string) {
  return template.replaceAll("{{NAME}}", name.trim().toUpperCase());
}

export function birthdayWish(name: string, template = BIRTHDAY_TEMPLATE) {
  return fillTemplate(template, name);
}

export function whatsappHref(mobile: string, text: string) {
  const phone = waPhone(mobile);
  const encoded = encodeURIComponent(text);
  if (!phone) return `https://wa.me/?text=${encoded}`;
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function openWhatsApp(mobile: string, text: string) {
  const href = whatsappHref(mobile, text);
  window.open(href, "_blank", "noopener,noreferrer");
}

export function noticeBroadcastText(title: string, body: string, college: string) {
  return `*NSS NOTICE*\n${college}\n\n*${title}*\n\n${body}\n\n— NSS Smart Portal`;
}

export function eventBroadcastText(name: string, date: string, location: string, extra: string) {
  return `*NSS EVENT*\n\n*${name}*\nDate: ${date}\nPlace: ${location}\n\n${extra}\n\n— NSS Unit, Mansa`;
}

export function pressBroadcastText(opts: {
  eventName: string;
  date: string;
  location: string;
  description: string;
  present: number;
  hours: number;
  college: string;
  poName: string;
}) {
  return `*NSS PRESS NOTE*\n${opts.college}\n\n*${opts.eventName}*\nDate: ${opts.date}\nPlace: ${opts.location}\n\n${opts.description}\n\nVolunteers present: ${opts.present}\nService hours: ${opts.hours}\n\n— ${opts.poName}\nNSS Programme Officer`;
}

export function audienceLabel(audience: Audience | undefined) {
  if (audience === "girls") return "Girls";
  if (audience === "boys") return "Boys";
  if (audience === "leaders") return "Leaders";
  return "All";
}

export function audienceRecipients(volunteers: Volunteer[], audience: Audience | undefined) {
  const list = volunteers.filter((v) => v.status !== "alumni");
  if (audience === "girls") return list.filter((v) => v.gender === "Female");
  if (audience === "boys") return list.filter((v) => v.gender === "Male");
  if (audience === "leaders") return list.filter((v) => v.nssRole === "Leader");
  return list;
}

export type WaGroup = { id: "girls" | "boys" | "leaders"; label: string; url: string };

export function groupLinks(settings: PortalSettings): WaGroup[] {
  return [
    { id: "girls", label: "Girls group", url: settings.waGirls || WA_GIRLS },
    { id: "boys", label: "Boys group", url: settings.waBoys || WA_BOYS },
    { id: "leaders", label: "Leaders group", url: settings.waLeaders || WA_LEADERS },
  ];
}

export function groupsForAudience(settings: PortalSettings, audience: Audience | undefined): WaGroup[] {
  const all = groupLinks(settings);
  if (audience === "girls") return all.filter((g) => g.id === "girls");
  if (audience === "boys") return all.filter((g) => g.id === "boys");
  if (audience === "leaders") return all.filter((g) => g.id === "leaders");
  return all.filter((g) => g.id === "girls" || g.id === "boys");
}

export function groupsForGender(settings: PortalSettings, gender: string): WaGroup[] {
  if (gender === "Female") return groupsForAudience(settings, "girls");
  if (gender === "Male") return groupsForAudience(settings, "boys");
  return groupsForAudience(settings, "all");
}

export async function copyAndOpenGroup(url: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* clipboard may be blocked */
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

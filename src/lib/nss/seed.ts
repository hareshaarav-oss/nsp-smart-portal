import type {
  GalleryItem,
  IssuedCertificate,
  NssEvent,
  Notice,
  PortalState,
  Volunteer,
} from "./types";
import { DEFAULT_SETTINGS } from "./constants";

/** Old sample records. They must never sit beside the real college roll. */
export const DEMO_EVENT_IDS = new Set([
  "evt-plantation",
  "evt-camp",
  "evt-blood",
  "evt-swachhata",
  "evt-republic",
]);

export const DEMO_NOTICE_IDS = new Set(["ntc-leaders", "ntc-reg"]);

export const DEMO_GALLERY_IDS = new Set([
  "gal-plantation",
  "gal-plantation-2",
  "gal-swachhata",
]);

export function isDemoRecord(id: string) {
  return DEMO_EVENT_IDS.has(id) || DEMO_NOTICE_IDS.has(id) || DEMO_GALLERY_IDS.has(id);
}

function seedVolunteers(): Volunteer[] {
  return [];
}

function seedEvents(): NssEvent[] {
  return [];
}

function seedNotices(): Notice[] {
  return [];
}

function seedGallery(): GalleryItem[] {
  return [];
}

export function createSeedState(): PortalState {
  return {
    volunteers: seedVolunteers(),
    events: seedEvents(),
    attendance: [],
    eventRsvps: [],
    notices: seedNotices(),
    gallery: seedGallery(),
    certificates: [] as IssuedCertificate[],
    pressReports: [],
    logs: [],
    settings: DEFAULT_SETTINGS,
    visitors: 0,
    recycleBin: [],
  };
}

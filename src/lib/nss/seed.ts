import type {
  GalleryItem,
  IssuedCertificate,
  NssEvent,
  Notice,
  PortalState,
  Volunteer,
} from "./types";
import { DEFAULT_SETTINGS } from "./constants";

function seedVolunteers(): Volunteer[] {
  return [];
}

function seedEvents(): NssEvent[] {
  return [
    {
      id: "evt-plantation",
      name: "Tree Plantation",
      date: "2026-08-05",
      location: "College campus, Mansa",
      hours: 6,
      status: "completed",
      description: "Plantation drive on the college campus.",
      createdAt: "2026-08-05",
    },
    {
      id: "evt-camp",
      name: "NSS Camp",
      date: "2026-09-05",
      location: "Adopted village, Mansa",
      hours: 40,
      status: "completed",
      description: "Seven-day special camping programme.",
      createdAt: "2026-08-18",
    },
    {
      id: "evt-blood",
      name: "Blood Donation",
      date: "2026-10-01",
      location: "College campus, Mansa",
      hours: 4,
      status: "completed",
      description: "Voluntary blood donation camp.",
      createdAt: "2026-10-01",
    },
    {
      id: "evt-swachhata",
      name: "Swachhata Abhiyan",
      date: "2026-10-02",
      location: "Mansa town",
      hours: 4,
      status: "completed",
      description: "Cleanliness drive.",
      createdAt: "2026-10-02",
    },
    {
      id: "evt-republic",
      name: "Republic Day Parade",
      date: "2027-01-26",
      location: "College ground, Mansa",
      hours: 3,
      status: "upcoming",
      description: "Republic Day parade by NSS volunteers.",
      createdAt: "2026-10-02",
    },
  ];
}

function seedNotices(): Notice[] {
  return [
    {
      id: "ntc-leaders",
      title: "Leaders meeting",
      body: "NSS leaders meeting at 10:30 AM.",
      date: "2026-08-25",
      audience: "leaders",
      createdAt: "2026-08-20",
    },
    {
      id: "ntc-reg",
      title: "NSS registration reminder",
      body: "NSS માં જે VOLUNTEERS છે તેમને રજીસ્ટ્રેશન કરવું ફરજિયાત છે.",
      date: "2026-08-11",
      audience: "all",
      createdAt: "2026-08-11",
    },
  ];
}

function seedGallery(): GalleryItem[] {
  return [
    {
      id: "gal-plantation",
      src: "/images/gallery-plantation.jpg",
      caption: "Tree Plantation",
      date: "2026-08-05",
      eventName: "Tree Plantation",
      kind: "photo",
    },
    {
      id: "gal-plantation-2",
      src: "/images/gallery-plantation-2.jpg",
      caption: "Plantation drive",
      date: "2026-08-05",
      eventName: "Tree Plantation",
      kind: "photo",
    },
    {
      id: "gal-swachhata",
      src: "/images/gallery-swachhata.jpg",
      caption: "Swachhata Abhiyan",
      date: "2026-10-02",
      eventName: "Swachhata Abhiyan",
      kind: "photo",
    },
  ];
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

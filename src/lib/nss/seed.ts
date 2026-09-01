import { titleFirstName } from "./format";
import type {
  GalleryItem,
  IssuedCertificate,
  NssEvent,
  Notice,
  PortalState,
  Volunteer,
} from "./types";
import { DEFAULT_SETTINGS } from "./constants";

const NAMES: Array<{
  fullName: string;
  gender: "Male" | "Female";
  course: "B.A." | "B.Com." | "B.Sc.";
  role: "Volunteer" | "Leader";
  dob: string;
  sem: string;
}> = [
  { fullName: "Mahi Sharadkumar Patel", gender: "Female", course: "B.Com.", role: "Leader", dob: "2006-08-26", sem: "3" },
  { fullName: "Aarav Hiteshbhai Shah", gender: "Male", course: "B.A.", role: "Leader", dob: "2005-11-14", sem: "5" },
];

function seedVolunteers(): Volunteer[] {
  return NAMES.map((n, i) => {
    const num = String(i + 1).padStart(3, "0");
    return {
      id: `vol-${num}`,
      volunteerId: `NSS${num}`,
      enrollment: `2026-${n.sem}-${num}`,
      fullName: titleFirstName(n.fullName),
      mobile: `98765${String(10000 + i + 1).slice(-5)}`,
      email: `${n.fullName.split(" ")[0]?.toLowerCase() ?? "nss"}.${num}@sdmansa.edu.in`,
      course: n.course,
      semester: n.sem,
      unit: i % 2 === 0 ? "Unit 1" : "Unit 2",
      nssRole: n.role,
      fatherName: n.fullName.split(" ").slice(1).join(" "),
      dob: n.dob,
      gender: n.gender,
      bloodGroup: "O+",
      address: "Mansa, Gandhinagar, Gujarat",
      parentMobile: `98250${String(20000 + i + 1).slice(-5)}`,
      createdAt: "2026-06-15",
    };
  });
}

function seedEvents(): NssEvent[] {
  return [
    {
      id: "evt-camp",
      name: "NSS Camp",
      date: "2026-09-05",
      location: "Adopted village, Mansa",
      hours: 40,
      status: "upcoming",
      description: "Seven-day special camping programme.",
      createdAt: "2026-08-18",
    },
  ];
}

function seedNotices(): Notice[] {
  return [
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

export function createSeedState(): PortalState {
  return {
    volunteers: seedVolunteers(),
    events: seedEvents(),
    attendance: [],
    eventRsvps: [],
    notices: seedNotices(),
    gallery: [] as GalleryItem[],
    certificates: [] as IssuedCertificate[],
    pressReports: [],
    logs: [],
    settings: DEFAULT_SETTINGS,
    visitors: 1361,
    recycleBin: [],
  };
}

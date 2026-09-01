export type NssRole =
  | "Volunteer"
  | "Leader"
  | "Group Leader"
  | "Discipline Head"
  | "Camp Coordinator";

export type NssUnit = "Unit 1" | "Unit 2";

export type Course = "B.A." | "B.Com." | "B.Sc." | string;

export type EventStatus =
  | "upcoming"
  | "completed"
  | "cancelled";

export type Gender =
  | "Male"
  | "Female"
  | "Other"
  | "";

export type VolunteerStatus =
  | "active"
  | "alumni";

export type GalleryKind =
  | "photo"
  | "video";

export type Audience =
  | "all"
  | "leaders"
  | "girls"
  | "boys";

/* -----------------------------
   EVENT / RSVP
------------------------------ */

export type EventRsvpStatus =
  | "will_attend"
  | "will_not_attend";

export type EventRSVP = {
  volunteerId: string;
  eventId: string;
  status: EventRsvpStatus;
  note?: string;
  updatedAt: string;
};

/* -----------------------------
   EVENT TYPE
------------------------------ */

export type EventActivityType =
  | "regular"
  | "special_camp";

export type NssEvent = {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;

  location: string;

  hours: number;

  status: EventStatus;

  description: string;

  createdAt: string;

  audience?: Audience;

  beneficiaries?: number;

  category?: string;

  coordinator?: string;

  participantIds?: string[];

  activityType?: EventActivityType;

  campName?: string;

  campLocation?: string;

  qrEnabled?: boolean;

  qrToken?: string;

  qrGeneratedAt?: string;

  geofenceEnabled?: boolean;

  geofenceLatitude?: number;

  geofenceLongitude?: number;

  geofenceRadiusMeters?: number;
};

/* -----------------------------
   VOLUNTEER
------------------------------ */

export type Volunteer = {
  id: string;

  volunteerId: string;

  enrollment: string;

  fullName: string;

  mobile: string;

  aadhaarNumber?: string;

  email: string;

  course: Course;

  semester: string;

  unit: NssUnit;

  nssRole: NssRole;

  fatherName: string;

  dob: string;

  gender: Gender;

  bloodGroup: string;

  address: string;

  parentMobile: string;

  createdAt: string;

  status?: VolunteerStatus;

  alumniYear?: string;

  alumniNotes?: string;

  photoUrl?: string;

  /* Student identity fields */
  abcId?: string;

  myBharatId?: string;

  emergencyContact?: string;

  loginPassword?: string;

  mpin?: string;

  webauthnId?: string;

  badges?: string[];

  qrToken?: string;

  qrGeneratedAt?: string;

  registrationSource?: "manual" | "excel" | "online";

  photoUpdatedAt?: string;
};

/* -----------------------------
   ATTENDANCE
------------------------------ */

export type AttendanceSource =
  | "manual"
  | "qr"
  | "dynamic_qr"
  | "offline_sync";

export type AttendanceRecord = {
  volunteerId: string;

  eventId: string;

  present: boolean;

  markedAt?: string;

  source?: AttendanceSource;

  qrToken?: string;

  qrScannedAt?: string;

  latitude?: number;

  longitude?: number;

  gpsAccuracy?: number;

  geofenceVerified?: boolean;

  offline?: boolean;

  syncedAt?: string;

  deviceId?: string;
};

/* -----------------------------
   NOTICES
------------------------------ */

export type Notice = {
  id: string;

  title: string;

  body: string;

  date: string;

  audience: Audience;

  createdAt: string;

  expiresAt?: string;

  pinned?: boolean;
};

/* -----------------------------
   GALLERY
------------------------------ */

export type GalleryItem = {
  id: string;

  src: string;

  caption: string;

  date: string;

  eventId?: string;

  eventName?: string;

  kind?: GalleryKind;

  folder?: string;

  mediaKey?: string;

  posterKey?: string;

  watermarkEnabled?: boolean;

  watermarkText?: string;

  watermarkPosition?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
};

/* -----------------------------
   PRESS REPORT
------------------------------ */

export type PressReportUpload = {
  id: string;

  name: string;

  date: string;

  eventId?: string;

  fileName: string;

  mimeType: string;

  mediaKey: string;

  language?: "gujarati" | "english";

  reportType?:
    | "external"
    | "event"
    | "detailed"
    | "newspaper";

  generatedAt?: string;
};

/* -----------------------------
   CERTIFICATE
------------------------------ */

export type IssuedCertificate = {
  id: string;

  volunteerId: string;

  eventId: string;

  generatedAt: string;

  sentAt: string | null;

  certificateId?: string;

  qrToken?: string;

  qrGeneratedAt?: string;

  verifiedAt?: string;

  pdfUrl?: string;

  printReady?: boolean;
};

/* -----------------------------
   ACTIVITY / AUDIT LOG
------------------------------ */

export type ActivityLog = {
  id: string;

  at: string;

  actor: string;

  action: string;

  details: string;

  actorRole?: SessionRole;

  entityType?: string;

  entityId?: string;

  ipAddress?: string;

  userAgent?: string;
};

/* -----------------------------
   SETTINGS
------------------------------ */

export type PortalSettings = {
  collegeName: string;

  collegeShort: string;

  portalName: string;

  poName: string;

  principalName: string;

  poQuote: string;

  principalQuote: string;

  sloganEn: string;

  sloganGu: string;

  poUsername: string;

  poPassword: string;

  adminUsername: string;

  adminPassword: string;

  poWhatsapp: string;

  alumniCount: number;

  academicYear: string;

  serviceHourTarget: number;

  progressHourTarget?: number;

  regularHourTarget?: number;

  specialCampHourTarget?: number;

  principalPhoto?: string;

  poPhoto?: string;

  waGirls?: string;

  waBoys?: string;

  waLeaders?: string;

  address?: string;

  website?: string;

  contactEmail?: string;

  collegeLogo?: string;

  nssLogo?: string;

  birthdayEnabled?: boolean;

  birthdayTemplate?: string;

  birthdayShowOnDashboard?: boolean;

  birthdayAutoWishLabel?: string;

  showHomeOfficers?: boolean;

  showHomeGallery?: boolean;

  showHomeStats?: boolean;

  showHomeNotices?: boolean;

  showHomeEvents?: boolean;

  heroAutoPlay?: boolean;

  heroIntervalSeconds?: number;

  certificateQrEnabled?: boolean;

  certificateFooterText?: string;

  certificateTemplateUrl?: string;

  poSignature?: string;

  principalSignature?: string;

  attendanceQrEnabled?: boolean;

  dynamicQrEnabled?: boolean;

  qrExpiryMinutes?: number;

  gpsAttendanceEnabled?: boolean;

  geofenceRadiusMeters?: number;

  offlineAttendanceEnabled?: boolean;

  galleryWatermarkEnabled?: boolean;

  galleryWatermarkText?: string;

  sessionTimeoutMinutes?: number;

  auditTrailEnabled?: boolean;

  pwaEnabled?: boolean;

  notificationsEnabled?: boolean;

  themeMode?:
    | "light"
    | "dark"
    | "system";
};

/* -----------------------------
   SESSION / AUTH
------------------------------ */

export type SessionRole =
  | "po"
  | "admin"
  | "volunteer"
  | "leader";

export type PortalSession = {
  role: SessionRole;

  name: string;

  volunteerId?: string;

  enrollment?: string;

  mobile?: string;

  loginAt?: string;

  lastActivityAt?: string;

  sessionId?: string;
};

/* -----------------------------
   RECYCLE BIN
------------------------------ */

export type DeletedItem = {
  id: string;

  kind:
    | "volunteer"
    | "event"
    | "notice"
    | "gallery"
    | "press";

  label: string;

  deletedAt: string;

  data:
    | Volunteer
    | NssEvent
    | Notice
    | GalleryItem
    | PressReportUpload;

  deletedBy?: string;

  restoredAt?: string;

  restoredBy?: string;
};

/* -----------------------------
   OFFLINE ATTENDANCE QUEUE
------------------------------ */

export type OfflineAttendanceItem = {
  id: string;

  volunteerId: string;

  eventId: string;

  createdAt: string;

  source: "qr" | "manual";

  qrToken?: string;

  latitude?: number;

  longitude?: number;

  synced: boolean;

  syncedAt?: string;

  error?: string;
};

/* -----------------------------
   NOTIFICATION
------------------------------ */

export type NotificationType =
  | "event"
  | "rsvp"
  | "attendance"
  | "hours"
  | "certificate"
  | "press"
  | "birthday"
  | "backup"
  | "system";

export type PortalNotification = {
  id: string;

  type: NotificationType;

  title: string;

  message: string;

  createdAt: string;

  read: boolean;

  volunteerId?: string;

  eventId?: string;

  certificateId?: string;
};

/* -----------------------------
   ROLE PERMISSIONS
------------------------------ */

export type Permission =
  | "dashboard.view"
  | "volunteers.view"
  | "volunteers.create"
  | "volunteers.edit"
  | "volunteers.delete"
  | "events.view"
  | "events.create"
  | "events.edit"
  | "events.delete"
  | "attendance.view"
  | "attendance.mark"
  | "attendance.qr"
  | "certificates.view"
  | "certificates.create"
  | "certificates.delete"
  | "gallery.view"
  | "gallery.manage"
  | "press.view"
  | "press.manage"
  | "reports.view"
  | "reports.export"
  | "backup.export"
  | "backup.restore"
  | "recycle.restore"
  | "recycle.delete"
  | "settings.view"
  | "settings.manage"
  | "users.manage";

/* -----------------------------
   PORTAL STATE
------------------------------ */

export type PortalState = {
  volunteers: Volunteer[];

  events: NssEvent[];

  attendance: AttendanceRecord[];

  eventRsvps: EventRSVP[];

  notices: Notice[];

  gallery: GalleryItem[];

  certificates: IssuedCertificate[];

  pressReports?: PressReportUpload[];

  logs: ActivityLog[];

  settings: PortalSettings;

  visitors: number;

  recycleBin: DeletedItem[];

  notifications?: PortalNotification[];

  offlineAttendance?: OfflineAttendanceItem[];

  rolePermissions?: Partial<
    Record<SessionRole, Permission[]>
  >;
};
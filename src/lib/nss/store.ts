import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  OLD_SLOGAN_GU,
  SLOGAN_GU,
  STORAGE_DATA,
  STORAGE_SESSION,
} from "./constants";
import { createSeedState, isDemoRecord } from "./seed";
import { isOfficer, useSessionStore } from "./session";
import { academicYear, byFullName, padId, parseDob, titleFirstName } from "./format";
import { deleteMedia } from "./media";
import { cloudPost, mirrorPortal, readPortalMirror } from "./dual-store";
import { assignSequentialIds, certificateYear, nextCertificateSeq } from "./certificates";
import { nssHourRule } from "./hours";

function purgedKey(value: string) {
  return value.trim().toLowerCase();
}

function dropped(keys: string[], purged: string[] = []) {
  const set = new Set(purged.map(purgedKey));
  return keys.some((key) => {
    const clean = purgedKey(key);
    return clean.length > 1 && set.has(clean);
  });
}

function rememberPurged(keys: string[]) {
  const have = new Set((useNssStore.getState().purgedKeys ?? []).map(purgedKey));
  for (const key of keys) {
    const clean = purgedKey(key);
    if (clean.length > 1) have.add(clean);
  }
  useNssStore.setState({ purgedKeys: [...have].slice(-800) });
}

function purgeCloud(ids: string[]) {
  const unique = [...new Set(ids.map((id) => id.trim()).filter((id) => id.length > 1))].slice(0, 40);
  if (!unique.length) return;
  const session = useSessionStore.getState().session;
  void cloudPost({
    action: "purge",
    chatToken: session?.chatToken || "",
    deskRole: session?.role === "admin" ? "admin" : "po",
    ids: unique,
  });
}
import type {
  AttendanceRecord,
  GalleryItem,
  PressReportUpload,
  IssuedCertificate,
  NssEvent,
  Notice,
  PortalSettings,
  PortalState,
  Volunteer,
  ActivityLog,
  DeletedItem,
  EventRSVP,
  EventRsvpStatus,
} from "./types";

type CloudSlice =
  Partial<
    Pick<
      PortalState,
      | "volunteers"
      | "events"
      | "attendance"
      | "notices"
      | "gallery"
      | "visitors"
    >
  > & {
    alumniCount?: number;
    serviceHours?: number;
    keepPrivate?: boolean;
    degraded?: boolean;
    brand?: { poPhoto?: string; principalPhoto?: string };
  };

type Actions = {
  hydrate: () => void;
  applyCloud: (cloud: CloudSlice) => void;
  resetDemo: () => void;
  bumpVisitor: () => void;

  addVolunteer: (
    v: Omit<
      Volunteer,
      "id" | "volunteerId" | "enrollment" | "createdAt"
    >,
  ) => Volunteer;

  updateVolunteer: (
    id: string,
    patch: Partial<Volunteer>,
  ) => void;

  deleteVolunteer: (id: string) => void;

  addEvent: (
    e: Omit<NssEvent, "id" | "createdAt">,
  ) => NssEvent;

  updateEvent: (
    id: string,
    patch: Partial<NssEvent>,
  ) => void;

  deleteEvent: (id: string) => void;

  setAttendance: (
    volunteerId: string,
    eventId: string,
    present: boolean,
    meta?: Partial<Pick<AttendanceRecord, "source" | "qrToken" | "qrScannedAt" | "latitude" | "longitude" | "gpsAccuracy" | "geofenceVerified" | "offline" | "deviceId">>,
  ) => void;

  setEventRSVP: (
    volunteerId: string,
    eventId: string,
    status: EventRsvpStatus,
    note?: string,
  ) => void;

  markAllAttendance: (
    eventId: string,
    present: boolean,
  ) => void;

  addNotice: (
    n: Omit<Notice, "id" | "createdAt">,
  ) => Notice;

  updateNotice: (
    id: string,
    patch: Partial<Notice>,
  ) => void;

  deleteNotice: (id: string) => void;

  updateSettings: (
    patch: Partial<PortalSettings>,
  ) => void;

  generateCertificates: (
    eventId: string,
    volunteerIds: string[],
  ) => IssuedCertificate[];

  sendCertificates: (ids: string[]) => number;

  deleteCertificate: (id: string) => boolean;

  addGalleryItems: (
    items: GalleryItem[],
  ) => void;

  addPressReport: (
    item: PressReportUpload,
  ) => void;

  removePressReport: (id: string) => void;

  removeGalleryItem: (id: string) => void;

  moveToAlumni: (
    id: string,
    notes?: string,
  ) => void;

  restoreAlumni: (id: string) => void;

  addLog: (
    action: string,
    details: string,
  ) => void;

  promoteVolunteers: (
    ids: string[],
  ) => number;

  deleteVolunteers: (
    ids: string[],
  ) => number;

  importBackup: (
    data: Partial<PortalState>,
  ) => void;

  restoreDeleted: (id: string) => void;

  permanentlyDelete: (id: string) => void;

  emptyRecycleBin: () => void;

  awardBadge: (
    volunteerId: string,
    badge: string,
  ) => void;

  generateEventQr: (eventId: string) => string | null;
  regenerateEventQr: (eventId: string) => string | null;

  removeBadge: (
    volunteerId: string,
    badge: string,
  ) => void;
};

function migrateSlogan(text: unknown) {
  if (typeof text !== "string") {
    return typeof text === "undefined"
      ? ""
      : String(text ?? "");
  }

  return text
    .replaceAll(OLD_SLOGAN_GU, SLOGAN_GU)
    .replaceAll(
      "નહીં હું, પણ અમે",
      SLOGAN_GU,
    )
    .replaceAll(
      "નહિ હું, પણ અમે",
      SLOGAN_GU,
    )
    .replaceAll(
      "નહીં હું પણ અમે",
      SLOGAN_GU,
    )
    .replaceAll(
      "નહિ હું પણ અમે",
      SLOGAN_GU,
    )
    .replaceAll(
      "હું નહીં, પણ તમે",
      SLOGAN_GU,
    )
    .replaceAll(
      "હું નહીં પણ તમે",
      SLOGAN_GU,
    );
}

function isRecord(
  v: unknown,
): v is Record<string, unknown> {
  return Boolean(v) &&
    typeof v === "object" &&
    !Array.isArray(v);
}

function asArray<T>(
  value: unknown,
  fallback: T[],
): T[] {
  return Array.isArray(value)
    ? (value as T[])
    : fallback;
}

function uniqueBy<T>(
  items: T[],
  key: (item: T) => string,
) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const value = key(item);

    if (!value || seen.has(value)) {
      return false;
    }

    seen.add(value);
    return true;
  });
}

function dedupeVolunteers(items: Volunteer[]) {
  return uniqueBy(items, (v) => {
    const mobile = digits(v.mobile).slice(-10);
    if (mobile.length === 10) return `mobile:${mobile}`;
    if (v.volunteerId) return `vid:${v.volunteerId}`;
    if (v.id) return `id:${v.id}`;
    return `enrollment:${v.enrollment}`;
  });
}

function dedupeEvents(
  items: NssEvent[],
) {
  return uniqueBy(
    items,
    (e) =>
      e.id ||
      `${e.name}|${e.date}|${e.location}`,
  );
}

function dedupeAttendance(
  items: AttendanceRecord[],
) {
  return uniqueBy(
    items,
    (a) =>
      `${a.volunteerId}|${a.eventId}`,
  );
}

function dedupeNotices(
  items: Notice[],
) {
  return uniqueBy(
    items,
    (n) =>
      n.id ||
      `${n.title}|${n.date}|${n.createdAt}`,
  );
}

function dedupeGallery(
  items: GalleryItem[],
) {
  return uniqueBy(
    items,
    (g) =>
      g.mediaKey ||
      g.id ||
      `${g.eventId}|${g.date}|${g.caption}`,
  );
}

function dedupeCertificates(
  items: IssuedCertificate[],
) {
  return uniqueBy(
    items,
    (c) =>
      `${c.volunteerId}|${c.eventId}`,
  );
}

function dedupePressReports(
  items: PressReportUpload[],
) {
  return uniqueBy(
    items,
    (r) =>
      r.mediaKey ||
      r.id ||
      `${r.fileName}|${r.date}|${r.eventId ?? ""}`,
  );
}

function persistAttendance(rows: { mobile: string; name: string; eventName: string; present: boolean; date?: string }[]) {
  const ready = rows.filter((row) => row.mobile.replace(/\D/g, "").length >= 10 && row.eventName);
  if (!ready.length) return;
  const session = useSessionStore.getState().session;
  const token = session?.chatToken || "";
  const deskRole = session?.role === "admin" ? "admin" : "po";
  void cloudPost({
    action: "save-attendance",
    chatToken: token,
    deskRole,
    rows: ready,
  }).then(() => {
    const state = useNssStore.getState();
    const hours = totalServiceHours(state);
    if (hours > 0) {
      void cloudPost({
        action: "live-hours",
        chatToken: token,
        deskRole,
        hours,
      });
      useNssStore.setState({ liveHours: hours });
    }
    const best = bestVolunteer(state);
    if (!best) return;
    void cloudPost({
      action: "live-best",
      chatToken: token,
      deskRole,
      volunteerId: best.volunteerId || best.id,
      name: best.fullName,
      unit: best.unit,
      hours: volunteerHours(state, best.id),
    });
  });
}

function looksLikeSeed(
  vols: Volunteer[],
) {
  if (!vols.length) {
    return true;
  }

  if (vols.length > 30) {
    return false;
  }

  return vols.every((v) =>
    String(v.id).startsWith("vol-"),
  );
}

function digits(value: string) {
  return String(value ?? "")
    .replace(/\D/g, "");
}

function unwrapPersisted(
  raw: string,
): string {
  const parsed = JSON.parse(raw) as unknown;

  if (
    isRecord(parsed) &&
    "state" in parsed
  ) {
    return raw;
  }

  return JSON.stringify({
    state: parsed,
    version: 0,
  });
}

function readLegacyPortalJson(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const primary =
      localStorage.getItem(
        STORAGE_DATA,
      );

    if (primary) {
      return unwrapPersisted(primary);
    }

    for (
      let i = 0;
      i < localStorage.length;
      i += 1
    ) {
      const key = localStorage.key(i);

      if (
        !key ||
        key === STORAGE_SESSION
      ) {
        continue;
      }

      const value =
        localStorage.getItem(key);

      if (
        !value ||
        !value.includes("volunteers")
      ) {
        continue;
      }

      try {
        const wrapped =
          unwrapPersisted(value);

        const parsed =
          JSON.parse(wrapped) as {
            state?: {
              volunteers?: unknown;
            };
          };

        if (
          Array.isArray(
            parsed.state?.volunteers,
          )
        ) {
          localStorage.setItem(
            STORAGE_DATA,
            wrapped,
          );

          return wrapped;
        }
      } catch {
        /* skip bad key */
      }
    }
  } catch {
    /* private mode */
  }

  return null;
}

const portalStorage =
  createJSONStorage(() => ({
    getItem: async (name: string) => {
      if (typeof window === "undefined") {
        return null;
      }

      try {
        const raw =
          localStorage.getItem(name);

        if (raw) {
          return unwrapPersisted(raw);
        }
      } catch {
        /* private mode or a full quota */
      }

      const mirrored = await readPortalMirror();
      if (mirrored) return unwrapPersisted(mirrored);
      return readLegacyPortalJson();
    },

    setItem: (
      name: string,
      value: string,
    ) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        localStorage.setItem(name, value);
      } catch {
        /* IndexedDB below still keeps the roll */
      }
      void mirrorPortal(value);
    },

    removeItem: (name: string) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
      void mirrorPortal("");
    },
  }));

function mergePortalState(
  persisted: unknown,
  current: PortalState & Actions,
): PortalState & Actions {
  const p =
    (isRecord(persisted)
      ? persisted
      : {}) as Partial<PortalState>;

  const incomingSettings =
    isRecord(p.settings)
      ? (p.settings as Partial<PortalSettings>)
      : {};

  const settings: PortalSettings = {
    ...current.settings,
    ...incomingSettings,
  };

  settings.sloganGu =
    migrateSlogan(
      settings.sloganGu ||
        SLOGAN_GU,
    ) || SLOGAN_GU;

  if (
    settings.sloganGu ===
    OLD_SLOGAN_GU
  ) {
    settings.sloganGu =
      SLOGAN_GU;
  }

  settings.sloganEn =
    settings.sloganEn ||
    current.settings.sloganEn;

  settings.poQuote =
    migrateSlogan(
      settings.poQuote ||
        current.settings.poQuote,
    );

  settings.waGirls =
    settings.waGirls ||
    current.settings.waGirls;

  settings.waBoys =
    settings.waBoys ||
    current.settings.waBoys;

  settings.waLeaders =
    settings.waLeaders ||
    current.settings.waLeaders;

  settings.poPassword = "";
  settings.adminPassword = "";

  const persistedVols =
    asArray<Volunteer>(
      p.volunteers,
      [],
    );

  const seed =
    looksLikeSeed(
      persistedVols,
    );

  const eventRsvps =
    uniqueBy(
      asArray<EventRSVP>(
        p.eventRsvps,
        current.eventRsvps ?? [],
      ),
      (r) =>
        `${r.volunteerId}|${r.eventId}`,
    );

  const gallery =
    dedupeGallery(
      asArray<GalleryItem>(
        p.gallery,
        current.gallery,
      ).filter(
        (g) =>
          g.mediaKey ||
          (
            g.src &&
            !g.src.startsWith(
              "/images/gallery-",
            )
          ),
      ),
    );

  const events = dedupeEvents(
    asArray<NssEvent>(
      p.events,
      current.events,
    ),
  );

  const certificates = seed
    ? []
    : assignSequentialIds(
        dedupeCertificates(
          asArray<IssuedCertificate>(
            p.certificates,
            [],
          ),
        ),
        events,
      );

  return {
    ...current,

    volunteers: seed
      ? current.volunteers
      : dedupeVolunteers(
          persistedVols.map((v) => ({
            ...v,
            fullName:
              titleFirstName(
                v.fullName,
              ),
          })),
        ),

    events: events.filter((event) => !isDemoRecord(event.id)),

    attendance: seed
      ? []
      : dedupeAttendance(
          asArray<AttendanceRecord>(
            p.attendance,
            [],
          ),
        ),

    eventRsvps: seed
      ? []
      : eventRsvps,

    notices: dedupeNotices(
      asArray<Notice>(
        p.notices,
        current.notices,
      ),
    ).filter((notice) => !isDemoRecord(notice.id)),

    gallery: gallery.filter((item) => !isDemoRecord(item.id)),

    certificates,
    pressReports: seed
      ? []
      : dedupePressReports(
          asArray<PressReportUpload>(
            p.pressReports,
            [],
          ),
        ),

    logs: asArray<ActivityLog>(
      p.logs,
      current.logs ?? [],
    ),

    settings,

    visitors:
      typeof p.visitors === "number"
        ? p.visitors
        : current.visitors,

    recycleBin:
      asArray<DeletedItem>(
        p.recycleBin,
        current.recycleBin ?? [],
      ),
  };
}

export const useNssStore =
  create<PortalState & Actions>()(
    persist(
      (set, get) => ({
        ...createSeedState(),

        hydrate: () => {
          void useNssStore.persist.rehydrate();
        },

        resetDemo: () =>
          set({
            ...createSeedState(),
            eventRsvps: [],
            recycleBin: [],
          }),

        applyCloud: (cloud) => {
          const current = get();
          if (cloud.degraded) {
            const next: Partial<PortalState> = {};
            if (typeof cloud.visitors === "number" && cloud.visitors > current.visitors) next.visitors = cloud.visitors;
            if (typeof cloud.serviceHours === "number" && cloud.serviceHours > (current.settings.reportedServiceHours ?? 0)) {
              next.settings = { ...current.settings, reportedServiceHours: cloud.serviceHours };
            }
            if (Object.keys(next).length) set(next);
            return;
          }
          const officer =
            Boolean(cloud.keepPrivate) ||
            isOfficer(
              useSessionStore.getState()
                .session,
            );
          const next: Partial<PortalState> =
            {};

          if (
            Array.isArray(
              cloud.volunteers,
            ) &&
            cloud.volunteers.length >= 20
          ) {
            const localById =
              new Map(
                current.volunteers.map(
                  (v) => [v.id, v],
                ),
              );

            const localByMobile =
              new Map(
                current.volunteers.map(
                  (v) =>
                    [
                      digits(v.mobile).slice(
                        -10,
                      ),
                      v,
                    ] as const,
                ),
              );

            const localByVid =
              new Map(
                current.volunteers.map(
                  (v) =>
                    [v.volunteerId, v] as const,
                ),
              );

            const session =
              useSessionStore.getState()
                .session;

            next.volunteers =
              dedupeVolunteers(
                cloud.volunteers
                  .map((row) => {
                    const prev =
                      localById.get(
                        row.id,
                      ) ||
                      localByVid.get(
                        row.volunteerId,
                      ) ||
                      localByMobile.get(
                        digits(
                          row.mobile,
                        ).slice(-10),
                      );

                    const self =
                      !officer &&
                      Boolean(
                        session &&
                          (row.id ===
                            session.volunteerId ||
                            row.volunteerId ===
                              session.volunteerId ||
                            (session.enrollment &&
                              row.enrollment ===
                                session.enrollment)),
                      );

                    const cloudPhoto =
                      row.photoUrl &&
                      row.photoUrl.length <
                        1200000
                        ? row.photoUrl
                        : "";

                    return {
                      ...row,

                      volunteerId:
                        row.volunteerId ||
                        prev?.volunteerId ||
                        "",

                      enrollment:
                        row.enrollment ||
                        prev?.enrollment ||
                        "",

                      fullName:
                        titleFirstName(
                          row.fullName ||
                            prev?.fullName ||
                            "",
                        ),

                      dob:
                        parseDob(row.dob) ||
                        parseDob(
                          prev?.dob,
                        ) ||
                        row.dob,

                      status:
                        prev?.status ===
                        "alumni"
                          ? "alumni"
                          : row.status ??
                            "active",

                      alumniYear:
                        prev?.alumniYear ??
                        row.alumniYear,

                      alumniNotes:
                        prev?.alumniNotes ??
                        row.alumniNotes,

                      photoUrl:
                        cloudPhoto ||
                        (prev?.photoUrl &&
                        prev.photoUrl.length <
                          1200000
                          ? prev.photoUrl
                          : ""),

                      emergencyContact:
                        officer || self
                          ? row.emergencyContact ||
                            prev?.emergencyContact ||
                            ""
                          : "",

                      loginPassword: "",

                      mobile:
                        officer
                          ? row.mobile ||
                            prev?.mobile ||
                            ""
                          : self
                            ? row.mobile ||
                              prev?.mobile ||
                              session?.mobile ||
                              ""
                            : "",

                      email:
                        officer || self
                          ? row.email ||
                            prev?.email ||
                            ""
                          : "",

                      address:
                        officer || self
                          ? row.address ||
                            prev?.address ||
                            ""
                          : "",

                      bloodGroup:
                        officer || self
                          ? row.bloodGroup ||
                            prev?.bloodGroup ||
                            ""
                          : "",

                      fatherName:
                        officer || self
                          ? row.fatherName ||
                            prev?.fatherName ||
                            ""
                          : "",

                      parentMobile:
                        officer || self
                          ? row.parentMobile ||
                            prev?.parentMobile ||
                            ""
                          : "",

                      abcId:
                        officer || self
                          ? row.abcId ||
                            prev?.abcId ||
                            ""
                          : "",

                      mpin: self ? row.mpin || prev?.mpin || "" : "",

                      webauthnId:
                        prev?.webauthnId,
                    };
                  })
                  .sort(byFullName),
              );

            const cloudVids = new Set(
              (next.volunteers ?? [])
                .map((row) => row.volunteerId)
                .filter(Boolean),
            );
            const pending = current.volunteers.filter(
              (row) => row.id.startsWith("vol-") && Boolean(row.fullName) && !cloudVids.has(row.volunteerId),
            );
            if (pending.length && next.volunteers) {
              next.volunteers = dedupeVolunteers([
                ...next.volunteers,
                ...pending,
              ]).sort(byFullName);
            }
            if (next.volunteers) {
              const purged = current.purgedKeys ?? [];
              next.volunteers = next.volunteers.filter(
                (row) => !dropped([row.id, row.volunteerId, row.mobile, row.fullName], purged),
              );
            }

            const seedish =
              looksLikeSeed(
                current.volunteers,
              );

            if (seedish) {
              next.attendance = [];
              next.certificates = [];
            } else {
              const newByOld =
                new Map<string, string>();

              for (
                const old of
                current.volunteers
              ) {
                const neu =
                  next.volunteers?.find(
                    (v) =>
                      v.id === old.id,
                  ) ||
                  next.volunteers?.find(
                    (v) =>
                      Boolean(
                        old.volunteerId,
                      ) &&
                      v.volunteerId ===
                        old.volunteerId,
                  ) ||
                  next.volunteers?.find(
                    (v) =>
                      digits(
                        v.mobile,
                      ).slice(-10) ===
                        digits(
                          old.mobile,
                        ).slice(-10) &&
                      digits(old.mobile)
                        .length >= 10,
                  );

                if (neu) {
                  newByOld.set(
                    old.id,
                    neu.id,
                  );
                }
              }

              next.attendance =
                dedupeAttendance(
                  current.attendance
                    .map((row) => ({
                      ...row,
                      volunteerId:
                        newByOld.get(
                          row.volunteerId,
                        ) || "",
                    }))
                    .filter(
                      (row) =>
                        row.volunteerId,
                    ),
                );
            }
          }

          if (Array.isArray(cloud.events)) {
            const localExtra = current.events.filter(
              (e) =>
                e.id.startsWith("evt-") &&
                !isDemoRecord(e.id) &&
                !cloud.events?.some(
                  (c) => c.id === e.id || c.name.trim().toLowerCase() === e.name.trim().toLowerCase(),
                ),
            );

            next.events = dedupeEvents([...cloud.events, ...localExtra])
              .map((event) => ({
                ...event,
                hours: nssHourRule(event).hours,
              }))
              .filter((event) => !isDemoRecord(event.id) && !dropped([event.id, event.name], current.purgedKeys ?? []));
          }

          if (Array.isArray(cloud.attendance)) {
            next.attendance = dedupeAttendance(cloud.attendance);
          }

          if (Array.isArray(cloud.notices)) {
            next.notices = dedupeNotices(cloud.notices).filter(
              (notice) => !dropped([notice.id, notice.title], current.purgedKeys ?? []),
            );
          }

          if (
            Array.isArray(
              cloud.gallery,
            ) &&
            cloud.gallery.length
          ) {
            const localKeep =
              (
                current.gallery ??
                []
              ).filter(
                (g) => g.mediaKey,
              );

            const localIds =
              new Set(
                localKeep.map(
                  (g) => g.id,
                ),
              );

            next.gallery = dedupeGallery([
              ...localKeep,
              ...cloud.gallery.filter((g) => !localIds.has(g.id) && !g.mediaKey && g.src),
            ]).filter((item) => !dropped([item.id, item.caption || ""], current.purgedKeys ?? []));
          }

          if (
            typeof cloud.visitors ===
              "number" &&
            cloud.visitors > 0
          ) {
            next.visitors = Math.max(current.visitors, cloud.visitors);
          }

          const computedAlumni =
            (
              next.volunteers ??
              current.volunteers
            ).filter(
              (v) =>
                v.status ===
                "alumni",
            ).length;

          next.settings = {
            ...current.settings,

            alumniCount:
              computedAlumni ||
              Number(
                cloud.alumniCount,
              ) ||
              current.settings
                .alumniCount,

            reportedServiceHours:
              typeof cloud.serviceHours ===
              "number"
                ? cloud.serviceHours
                : current.settings
                    .reportedServiceHours,

            poPassword: "",
            adminPassword: "",
            poPhoto:
              cloud.brand?.poPhoto ||
              current.settings.poPhoto ||
              "",
            principalPhoto:
              cloud.brand?.principalPhoto ||
              current.settings.principalPhoto ||
              "",
          };

          if (
            Object.keys(next).length
          ) {
            set(next);
          }
        },

        bumpVisitor: () =>
          set({
            visitors:
              get().visitors + 1,
          }),

        addVolunteer: (input) => {
          const volunteers =
            get().volunteers;

          const next =
            volunteers.length + 1;

          const volunteerId =
            `NSS${padId(next)}`;

          const enrollment =
            `2026-${input.semester}-${padId(next)}`;

          const volunteer: Volunteer =
            {
              ...input,

              fullName:
                titleFirstName(
                  input.fullName,
                ),

              id:
                `vol-${Date.now()}`,

              volunteerId,

              enrollment,

              createdAt:
                new Date()
                  .toISOString()
                  .slice(0, 10),

              status:
                input.status ??
                "active",
            };

          set({
            volunteers:
              dedupeVolunteers([
                ...volunteers,
                volunteer,
              ]).sort(byFullName),
          });

          return volunteer;
        },

        updateVolunteer: (
          id,
          patch,
        ) =>
          set({
            volunteers:
              get().volunteers.map(
                (v) =>
                  v.id === id
                    ? {
                        ...v,
                        ...patch,
                        fullName:
                          titleFirstName(
                            patch.fullName ??
                              v.fullName,
                          ),
                      }
                    : v,
              ),
          }),

        deleteVolunteer: (id) => {
          const current = get();
          const item = current.volunteers.find((v) => v.id === id);
          if (!item) return;
          const keys = [item.id, item.volunteerId, item.mobile, item.fullName];
          rememberPurged(keys);
          purgeCloud(keys);
          set({
            volunteers: current.volunteers.filter((v) => v.id !== id),
            attendance: current.attendance.filter((a) => a.volunteerId !== id),
            eventRsvps: (current.eventRsvps ?? []).filter((r) => r.volunteerId !== id),
            certificates: current.certificates.filter((c) => c.volunteerId !== id),
          });
          get().addLog("Permanent delete", `Volunteer ${item.fullName} was permanently deleted.`);
        },

        addEvent: (input) => {
          const event: NssEvent = {
              ...input,
              hours: nssHourRule(input).hours,

              id:
                `evt-${Date.now()}`,

              createdAt:
                new Date()
                  .toISOString()
                  .slice(0, 10),
            };

          set({
            events:
              dedupeEvents([
                ...get().events,
                event,
              ]),
          });

          return event;
        },

        updateEvent: (
          id,
          patch,
        ) =>
          set({
            events:
              get().events.map(
                (e) =>
                  e.id === id
                    ? {
                        ...e,
                        ...patch,
                      }
                    : e,
              ),
          }),

        deleteEvent: (id) => {
          const current = get();
          const item = current.events.find((e) => e.id === id);
          if (!item) return;
          const keys = [item.id, item.name];
          rememberPurged(keys);
          purgeCloud(keys);
          set({
            events: current.events.filter((e) => e.id !== id),
            attendance: current.attendance.filter((a) => a.eventId !== id),
            eventRsvps: (current.eventRsvps ?? []).filter((r) => r.eventId !== id),
            certificates: current.certificates.filter((c) => c.eventId !== id),
          });
          get().addLog("Permanent delete", `Event ${item.name} was permanently deleted.`);
        },

        generateEventQr: (eventId) => {
          const event = get().events.find((e) => e.id === eventId);
          if (!event) return null;
          const token = event.qrToken || `evtqr-${eventId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          set({
            events: get().events.map((e) =>
              e.id === eventId
                ? { ...e, qrEnabled: true, qrToken: token, qrGeneratedAt: new Date().toISOString() }
                : e,
            ),
          });
          return token;
        },

        regenerateEventQr: (eventId) => {
          const event = get().events.find((e) => e.id === eventId);
          if (!event) return null;
          const token = `evtqr-${eventId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          set({
            events: get().events.map((e) =>
              e.id === eventId
                ? { ...e, qrEnabled: true, qrToken: token, qrGeneratedAt: new Date().toISOString() }
                : e,
            ),
          });
          return token;
        },

        setAttendance: (
          volunteerId,
          eventId,
          present,
          meta,
        ) => {
          const rest =
            get().attendance.filter(
              (a) =>
                !(
                  a.volunteerId ===
                    volunteerId &&
                  a.eventId === eventId
                ),
            );

          const row: AttendanceRecord =
            {
              volunteerId,
              eventId,
              present,
              markedAt:
                new Date().toISOString(),
              source: meta?.source ?? "manual",
              ...meta,
            };

          set({
            attendance: [
              ...rest,
              row,
            ],
          });
          const saved = get();
          const volunteer = saved.volunteers.find((item) => item.id === volunteerId);
          const event = saved.events.find((item) => item.id === eventId);
          if (volunteer && event) {
            persistAttendance([{ mobile: volunteer.mobile, name: volunteer.fullName, eventName: event.name, present, date: event.date }]);
            get().addLog("Attendance", `${volunteer.fullName} marked ${present ? "present" : "absent"} for ${event.name}${present ? `. ${event.hours || 0} hours added.` : "."}`);
          }
        },

        setEventRSVP: (
          volunteerId,
          eventId,
          status,
          note,
        ) => {
          const rest =
            (
              get().eventRsvps ??
              []
            ).filter(
              (r) =>
                !(
                  r.volunteerId ===
                    volunteerId &&
                  r.eventId === eventId
                ),
            );

          const row: EventRSVP =
            {
              volunteerId,
              eventId,
              status,

              ...(note
                ? { note }
                : {}),

              updatedAt:
                new Date()
                  .toISOString(),
            };

          set({
            eventRsvps: [
              ...rest,
              row,
            ],
          });
        },

        markAllAttendance: (
          eventId,
          present,
        ) => {
          const state =
            get();

          const keep =
            state.attendance.filter(
              (a) => {
                if (
                  a.eventId !==
                  eventId
                ) {
                  return true;
                }

                const volunteer =
                  state.volunteers.find(
                    (v) =>
                      v.id ===
                      a.volunteerId,
                  );

                return (
                  volunteer?.status ===
                  "alumni"
                );
              },
            );

          const rows =
            activeVolunteers(
              state,
            ).map((v) => ({
              volunteerId:
                v.id,

              eventId,

              present,

              markedAt:
                new Date()
                  .toISOString(),

              source:
                "manual" as const,
            }));

          set({
            attendance: [
              ...keep,
              ...rows,
            ],
          });
          const event = state.events.find((item) => item.id === eventId);
          if (event) {
            persistAttendance(
              activeVolunteers(state).map((volunteer) => ({
                mobile: volunteer.mobile,
                name: volunteer.fullName,
                eventName: event.name,
                present,
                date: event.date,
              })),
            );
          }
        },

        addNotice: (input) => {
          const notice: Notice =
            {
              ...input,

              id:
                `ntc-${Date.now()}`,

              createdAt:
                new Date()
                  .toISOString()
                  .slice(0, 10),
            };

          set({
            notices: [
              notice,
              ...get().notices,
            ],
          });

          return notice;
        },

        updateNotice: (
          id,
          patch,
        ) =>
          set({
            notices:
              get().notices.map(
                (n) =>
                  n.id === id
                    ? {
                        ...n,
                        ...patch,
                      }
                    : n,
              ),
          }),

        deleteNotice: (id) => {
          const current = get();
          const item = current.notices.find((n) => n.id === id);
          if (!item) return;
          const keys = [item.id, item.title];
          rememberPurged(keys);
          purgeCloud(keys);
          set({
            notices: current.notices.filter((n) => n.id !== id),
          });
          get().addLog("Permanent delete", `Notice ${item.title} was permanently deleted.`);
        },

        updateSettings: (
          patch,
        ) =>
          set({
            settings: {
              ...get().settings,
              ...patch,
            },
          }),

        addGalleryItems: (
          items,
        ) => {
          if (!items.length) return;

          set({
            gallery:
              dedupeGallery([
                ...items,
                ...(get().gallery ??
                  []),
              ]),
          });
        },

        addPressReport: (
          item,
        ) =>
          set({
            pressReports:
              dedupePressReports([
                item,
                ...(get()
                  .pressReports ??
                  []),
              ]),
          }),

        removePressReport: (
          id,
        ) => {
          const current =
            get();

          const item =
            (
              current.pressReports ??
              []
            ).find(
              (r) => r.id === id,
            );

          if (!item) return;
          const keys = [item.id, item.name];
          rememberPurged(keys);
          purgeCloud(keys);
          if (item.mediaKey) void deleteMedia(item.mediaKey);
          set({
            pressReports: (current.pressReports ?? []).filter((r) => r.id !== id),
          });
          get().addLog("Permanent delete", `Press report ${item.name} was permanently deleted.`);
        },

        removeGalleryItem: (
          id,
        ) => {
          const current =
            get();

          const item =
            (
              current.gallery ??
              []
            ).find(
              (g) => g.id === id,
            );

          if (!item) return;
          const keys = [item.id, item.caption || ""];
          rememberPurged(keys);
          purgeCloud(keys);
          if (item.mediaKey) void deleteMedia(item.mediaKey);
          set({
            gallery: (current.gallery ?? []).filter((g) => g.id !== id),
          });
          get().addLog("Permanent delete", "Gallery media was permanently deleted.");
        },

        moveToAlumni: (
          id,
          notes,
        ) => {
          const volunteers =
            get().volunteers.map(
              (v) =>
                v.id === id
                  ? {
                      ...v,

                      status:
                        "alumni" as const,

                      alumniYear:
                        v.alumniYear ||
                        academicYear(),

                      alumniNotes:
                        notes ??
                        v.alumniNotes ??
                        "",
                    }
                  : v,
            );

          set({
            volunteers,

            settings: {
              ...get().settings,

              alumniCount:
                volunteers.filter(
                  (v) =>
                    v.status ===
                    "alumni",
                ).length,
            },
          });

          get().addLog(
            "Sent to alumni",
            `Moved volunteer to alumni file.`,
          );
        },

        restoreAlumni: (
          id,
        ) => {
          const volunteers =
            get().volunteers.map(
              (v) =>
                v.id === id
                  ? {
                      ...v,
                      status:
                        "active" as const,
                    }
                  : v,
            );

          set({
            volunteers,

            settings: {
              ...get().settings,

              alumniCount:
                volunteers.filter(
                  (v) =>
                    v.status ===
                    "alumni",
                ).length,
            },
          });

          get().addLog(
            "Restored volunteer",
            `Restored an alumni record to the active roll.`,
          );
        },

        addLog: (
          action,
          details,
        ) => {
          const row: ActivityLog =
            {
              id:
                `log-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2, 6)}`,

              at:
                new Date()
                  .toISOString(),

              actor:
                get().settings.poName,

              action,

              details,
            };

          set({
            logs: [
              row,
              ...(get().logs ??
                []),
            ].slice(0, 250),
          });
        },

        promoteVolunteers: (
          ids,
        ) => {
          const want =
            new Set(ids);

          let count = 0;

          const volunteers =
            get().volunteers.map(
              (v) => {
                if (
                  !want.has(v.id) ||
                  v.status ===
                    "alumni"
                ) {
                  return v;
                }

                const sem =
                  Math.min(
                    6,
                    Number(
                      v.semester ||
                        "1",
                    ) + 1,
                  );

                count += 1;

                return {
                  ...v,
                  semester:
                    String(sem),
                };
              },
            );

          set({
            volunteers,
          });

          if (count) {
            get().addLog(
              "Batch Promotion",
              `Promoted ${count} volunteer(s) to the next semester.`,
            );
          }

          return count;
        },

        deleteVolunteers: (ids) => {
          const want = new Set(ids);
          const current = get();
          const removed = current.volunteers.filter((v) => want.has(v.id));
          if (!removed.length) return 0;
          const keys = removed.flatMap((item) => [item.id, item.volunteerId, item.mobile, item.fullName]);
          rememberPurged(keys);
          purgeCloud(keys);
          set({
            volunteers: current.volunteers.filter((v) => !want.has(v.id)),
            attendance: current.attendance.filter((a) => !want.has(a.volunteerId)),
            eventRsvps: (current.eventRsvps ?? []).filter((r) => !want.has(r.volunteerId)),
            certificates: current.certificates.filter((c) => !want.has(c.volunteerId)),
          });
          get().addLog("Permanent delete", `Permanently deleted ${removed.length} volunteer(s).`);
          return removed.length;
        },

        importBackup: (
          data,
        ) => {
          const current =
            get();

          set({
            volunteers:
              Array.isArray(
                data.volunteers,
              )
                ? data.volunteers
                : current.volunteers,

            events:
              Array.isArray(
                data.events,
              )
                ? data.events
                : current.events,

            attendance:
              Array.isArray(
                data.attendance,
              )
                ? data.attendance
                : current.attendance,

            eventRsvps:
              Array.isArray(
                data.eventRsvps,
              )
                ? data.eventRsvps
                : current.eventRsvps ??
                  [],

            notices:
              Array.isArray(
                data.notices,
              )
                ? data.notices
                : current.notices,

            gallery:
              Array.isArray(
                data.gallery,
              )
                ? data.gallery
                : current.gallery,

            certificates:
              Array.isArray(
                data.certificates,
              )
                ? assignSequentialIds(
                    data.certificates,
                    Array.isArray(
                      data.events,
                    )
                      ? data.events
                      : current.events,
                  )
                : current.certificates,

            pressReports:
              Array.isArray(
                data.pressReports,
              )
                ? data.pressReports
                : current.pressReports,

            logs:
              Array.isArray(
                data.logs,
              )
                ? data.logs
                : current.logs,

            settings:
              data.settings
                ? {
                    ...current.settings,
                    ...data.settings,
                  }
                : current.settings,

            visitors:
              typeof data.visitors ===
              "number"
                ? data.visitors
                : current.visitors,

            recycleBin:
              Array.isArray(
                data.recycleBin,
              )
                ? data.recycleBin
                : current.recycleBin,
          });

          get().addLog(
            "Backup Restore",
            "Restored portal data from an NSP backup file.",
          );
        },

        restoreDeleted: (
          id,
        ) => {
          const current =
            get();

          const item =
            (
              current.recycleBin ??
              []
            ).find(
              (row) => row.id === id,
            );

          if (!item) return;

          if (
            item.kind ===
            "volunteer"
          ) {
            set({
              volunteers:
                dedupeVolunteers([
                  ...current.volunteers,
                  item.data as Volunteer,
                ]),
            });
          }

          if (
            item.kind === "event"
          ) {
            set({
              events:
                dedupeEvents([
                  ...current.events,
                  item.data as NssEvent,
                ]),
            });
          }

          if (
            item.kind === "notice"
          ) {
            set({
              notices:
                dedupeNotices([
                  ...current.notices,
                  item.data as Notice,
                ]),
            });
          }

          if (
            item.kind ===
            "gallery"
          ) {
            set({
              gallery:
                dedupeGallery([
                  ...current.gallery,
                  item.data as GalleryItem,
                ]),
            });
          }

          if (
            item.kind === "press"
          ) {
            set({
              pressReports:
                dedupePressReports([
                  ...(current.pressReports ??
                    []),
                  item.data as PressReportUpload,
                ]),
            });
          }

          if (item.kind === "certificate") {
            const cert = item.data as IssuedCertificate;
            const have = (current.certificates ?? []).some((row) => row.id === cert.id);
            if (!have) {
              set({ certificates: [...(current.certificates ?? []), cert] });
            }
          }

          set({
            recycleBin:
              current.recycleBin.filter(
                (row) =>
                  row.id !== id,
              ),
          });

          get().addLog(
            "Recycle restore",
            `Restored ${item.label} from Recycle Bin.`,
          );
        },

        permanentlyDelete: (id) => {
          const item = (get().recycleBin ?? []).find((row) => row.id === id);
          if (item?.kind === "gallery" && "mediaKey" in item.data && item.data.mediaKey) {
            void deleteMedia(item.data.mediaKey);
          }
          if (item?.kind === "press" && "mediaKey" in item.data && item.data.mediaKey) {
            void deleteMedia(item.data.mediaKey);
          }
          if (item) {
            const data = item.data as { id?: string; volunteerId?: string; mobile?: string; fullName?: string; name?: string; title?: string };
            const keys = [data.id || "", data.volunteerId || "", data.mobile || "", data.fullName || "", data.name || "", data.title || "", item.label];
            rememberPurged(keys);
            purgeCloud(keys);
          }
          set({
            recycleBin: (get().recycleBin ?? []).filter((row) => row.id !== id),
          });
        },

        emptyRecycleBin: () => {
          const keys = (get().recycleBin ?? []).flatMap((item) => {
            const data = item.data as { id?: string; volunteerId?: string; mobile?: string; fullName?: string; name?: string; title?: string };
            return [data.id || "", data.volunteerId || "", data.mobile || "", data.fullName || "", data.name || "", data.title || "", item.label];
          });
          rememberPurged(keys);
          purgeCloud(keys);
          set({ recycleBin: [] });
        },

        awardBadge: (
          volunteerId,
          badge,
        ) => {
          const clean =
            badge.trim();

          if (!clean) return;

          set({
            volunteers:
              get().volunteers.map(
                (v) =>
                  v.id ===
                  volunteerId
                    ? {
                        ...v,

                        badges:
                          Array.from(
                            new Set([
                              ...(v.badges ??
                                []),
                              clean,
                            ]),
                          ),
                      }
                    : v,
              ),
          });

          get().addLog(
            "Badge awarded",
            `${badge} awarded to a volunteer.`,
          );
        },

        removeBadge: (
          volunteerId,
          badge,
        ) =>
          set({
            volunteers:
              get().volunteers.map(
                (v) =>
                  v.id ===
                  volunteerId
                    ? {
                        ...v,

                        badges:
                          (
                            v.badges ??
                            []
                          ).filter(
                            (b) =>
                              b !== badge,
                          ),
                      }
                    : v,
              ),
          }),

        generateCertificates: (
          eventId,
          volunteerIds,
        ) => {
          const events =
            get().events ?? [];
          const existing =
            assignSequentialIds(
              get().certificates ??
                [],
              events,
            );
          const have = new Set(
            existing
              .filter(
                (c) =>
                  c.eventId ===
                  eventId,
              )
              .map(
                (c) => c.volunteerId,
              ),
          );
          const now =
            new Date().toISOString();
          const event = events.find(
            (e) => e.id === eventId,
          );
          const year = event
            ? certificateYear(event)
            : "2026";
          let seq =
            nextCertificateSeq(
              existing,
            );
          const added: IssuedCertificate[] =
            volunteerIds
              .filter(
                (id) => !have.has(id),
              )
              .map((id) =>
                get().volunteers.find(
                  (v) => v.id === id,
                ),
              )
              .filter(
                (v): v is Volunteer =>
                  Boolean(v),
              )
              .sort(byFullName)
              .map((volunteer) => {
                const certificateId = `NSS/${year}/${String(volunteer.volunteerId || seq).replace(/\s+/g, "").slice(0, 24)}`;
                seq += 1;
                return {
                  id: `crt-${eventId}-${volunteer.id}`,
                  volunteerId:
                    volunteer.id,
                  eventId,
                  generatedAt: now,
                  sentAt: null,
                  certificateId,
                  printReady: true,
                };
              });
          set({
            certificates: [
              ...existing,
              ...added,
            ],
          });
          if (added.length) get().addLog("Certificate", `Issued ${added.length} certificate(s).`);
          return added;
        },

        sendCertificates: (
          ids,
        ) => {
          const want =
            new Set(ids);

          const now =
            new Date()
              .toISOString();

          let sent = 0;

          set({
            certificates:
              (
                get()
                  .certificates ??
                []
              ).map((c) => {
                if (
                  !want.has(c.id) ||
                  c.sentAt
                ) {
                  return c;
                }

                sent += 1;

                return {
                  ...c,
                  sentAt: now,
                };
              }),
          });

          return sent;
        },

        deleteCertificate: (id) => {
          const current = get();
          const item = (current.certificates ?? []).find((c) => c.id === id);
          if (!item) return false;
          const keys = [item.id, item.certificateId || ""];
          rememberPurged(keys);
          purgeCloud(keys);
          set({
            certificates: (current.certificates ?? []).filter((c) => c.id !== id),
          });
          get().addLog("Permanent delete", `Certificate ${item.certificateId || item.id} was permanently deleted.`);
          return true;
        },
      }),

      {
        name: STORAGE_DATA,

        skipHydration: true,

        storage:
          portalStorage,

        partialize: (s) => ({
          volunteers: (s.volunteers ?? []).map((v) => ({
            ...v,
            photoUrl: v.photoUrl && ((v.photoUrl.startsWith("https://") && v.photoUrl.length < 8000) || (v.photoUrl.startsWith("data:image/") && v.photoUrl.length < 40000)) ? v.photoUrl : "",
          })),

          events:
            s.events,

          attendance:
            s.attendance,

          eventRsvps:
            s.eventRsvps ?? [],

          notices:
            s.notices,

          gallery:
            (
              s.gallery ?? []
            ).map((g) => ({
              ...g,

              src:
                g.src?.startsWith(
                  "data:",
                )
                  ? ""
                  : g.src,
            })),

          certificates:
            s.certificates ?? [],

          pressReports:
            s.pressReports ?? [],

          logs:
            (
              s.logs ?? []
            ).slice(0, 250),

          settings: {
            ...s.settings,
            poPhoto: s.settings.poPhoto?.startsWith("data:") ? "" : s.settings.poPhoto,
            principalPhoto: s.settings.principalPhoto?.startsWith("data:") ? "" : s.settings.principalPhoto,
            poSignature: s.settings.poSignature?.startsWith("data:") ? "" : s.settings.poSignature,
            principalSignature: s.settings.principalSignature?.startsWith("data:") ? "" : s.settings.principalSignature,
          },

          visitors:
            s.visitors,

          liveVolunteerCount:
            s.liveVolunteerCount ?? 0,

          liveHours:
            s.liveHours ?? 0,

          liveBest:
            s.liveBest,

          recycleBin:
            s.recycleBin ?? [],

          purgedKeys:
            s.purgedKeys ?? [],
        }),

        merge: (
          persisted,
          current,
        ) => {
          try {
            return mergePortalState(
              persisted,
              current,
            );
          } catch {
            return current;
          }
        },
      },
    ),
);

export function rsvpOf(
  state: PortalState,
  volunteerId: string,
  eventId: string,
) {
  return (
    state.eventRsvps ?? []
  ).find(
    (r) =>
      r.volunteerId ===
        volunteerId &&
      r.eventId === eventId,
  );
}

export function volunteerHours(state: PortalState, volunteerId: string) {
  const person = (state.volunteers ?? []).find((v) => v.id === volunteerId || v.volunteerId === volunteerId);
  const keys = new Set([volunteerId, person?.id || "", person?.volunteerId || ""].filter(Boolean));
  const map = new Map((state.events ?? []).map((e) => [e.id, e]));
  return (state.attendance ?? []).reduce((sum, row) => {
    if (!keys.has(row.volunteerId) || !row.present) return sum;
    return sum + (map.get(row.eventId)?.hours ?? 0);
  }, 0);
}

export function liveServiceHours(state: PortalState) {
  const computed = totalServiceHours(state);
  const reported = state.settings?.reportedServiceHours ?? 0;
  const live = state.liveHours ?? 0;
  return Math.max(computed, live, reported);
}

export function totalServiceHours(
  state: PortalState,
) {
  const map =
    new Map(
      (state.events ?? []).map(
        (e) => [e.id, e],
      ),
    );

  return (
    state.attendance ?? []
  ).reduce(
    (sum, row) => {
      if (!row.present) {
        return sum;
      }

      return (
        sum +
        (
          map.get(
            row.eventId,
          )?.hours ?? 0
        )
      );
    },
    0,
  );
}

function personKeys(id: string, mobile?: string) {
  const keys = new Set<string>();
  const add = (value: string | undefined) => {
    const raw = String(value ?? "").trim();
    if (raw) keys.add(raw);
    const d = digits(raw);
    if (d.length >= 8) keys.add(d);
    if (d.length >= 10) keys.add(d.slice(-10));
  };
  add(id);
  add(mobile);
  return keys;
}

function attendanceMatchesVolunteer(
  row: AttendanceRecord,
  volunteer: Volunteer,
) {
  const keys = personKeys(
    volunteer.id,
    volunteer.mobile,
  );
  personKeys(volunteer.volunteerId).forEach(
    (key) => keys.add(key),
  );
  return [...personKeys(row.volunteerId)].some(
    (key) => keys.has(key),
  );
}

export function attendanceOf(
  state: PortalState,
  volunteerId: string,
  eventId: string,
) {
  const volunteer =
    (state.volunteers ?? []).find(
      (row) =>
        row.id === volunteerId ||
        row.volunteerId === volunteerId,
    );

  return (
    state.attendance ?? []
  ).find((a) => {
    if (a.eventId !== eventId) {
      return false;
    }
    if (a.volunteerId === volunteerId) {
      return true;
    }
    return volunteer
      ? attendanceMatchesVolunteer(
          a,
          volunteer,
        )
      : false;
  });
}

export function presentVolunteers(
  state: PortalState,
  eventId: string,
) {
  const present = (
    state.attendance ?? []
  ).filter(
    (a) =>
      a.eventId === eventId &&
      a.present,
  );

  return [
    ...(state.volunteers ?? []),
  ]
    .filter((v) =>
      present.some((row) =>
        attendanceMatchesVolunteer(
          row,
          v,
        ),
      ),
    )
    .sort(
      (a, b) =>
        a.fullName.localeCompare(
          b.fullName,
          "en",
          {
            sensitivity:
              "base",
          },
        ),
    );
}

export function certificateOf(
  state: PortalState,
  volunteerId: string,
  eventId: string,
) {
  return (
    state.certificates ?? []
  ).find(
    (c) =>
      c.volunteerId ===
        volunteerId &&
      c.eventId === eventId,
  );
}

export function activeVolunteers(
  state: PortalState,
) {
  return [
    ...(state.volunteers ?? []),
  ]
    .filter(
      (v) =>
        v.status !== "alumni",
    )
    .sort(byFullName);
}

export function alumniVolunteers(
  state: PortalState,
) {
  return [
    ...(state.volunteers ?? []),
  ]
    .filter(
      (v) =>
        v.status === "alumni",
    )
    .sort(byFullName);
}

export function bestVolunteer(
  state: PortalState,
) {
  const list =
    activeVolunteers(state);

  if (!list.length) {
    return undefined;
  }

  return [...list].sort(
    (a, b) => {
      const ha =
        volunteerHours(
          state,
          a.id,
        );

      const hb =
        volunteerHours(
          state,
          b.id,
        );

      if (hb !== ha) {
        return hb - ha;
      }

      const aa =
        state.attendance.filter(
          (x) =>
            x.volunteerId ===
              a.id &&
            x.present,
        ).length;

      const ba =
        state.attendance.filter(
          (x) =>
            x.volunteerId ===
              b.id &&
            x.present,
        ).length;

      return ba - aa;
    },
  )[0];
}

export function volunteerRecord(
  state: PortalState,
  volunteerId: string,
) {
  const volunteer =
    state.volunteers.find(
      (v) =>
        v.id === volunteerId,
    );

  const hours =
    volunteerHours(
      state,
      volunteerId,
    );

  const marked =
    state.attendance.filter(
      (a) =>
        a.volunteerId ===
        volunteerId,
    );

  const present =
    marked.filter(
      (a) => a.present,
    ).length;

  const certs =
    (
      state.certificates ??
      []
    ).filter(
      (c) =>
        c.volunteerId ===
        volunteerId,
    );

  return {
    volunteer,
    hours,
    present,
    marked: marked.length,

    pct: marked.length
      ? Math.round(
          (present /
            marked.length) *
            100,
        )
      : 0,

    certs,

    isBest:
      bestVolunteer(
        state,
      )?.id ===
      volunteerId,
  };
}

export function rememberVolunteer(volunteer: Volunteer) {
  useNssStore.setState((state) => {
    const mobile = digits(volunteer.mobile).slice(-10);
    const same = (row: Volunteer) => {
      const rowMobile = digits(row.mobile).slice(-10);
      if (mobile.length === 10 && rowMobile === mobile) return true;
      if (
        row.volunteerId &&
        row.volunteerId === volunteer.volunteerId &&
        row.fullName === volunteer.fullName
      ) {
        return true;
      }
      return row.id === volunteer.id && row.fullName === volunteer.fullName;
    };
    const volunteers = (state.volunteers ?? []).filter((row) => !same(row));
    volunteers.push({
      ...volunteer,
      fullName: titleFirstName(volunteer.fullName),
    });
    volunteers.sort(byFullName);
    const active = volunteers.filter((row) => row.status !== "alumni").length;
    return {
      volunteers,
      liveVolunteerCount: Math.max(state.liveVolunteerCount ?? 0, active),
    };
  });
}
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  OLD_SLOGAN_GU,
  SLOGAN_GU,
  STORAGE_DATA,
  STORAGE_SESSION,
} from "./constants";
import { createSeedState } from "./seed";
import { academicYear, byFullName, padId, parseDob, titleFirstName } from "./format";
import { deleteMedia } from "./media";
import { certificateSerial } from "./certificates";
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

function dedupeVolunteers(
  items: Volunteer[],
) {
  return uniqueBy(items, (v) => {
    const mobile = digits(v.mobile).slice(-10);

    if (mobile.length === 10) {
      return `mobile:${mobile}`;
    }

    if (v.enrollment) {
      return `enrollment:${v.enrollment}`;
    }

    return `id:${v.id}`;
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
    getItem: (name: string) => {
      if (typeof window === "undefined") {
        return null;
      }

      try {
        const raw =
          localStorage.getItem(name);

        if (raw) {
          return unwrapPersisted(raw);
        }

        return readLegacyPortalJson();
      } catch {
        return null;
      }
    },

    setItem: (
      name: string,
      value: string,
    ) => {
      if (typeof window === "undefined") {
        return;
      }

      localStorage.setItem(
        name,
        value,
      );
    },

    removeItem: (name: string) => {
      if (typeof window === "undefined") {
        return;
      }

      localStorage.removeItem(name);
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

    events: dedupeEvents(
      asArray<NssEvent>(
        p.events,
        current.events,
      ),
    ),

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
    ),

    gallery,

    certificates: seed
      ? []
      : dedupeCertificates(
          asArray<IssuedCertificate>(
            p.certificates,
            [],
          ),
        ),

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

            next.volunteers =
              dedupeVolunteers(
                cloud.volunteers
                  .map((row) => {
                    const prev =
                      localById.get(
                        row.id,
                      ) ||
                      localByMobile.get(
                        digits(
                          row.mobile,
                        ).slice(-10),
                      );

                    return {
                      ...row,

                      volunteerId:
                        prev?.volunteerId ||
                        row.volunteerId,

                      enrollment:
                        prev?.enrollment ||
                        row.enrollment,

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
                        prev?.photoUrl ||
                        (
                          row.photoUrl &&
                          row.photoUrl
                            .length < 120000
                        )
                          ? row.photoUrl
                          : "",

                      emergencyContact:
                        row.emergencyContact ||
                        prev?.emergencyContact,

                      loginPassword:
                        prev?.loginPassword ||
                        row.loginPassword,

                      mpin:
                        prev?.mpin,

                      webauthnId:
                        prev?.webauthnId,
                    };
                  })
                  .sort(byFullName),
              );

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
                      digits(
                        v.mobile,
                      ).slice(-10) ===
                      digits(
                        old.mobile,
                      ).slice(-10),
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

          if (
            Array.isArray(
              cloud.events,
            ) &&
            cloud.events.length
          ) {
            const localExtra =
              current.events.filter(
                (e) =>
                  e.id.startsWith(
                    "evt-",
                  ) &&
                  !cloud.events?.some(
                    (c) =>
                      c.id === e.id ||
                      c.name === e.name,
                  ),
              );

            next.events =
              dedupeEvents([
                ...cloud.events,
                ...localExtra,
              ]);
          }

          if (
            Array.isArray(
              cloud.attendance,
            ) &&
            cloud.attendance.length
          ) {
            const seedishNow =
              looksLikeSeed(
                current.volunteers,
              );

            const localAttendance =
              next.attendance ??
              (seedishNow
                ? []
                : current.attendance ??
                  []);

            next.attendance =
              dedupeAttendance([
                ...cloud.attendance,
                ...localAttendance,
              ]);
          }

          if (
            Array.isArray(
              cloud.notices,
            ) &&
            cloud.notices.length
          ) {
            next.notices =
              dedupeNotices(
                cloud.notices,
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

            next.gallery =
              dedupeGallery([
                ...localKeep,
                ...cloud.gallery.filter(
                  (g) =>
                    !localIds.has(
                      g.id,
                    ) &&
                    !g.mediaKey &&
                    g.src,
                ),
              ]);
          } else if (
            (
              current.gallery ??
              []
            ).some((g) =>
              g.src?.startsWith(
                "/images/gallery-",
              ),
            )
          ) {
            next.gallery =
              (
                current.gallery ??
                []
              ).filter(
                (g) =>
                  g.mediaKey ||
                  (
                    g.src &&
                    !g.src.startsWith(
                      "/images/gallery-",
                    )
                  ),
              );
          }

          if (
            typeof cloud.visitors ===
              "number" &&
            cloud.visitors > 0
          ) {
            next.visitors =
              cloud.visitors;
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
          const current =
            get();

          const item =
            current.volunteers.find(
              (v) => v.id === id,
            );

          if (!item) return;

          set({
            volunteers:
              current.volunteers.filter(
                (v) => v.id !== id,
              ),

            attendance:
              current.attendance.filter(
                (a) =>
                  a.volunteerId !== id,
              ),

            eventRsvps:
              (
                current.eventRsvps ??
                []
              ).filter(
                (r) =>
                  r.volunteerId !== id,
              ),

            certificates:
              current.certificates.filter(
                (c) =>
                  c.volunteerId !== id,
              ),

            recycleBin: [
              {
                id:
                  `del-${Date.now()}`,

                kind:
                  "volunteer" as const,

                label:
                  item.fullName,

                deletedAt:
                  new Date()
                    .toISOString(),

                data: item,
              },

              ...(current.recycleBin ??
                []),
            ].slice(0, 200),
          });

          get().addLog(
            "Moved to recycle bin",
            `Volunteer ${item.fullName} was moved to Recycle Bin.`,
          );
        },

        addEvent: (input) => {
          const event: NssEvent =
            {
              ...input,

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
          const current =
            get();

          const item =
            current.events.find(
              (e) => e.id === id,
            );

          if (!item) return;

          set({
            events:
              current.events.filter(
                (e) => e.id !== id,
              ),

            attendance:
              current.attendance.filter(
                (a) =>
                  a.eventId !== id,
              ),

            eventRsvps:
              (
                current.eventRsvps ??
                []
              ).filter(
                (r) =>
                  r.eventId !== id,
              ),

            certificates:
              current.certificates.filter(
                (c) =>
                  c.eventId !== id,
              ),

            recycleBin: [
              {
                id:
                  `del-${Date.now()}`,

                kind:
                  "event" as const,

                label:
                  item.name,

                deletedAt:
                  new Date()
                    .toISOString(),

                data: item,
              },

              ...(current.recycleBin ??
                []),
            ].slice(0, 200),
          });

          get().addLog(
            "Moved to recycle bin",
            `Event ${item.name} was moved to Recycle Bin.`,
          );
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
          const current =
            get();

          const item =
            current.notices.find(
              (n) => n.id === id,
            );

          if (!item) return;

          set({
            notices:
              current.notices.filter(
                (n) => n.id !== id,
              ),

            recycleBin: [
              {
                id:
                  `del-${Date.now()}`,

                kind:
                  "notice" as const,

                label:
                  item.title,

                deletedAt:
                  new Date()
                    .toISOString(),

                data: item,
              },

              ...(current.recycleBin ??
                []),
            ].slice(0, 200),
          });

          get().addLog(
            "Moved to recycle bin",
            `Notice ${item.title} was moved to Recycle Bin.`,
          );
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

          set({
            pressReports:
              (
                current.pressReports ??
                []
              ).filter(
                (r) => r.id !== id,
              ),

            recycleBin: [
              {
                id:
                  `del-${Date.now()}`,

                kind:
                  "press" as const,

                label:
                  item.name,

                deletedAt:
                  new Date()
                    .toISOString(),

                data: item,
              },

              ...(current.recycleBin ??
                []),
            ].slice(0, 200),
          });

          get().addLog(
            "Moved to recycle bin",
            `Press report ${item.name} was moved to Recycle Bin.`,
          );
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

          set({
            gallery:
              (
                current.gallery ??
                []
              ).filter(
                (g) => g.id !== id,
              ),

            recycleBin: [
              {
                id:
                  `del-${Date.now()}`,

                kind:
                  "gallery" as const,

                label:
                  item.caption ||
                  "Gallery media",

                deletedAt:
                  new Date()
                    .toISOString(),

                data: item,
              },

              ...(current.recycleBin ??
                []),
            ].slice(0, 200),
          });

          get().addLog(
            "Moved to recycle bin",
            `Gallery media was moved to Recycle Bin.`,
          );
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

        deleteVolunteers: (
          ids,
        ) => {
          const want =
            new Set(ids);

          const current =
            get();

          const removed =
            current.volunteers.filter(
              (v) =>
                want.has(v.id),
            );

          if (!removed.length) {
            return 0;
          }

          set({
            volunteers:
              current.volunteers.filter(
                (v) =>
                  !want.has(v.id),
              ),

            attendance:
              current.attendance.filter(
                (a) =>
                  !want.has(
                    a.volunteerId,
                  ),
              ),

            eventRsvps:
              (
                current.eventRsvps ??
                []
              ).filter(
                (r) =>
                  !want.has(
                    r.volunteerId,
                  ),
              ),

            certificates:
              current.certificates.filter(
                (c) =>
                  !want.has(
                    c.volunteerId,
                  ),
              ),

            recycleBin: [
              ...removed.map(
                (item, i) => ({
                  id:
                    `del-${Date.now()}-${i}`,

                  kind:
                    "volunteer" as const,

                  label:
                    item.fullName,

                  deletedAt:
                    new Date()
                      .toISOString(),

                  data: item,
                }),
              ),

              ...(current.recycleBin ??
                []),
            ].slice(0, 200),
          });

          get().addLog(
            "Batch Deletion",
            `Moved ${removed.length} volunteer(s) to Recycle Bin.`,
          );

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
                ? data.certificates
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

        permanentlyDelete: (
          id,
        ) => {
          const item =
            (
              get().recycleBin ??
              []
            ).find(
              (row) => row.id === id,
            );

          if (
            item?.kind ===
              "gallery" &&
            "mediaKey" in
              item.data &&
            item.data.mediaKey
          ) {
            void deleteMedia(
              item.data.mediaKey,
            );
          }

          if (
            item?.kind ===
              "press" &&
            "mediaKey" in
              item.data &&
            item.data.mediaKey
          ) {
            void deleteMedia(
              item.data.mediaKey,
            );
          }

          set({
            recycleBin:
              (
                get()
                  .recycleBin ??
                []
              ).filter(
                (row) =>
                  row.id !== id,
              ),
          });
        },

        emptyRecycleBin: () =>
          set({
            recycleBin: [],
          }),

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
          const existing =
            get().certificates ??
            [];

          const have =
            new Set(
              existing
                .filter(
                  (c) =>
                    c.eventId ===
                    eventId,
                )
                .map(
                  (c) =>
                    c.volunteerId,
                ),
            );

          const now =
            new Date()
              .toISOString();

          const added:
            IssuedCertificate[] =
            volunteerIds
              .filter(
                (id) =>
                  !have.has(id),
              )
              .map(
                (volunteerId) => {
                  const volunteer =
                    get().volunteers.find(
                      (v) =>
                        v.id ===
                        volunteerId,
                    );

                  const event =
                    get().events.find(
                      (e) =>
                        e.id ===
                        eventId,
                    );

                  return {
                    id: `crt-${eventId}-${volunteerId}`,

                    volunteerId,

                    eventId,

                    generatedAt: now,

                    sentAt: null,

                    certificateId:
                      volunteer && event
                        ? certificateSerial(
                            volunteer,
                            event,
                          )
                        : undefined,

                    printReady: true,
                  };
                },
              );

          if (added.length) {
            set({
              certificates: [
                ...existing,
                ...added,
              ],
            });
          }

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
      }),

      {
        name: STORAGE_DATA,

        skipHydration: true,

        storage:
          portalStorage,

        partialize: (s) => ({
          volunteers:
            s.volunteers,

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

          settings:
            s.settings,

          visitors:
            s.visitors,

          recycleBin:
            s.recycleBin ?? [],
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

export function volunteerHours(
  state: PortalState,
  volunteerId: string,
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
      if (
        row.volunteerId !==
          volunteerId ||
        !row.present
      ) {
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

export function attendanceOf(
  state: PortalState,
  volunteerId: string,
  eventId: string,
) {
  return (
    state.attendance ?? []
  ).find(
    (a) =>
      a.volunteerId ===
        volunteerId &&
      a.eventId === eventId,
  );
}

export function presentVolunteers(
  state: PortalState,
  eventId: string,
) {
  const ids =
    new Set(
      (
        state.attendance ?? []
      )
        .filter(
          (a) =>
            a.eventId ===
              eventId &&
            a.present,
        )
        .map(
          (a) =>
            a.volunteerId,
        ),
    );

  return [
    ...(state.volunteers ?? []),
  ]
    .filter((v) =>
      ids.has(v.id),
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
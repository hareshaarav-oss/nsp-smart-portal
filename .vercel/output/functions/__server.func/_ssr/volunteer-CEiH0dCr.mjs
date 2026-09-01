import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, b as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as idCardName, B as useNssStore, C as daysUntilBirthday, D as formatLongDate, H as volunteerHours, I as rsvpOf, N as parseDob, R as todayIso, f as attendanceOf, m as blobToDataUrl, p as bestVolunteer, x as compressPassport } from "./utils-BIiJ-s-U.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Badge } from "./badge-BMh2Hxac.mjs";
import { t as Input } from "./input-CRT4sBU_.mjs";
import { C as LogOut, E as KeyRound, M as Fingerprint, Q as Cake, R as CreditCard, a as Star, tt as Award, w as Lock, y as Pencil } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as openCertificateDocument, n as htmlForCertificate } from "./certificates-BpqtJ9x9.mjs";
import { g as Button, h as useSessionStore, o as findSessionVolunteer, p as registerFingerprint, s as isOfficer } from "./router-Cdyjb-lJ.mjs";
import { t as AppShell } from "./shell-DsfHbM4s.mjs";
import { t as Label } from "./label-Bl0lQyM7.mjs";
import { a as XAxis, c as Bar, d as Tooltip, i as YAxis, n as BarChart, s as CartesianGrid, u as ResponsiveContainer } from "../_libs/recharts+[...].mjs";
import { t as openIdCard } from "./id-card-BhQsWlP5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/volunteer-CEiH0dCr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VolunteerDash() {
	const session = useSessionStore((s) => s.session);
	const setSession = useSessionStore((s) => s.setSession);
	const volunteers = useNssStore((s) => s.volunteers) ?? [];
	const events = useNssStore((s) => s.events) ?? [];
	const notices = useNssStore((s) => s.notices) ?? [];
	const attendance = useNssStore((s) => s.attendance) ?? [];
	const certificates = useNssStore((s) => s.certificates) ?? [];
	const settings = useNssStore((s) => s.settings);
	const updateVolunteer = useNssStore((s) => s.updateVolunteer);
	const setEventRSVP = useNssStore((s) => s.setEventRSVP);
	const bestId = useNssStore((s) => bestVolunteer(s)?.id ?? "");
	const portalState = useNssStore();
	const [panel, setPanel] = (0, import_react.useState)("none");
	const [cur, setCur] = (0, import_react.useState)("");
	const [next, setNext] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [wait, setWait] = (0, import_react.useState)(true);
	const meRef = (0, import_react.useRef)(void 0);
	(0, import_react.useEffect)(() => {
		const t = window.setTimeout(() => setWait(false), 1600);
		return () => window.clearTimeout(t);
	}, []);
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/login",
		search: { role: "volunteer" }
	});
	if (isOfficer(session)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/po" });
	const meFound = findSessionVolunteer(volunteers, session);
	if (meFound) meRef.current = meFound;
	const me = meFound ?? meRef.current;
	if (!me) {
		if (wait) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
			eyebrow: "NSS STUDENT DASHBOARD",
			current: "dashboard",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 py-16 text-center text-sm text-muted-foreground",
				children: "Loading your profile…"
			})
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
			to: "/login",
			search: { role: "volunteer" }
		});
	}
	const hours = volunteerHours(portalState, me.id);
	const myAtt = attendance.filter((a) => a.volunteerId === me.id);
	const present = myAtt.filter((a) => a.present).length;
	const attPct = myAtt.length ? Math.round(present / myAtt.length * 100) : 0;
	const myNotices = notices.filter((n) => {
		if (n.audience === "leaders") return me.nssRole === "Leader";
		if (n.audience === "girls") return me.gender === "Female";
		if (n.audience === "boys") return me.gender === "Male";
		return true;
	});
	const upcoming = [...events].filter((e) => {
		if (e.status === "cancelled") return false;
		if (e.audience === "girls" && me.gender !== "Female") return false;
		if (e.audience === "boys" && me.gender !== "Male") return false;
		if (e.audience === "leaders" && me.nssRole !== "Leader") return false;
		return e.status === "upcoming" || e.date >= todayIso();
	}).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
	const mine = certificates.filter((c) => c.volunteerId === me.id && c.sentAt).map((c) => {
		const event = events.find((e) => e.id === c.eventId);
		return event ? {
			cert: c,
			event
		} : null;
	}).filter((row) => Boolean(row)).sort((a, b) => b.event.date.localeCompare(a.event.date));
	const isBest = bestId === me.id;
	const myBirthday = parseDob(me.dob);
	const birthdayDays = myBirthday ? daysUntilBirthday(myBirthday, todayIso()) : null;
	function changePassword(e) {
		e.preventDefault();
		if (!me) return;
		const expected = me.loginPassword || me.mobile;
		if (cur.trim() !== expected && cur.trim() !== me.mobile) {
			toast.error("Current password is incorrect.");
			return;
		}
		if (next.trim().length < 6) {
			toast.error("New password must be at least 6 characters.");
			return;
		}
		if (next !== confirm) {
			toast.error("New password and confirm password do not match.");
			return;
		}
		updateVolunteer(me.id, { loginPassword: next.trim() });
		toast.success("Password updated. Use it the next time you sign in.");
		setCur("");
		setNext("");
		setConfirm("");
		setPanel("none");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		eyebrow: "NSS STUDENT DASHBOARD",
		current: "dashboard",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-5xl space-y-6 px-4 pb-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "overflow-hidden rounded-2xl bg-navy p-5 text-paper shadow-md md:p-7",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "saffron",
									onClick: () => void openIdCard(me, settings),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, {}), "Digital ID Card"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "bg-sky-600 text-white hover:bg-sky-700",
									onClick: () => setPanel(panel === "edit" ? "none" : "edit"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {}), "Edit Profile"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "bg-forest text-primary-foreground hover:bg-forest/90",
									onClick: () => setPanel(panel === "password" ? "none" : "password"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {}), "Change Password"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "danger",
									onClick: () => {
										setSession(null);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {}), "Logout"]
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center",
						children: [me.photoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: me.photoUrl,
							alt: "",
							className: "h-28 w-24 rounded-xl object-cover ring-4 ring-white/20"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-28 w-24 items-center justify-center rounded-xl bg-white/15 font-display text-2xl",
							children: me.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center sm:text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-2 flex flex-wrap justify-center gap-2 sm:justify-start",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "rounded-full bg-white/15 px-3 py-1 text-xs",
											children: [
												me.course,
												" · Sem ",
												me.semester
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "rounded-full bg-white/15 px-3 py-1 text-xs",
											children: ["Role: ", me.nssRole]
										}),
										isBest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 rounded-full bg-saffron px-3 py-1 text-xs font-semibold text-saffron-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3" }), " Best volunteer"]
										}) : null
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-display text-3xl font-semibold",
									children: idCardName(me.fullName)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-paper/70",
									children: [
										me.volunteerId,
										" · ",
										me.enrollment,
										" · ",
										me.unit
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-paper/60",
									children: settings.collegeName
								})
							]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Attendance",
							value: `${attPct}%`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "NSS hours",
							value: String(hours)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Certificates",
							value: String(mine.length)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Activities present",
							value: String(present)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 lg:grid-cols-[1.35fr_1fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-md",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "My Attendance & Service Progress" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-64",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
								width: "100%",
								height: "100%",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
									data: events.filter((e) => myAtt.some((a) => a.eventId === e.id)).map((e) => ({
										name: e.name.length > 12 ? e.name.slice(0, 12) + "…" : e.name,
										attendance: attendanceOf(portalState, me.id, e.id)?.present ? 100 : 0,
										hours: attendanceOf(portalState, me.id, e.id)?.present ? e.hours : 0
									})),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, { strokeDasharray: "3 3" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
											dataKey: "name",
											hide: true
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
											dataKey: "attendance",
											name: "Attendance %"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
											dataKey: "hours",
											name: "Hours"
										})
									]
								})
							})
						}) })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-md",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "My Progress" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressRow, {
									label: "Attendance",
									value: attPct,
									suffix: "%"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressRow, {
									label: "Regular service hours",
									value: Math.min(100, Math.round(hours / Math.max(1, settings.serviceHourTarget) * 100)),
									suffix: `% of ${settings.serviceHourTarget} hrs target`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressRow, {
									label: "240-hour NSS progress",
									value: Math.min(100, Math.round(hours / 240 * 100)),
									suffix: `${hours} / 240 hours completed`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressRow, {
									label: "Certificates",
									value: Math.min(100, mine.length * 20),
									suffix: `${mine.length} earned`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-saffron/30 bg-saffron/5 p-3 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Achievement badges" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 flex flex-wrap gap-2",
										children: [
											present >= 5 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: "forest",
												children: "Attendance Champion"
											}) : null,
											hours >= 40 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: "saffron",
												children: "Community Service"
											}) : null,
											hours >= 120 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: "navy",
												children: "Service Milestone"
											}) : null,
											isBest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: "saffron",
												children: "Best Volunteer"
											}) : null,
											present === 0 && hours === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "Participate in activities to earn badges."
											}) : null
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl bg-muted p-3 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "NSS Impact" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-muted-foreground",
										children: "Keep participating in activities to improve your attendance, service hours and achievements."
									})]
								})
							]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 lg:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Recent Activity Table" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[520px] text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "border-b border-border text-left text-muted-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2",
										children: "Activity"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Date" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Attendance" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Hours" })
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: events.filter((e) => myAtt.some((a) => a.eventId === e.id)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((e) => {
								const r = attendanceOf(portalState, me.id, e.id);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-border",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 font-medium",
											children: e.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatLongDate(e.date) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: r?.present ? "forest" : "danger",
											children: r?.present ? "Present" : "Absent"
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: r?.present ? e.hours : 0 })
									]
								}, e.id);
							}) })]
						})
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Upcoming Events & RSVP" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "space-y-3",
						children: upcoming.length ? upcoming.slice(0, 5).map((e) => {
							const rsvp = rsvpOf(portalState, me.id, e.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "saffron",
											children: "Upcoming"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-xs text-muted-foreground",
										children: [
											formatLongDate(e.date),
											e.endDate && e.endDate !== e.date ? ` – ${formatLongDate(e.endDate)}` : "",
											" · ",
											e.location
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: rsvp?.status === "will_attend" ? "forest" : "outline",
											onClick: () => setEventRSVP(me.id, e.id, "will_attend"),
											children: "🟢 હા, હું હાજર રહીશ"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: rsvp?.status === "will_not_attend" ? "danger" : "outline",
											onClick: () => setEventRSVP(me.id, e.id, "will_not_attend"),
											children: "🔴 ના, હું હાજર રહીશ નહીં"
										})]
									}),
									rsvp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 text-xs text-muted-foreground",
										children: ["Your response: ", rsvp.status === "will_attend" ? "Will Attend" : "Will Not Attend"]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-xs text-muted-foreground",
										children: "Please respond before the event."
									})
								]
							}, e.id);
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No upcoming events."
						})
					})] })]
				}),
				panel === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditProfile, { volunteerId: me.id }) : null,
				panel === "password" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4" }), "Change password"]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "grid gap-3 sm:max-w-md",
					onSubmit: changePassword,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Current password (registered mobile)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								value: cur,
								onChange: (e) => setCur(e.target.value),
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "New password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								value: next,
								onChange: (e) => setNext(e.target.value),
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Confirm new password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								value: confirm,
								onChange: (e) => setConfirm(e.target.value),
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							children: "Update password"
						})
					]
				}) })] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "MPIN and fingerprint"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Username is your first name in CAPITAL letters. Password is your registered mobile until you change it here — the new password is saved at once. You can also set a 4-digit MPIN or enable this phone’s fingerprint."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "flex flex-wrap items-end gap-2",
							onSubmit: (e) => {
								e.preventDefault();
								const pin = document.getElementById("mpin-set")?.value ?? "";
								if (!/^\d{4}$/.test(pin)) {
									toast.error("MPIN must be 4 digits.");
									return;
								}
								updateVolunteer(me.id, { mpin: pin });
								toast.success("MPIN saved. Use Login with MPIN next time.");
								const el = document.getElementById("mpin-set");
								if (el) el.value = "";
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "mpin-set",
									children: "Set 4-digit MPIN"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "mpin-set",
									inputMode: "numeric",
									placeholder: me.mpin ? "MPIN is set" : "1234"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "submit",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {}), "Save MPIN"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => {
								registerFingerprint(me).then((id) => {
									updateVolunteer(me.id, { webauthnId: id });
									toast.success("Fingerprint enabled on this device.");
								}).catch((error) => {
									toast.error(error instanceof Error ? error.message : "Fingerprint not available.");
								});
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fingerprint, {}), me.webauthnId ? "Fingerprint enabled — tap to re-link" : "Enable fingerprint login"]
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 lg:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Latest notices" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "space-y-3",
						children: myNotices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No notices yet."
						}) : myNotices.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: n.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "gu text-sm text-muted-foreground",
							children: n.body
						})] }, n.id))
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Upcoming events" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "space-y-2",
						children: upcoming.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No upcoming event."
						}) : upcoming.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-md border border-border px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: e.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									formatLongDate(e.date),
									" · ",
									e.location
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "saffron",
								children: "Upcoming"
							})]
						}, e.id))
					})] })]
				}),
				settings.birthdayShowOnDashboard !== false && myBirthday ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "border-saffron/40",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cake, { className: "size-5 text-saffron" }), " My Birthday"]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: formatLongDate(myBirthday)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm font-medium",
						children: birthdayDays === 0 ? "🎉 Today is your birthday!" : `🎂 ${birthdayDays} day${birthdayDays === 1 ? "" : "s"} to go`
					})] })]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "size-4 text-saffron" }), "My earned certificates"]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "space-y-2",
					children: mine.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Certificates issued by the Programme Officer will appear here."
					}) : mine.map(({ cert, event }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: event.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								formatLongDate(event.date),
								" · ",
								event.hours,
								" hrs · ",
								event.location
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => void htmlForCertificate(cert, me, event, settings).then(openCertificateDocument),
							children: "View / Print"
						})]
					}, cert.id))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Attendance history" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "space-y-2",
					children: events.slice().sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
						const rec = attendanceOf(portalState, me.id, e.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-md border border-border px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: e.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									formatLongDate(e.date),
									" · ",
									e.hours,
									" hrs"
								]
							})] }), rec ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: rec.present ? "forest" : "danger",
								children: rec.present ? "Present" : "Absent"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "muted",
								children: e.status === "upcoming" ? "Upcoming" : "Not marked"
							})]
						}, e.id);
					})
				})] })
			]
		})
	});
}
function EditProfile({ volunteerId }) {
	const volunteer = useNssStore.getState().volunteers.find((v) => v.id === volunteerId);
	const update = useNssStore.getState().updateVolunteer;
	const [form, setForm] = (0, import_react.useState)({
		mobile: volunteer?.mobile ?? "",
		email: volunteer?.email ?? "",
		address: volunteer?.address ?? "",
		bloodGroup: volunteer?.bloodGroup ?? "",
		abcId: volunteer?.abcId ?? "",
		myBharatId: volunteer?.myBharatId ?? "",
		emergencyContact: volunteer?.emergencyContact ?? "",
		photoUrl: volunteer?.photoUrl ?? ""
	});
	if (!volunteer) return null;
	async function onPhoto(file) {
		if (!file) return;
		const { blob } = await compressPassport(file);
		const url = await blobToDataUrl(blob);
		setForm((f) => ({
			...f,
			photoUrl: url
		}));
	}
	function save(e) {
		e.preventDefault();
		update(volunteerId, form);
		toast.success("Profile saved");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Edit profile" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "grid gap-3 sm:grid-cols-2",
		onSubmit: save,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sm:col-span-2 flex items-center gap-3",
				children: [form.photoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: form.photoUrl,
					alt: "",
					className: "h-20 w-16 rounded object-cover"
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "file",
					accept: "image/*",
					onChange: (e) => void onPhoto(e.target.files?.[0])
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Mobile",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.mobile,
					onChange: (e) => setForm({
						...form,
						mobile: e.target.value
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Email",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.email,
					onChange: (e) => setForm({
						...form,
						email: e.target.value
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Address",
				wide: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.address,
					onChange: (e) => setForm({
						...form,
						address: e.target.value
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Blood group",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.bloodGroup,
					onChange: (e) => setForm({
						...form,
						bloodGroup: e.target.value
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "ABC ID",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.abcId,
					onChange: (e) => setForm({
						...form,
						abcId: e.target.value
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "MY Bharat ID",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.myBharatId,
					onChange: (e) => setForm({
						...form,
						myBharatId: e.target.value
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Emergency contact",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.emergencyContact,
					onChange: (e) => setForm({
						...form,
						emergencyContact: e.target.value
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sm:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					children: "Save profile"
				})
			})
		]
	}) })] });
}
function Field({ label, children, wide }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `space-y-1.5 ${wide ? "sm:col-span-2" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
function ProgressRow({ label, value, suffix }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex justify-between text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [value, "%"] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 h-2 overflow-hidden rounded-full bg-muted",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full rounded-full bg-primary",
				style: { width: `${Math.max(0, Math.min(100, value))}%` }
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-[11px] text-muted-foreground",
			children: suffix
		})
	] });
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "pt-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-3xl font-semibold tabular-nums",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: label
		})]
	}) });
}
//#endregion
export { VolunteerDash as component };

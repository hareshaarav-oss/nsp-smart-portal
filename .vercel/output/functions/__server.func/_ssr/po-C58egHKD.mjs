import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, C as daysUntilBirthday, D as formatLongDate, R as todayIso, h as byFullName, j as isBirthdayOn, z as totalServiceHours } from "./utils-BIiJ-s-U.mjs";
import { n as CardContent, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Badge } from "./badge-BMh2Hxac.mjs";
import { A as GraduationCap, D as Images, P as FileSpreadsheet, U as ClipboardCheck, V as Clock, Z as CalendarDays, b as Newspaper, d as Settings, et as Bell, i as Trash2, nt as Activity, p as Search, t as Users, tt as Award } from "../_libs/lucide-react.mjs";
import { a as XAxis, c as Bar, d as Tooltip, i as YAxis, l as Pie, n as BarChart, o as Line, r as LineChart, s as CartesianGrid, t as PieChart, u as ResponsiveContainer } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/po-C58egHKD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PoHome() {
	const state = useNssStore();
	const [search, setSearch] = (0, import_react.useState)("");
	const today = todayIso();
	const volunteers = (0, import_react.useMemo)(() => state.volunteers.filter((v) => v.status !== "alumni").sort(byFullName), [state.volunteers]);
	const alumni = state.volunteers.filter((v) => v.status === "alumni").length;
	const hours = totalServiceHours(state);
	const upcoming = [...state.events].filter((e) => e.status === "upcoming" || e.date >= today).filter((e) => e.status !== "cancelled").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
	const completed = state.events.filter((e) => e.status === "completed").length;
	const presentRows = state.attendance.filter((a) => a.present).length;
	const totalRows = state.attendance.length;
	const attendancePct = totalRows ? Math.round(presentRows / totalRows * 100) : 0;
	const monthly = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		state.events.forEach((e) => {
			const key = e.date.slice(0, 7);
			const row = map.get(key) || {
				month: key,
				events: 0,
				hours: 0
			};
			row.events += 1;
			row.hours += state.attendance.filter((a) => a.eventId === e.id && a.present).length * (e.hours || 0);
			map.set(key, row);
		});
		return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-8);
	}, [state.events, state.attendance]);
	const unitData = ["Unit 1", "Unit 2"].map((unit) => ({
		name: unit,
		volunteers: volunteers.filter((v) => v.unit === unit).length
	}));
	const todayBirthdays = volunteers.filter((v) => v.dob && isBirthdayOn(v.dob, today)).length;
	const upcomingBirthdays = volunteers.filter((v) => v.dob && daysUntilBirthday(v.dob, today) > 0 && daysUntilBirthday(v.dob, today) <= 7).length;
	const rsvpPending = state.events.reduce((sum, e) => {
		const assigned = e.participantIds?.length ? e.participantIds : volunteers.map((v) => v.id);
		const responded = new Set((state.eventRsvps ?? []).filter((r) => r.eventId === e.id).map((r) => r.volunteerId));
		return sum + assigned.filter((id) => !responded.has(id)).length;
	}, 0);
	const alerts = [
		{
			label: "Low attendance records",
			value: volunteers.filter((v) => {
				const r = state.attendance.filter((a) => a.volunteerId === v.id);
				return r.length >= 3 && r.filter((a) => a.present).length / r.length < .75;
			}).length
		},
		{
			label: "Upcoming events",
			value: upcoming.length
		},
		{
			label: "Certificates issued",
			value: state.certificates.length
		},
		{
			label: "RSVP pending",
			value: rsvpPending
		},
		{
			label: "Birthdays today",
			value: todayBirthdays
		},
		{
			label: "Birthdays next 7 days",
			value: upcomingBirthdays
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-3xl bg-gradient-to-r from-navy via-primary to-forest p-6 text-paper shadow-xl md:p-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold tracking-[.22em] text-paper/70",
							children: "NSS COMMAND CENTER"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-2 font-display text-3xl font-bold",
							children: "Admin Dashboard"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-paper/75",
							children: "Live overview of volunteers, attendance, events, service hours and reports."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "saffron",
						children: "Live portal data"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroStat, {
							icon: Users,
							value: volunteers.length,
							label: "Volunteers"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroStat, {
							icon: GraduationCap,
							value: alumni,
							label: "Alumni"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroStat, {
							icon: ClipboardCheck,
							value: `${attendancePct}%`,
							label: "Attendance"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroStat, {
							icon: Clock,
							value: hours,
							label: "Service Hours"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroStat, {
							icon: CalendarDays,
							value: state.events.length,
							label: "Events"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroStat, {
							icon: Users,
							value: state.visitors,
							label: "Visitors"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-lg font-semibold",
							children: "Smart Search"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: search,
							onChange: (e) => setSearch(e.target.value),
							className: "h-10 flex-1 rounded-md border border-border bg-card px-3 text-sm",
							placeholder: "Search student, Volunteer ID, event, certificate, report…"
						})
					}),
					search.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid gap-2 md:grid-cols-2",
						children: [
							state.volunteers.filter((v) => `${v.fullName} ${v.volunteerId} ${v.mobile}`.toLowerCase().includes(search.toLowerCase())).slice(0, 5).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: v.fullName }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										v.volunteerId,
										" · ",
										v.mobile
									]
								})]
							}, v.id)),
							state.events.filter((e) => `${e.name} ${e.location}`.toLowerCase().includes(search.toLowerCase())).slice(0, 5).map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										formatLongDate(e.date),
										" · ",
										e.location
									]
								})]
							}, e.id)),
							state.certificates.filter((c) => c.id.toLowerCase().includes(search.toLowerCase())).slice(0, 5).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Certificate" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: c.id
								})]
							}, c.id)),
							(state.pressReports ?? []).filter((r) => `${r.name} ${r.fileName}`.toLowerCase().includes(search.toLowerCase())).slice(0, 5).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Press Report" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										r.name,
										" · ",
										r.fileName
									]
								})]
							}, r.id))
						]
					}) : null
				]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-[1.6fr_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-lg font-semibold",
							children: "Monthly NSS Activity"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-5 text-primary" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-72",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
								data: monthly,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, { strokeDasharray: "3 3" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, { dataKey: "month" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "events",
										name: "Events"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "hours",
										name: "Service hours"
									})
								]
							})
						})
					})]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg font-semibold",
						children: "Unit Distribution"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-72",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
								data: unitData,
								dataKey: "volunteers",
								nameKey: "name",
								outerRadius: 90,
								label: true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {})] })
						})
					})]
				}) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-[1.2fr_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg font-semibold",
						children: "Service Hours Trend"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-64",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
								data: monthly,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, { strokeDasharray: "3 3" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, { dataKey: "month" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
										type: "monotone",
										dataKey: "hours",
										name: "Service hours",
										strokeWidth: 3
									})
								]
							})
						})
					})]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg font-semibold",
						children: "Notification & Alert Center"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 space-y-3",
						children: [alerts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-xl border border-border p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm",
								children: a.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "font-display text-xl",
								children: a.value
							})]
						}, a.label)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-muted p-3 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "mr-2 inline size-4" }),
								state.notices.length,
								" active notices · ",
								state.gallery.length,
								" gallery files"
							]
						})]
					})]
				}) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-lg font-semibold",
							children: "Upcoming Events"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/po/events",
							className: "text-sm text-primary",
							children: "Manage"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 space-y-2",
						children: upcoming.length ? upcoming.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "saffron",
									children: "Upcoming"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: [
									formatLongDate(e.date),
									e.endDate && e.endDate !== e.date ? ` – ${formatLongDate(e.endDate)}` : "",
									" · ",
									e.location
								]
							})]
						}, e.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No upcoming events."
						})
					})]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg font-semibold",
						children: "Quick Actions"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
								to: "/po/volunteers",
								icon: Users,
								label: "Volunteers"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
								to: "/po/events",
								icon: CalendarDays,
								label: "Create Event"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
								to: "/po/attendance",
								icon: ClipboardCheck,
								label: "Attendance"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
								to: "/po/certificates",
								icon: Award,
								label: "Certificates"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
								to: "/po/gallery",
								icon: Images,
								label: "Gallery"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
								to: "/po/press",
								icon: Newspaper,
								label: "Press Desk"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
								to: "/po/reports",
								icon: FileSpreadsheet,
								label: "Reports"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
								to: "/po/settings",
								icon: Settings,
								label: "Settings"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
								to: "/po/backup",
								icon: Trash2,
								label: "Backup & Recycle"
							})
						]
					})]
				}) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg font-semibold",
						children: "Recent Notices"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 space-y-2",
						children: state.notices.slice(0, 5).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-border p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: n.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: formatLongDate(n.date)
							})]
						}, n.id))
					})]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg font-semibold",
						children: "Portal Summary"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
								label: "Completed events",
								value: completed
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
								label: "Present marks",
								value: presentRows
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
								label: "Certificates",
								value: state.certificates.length
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
								label: "External press reports",
								value: (state.pressReports ?? []).length
							})
						]
					})]
				}) })]
			})
		]
	});
}
function HeroStat({ icon: Icon, value, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-white/10 p-3 backdrop-blur",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-saffron" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-display text-2xl font-bold",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] text-paper/70",
				children: label
			})
		]
	});
}
function Summary({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-muted p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-2xl font-bold",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: label
		})]
	});
}
function Quick({ to, icon: Icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-medium hover:bg-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-saffron" }), label]
	});
}
//#endregion
export { PoHome as component };

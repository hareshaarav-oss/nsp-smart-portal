import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, D as formatLongDate, H as volunteerHours, N as parseDob, U as volunteerRecord, c as academicYear, f as attendanceOf, l as activeVolunteers, m as blobToDataUrl, p as bestVolunteer, x as compressPassport } from "./utils-BIiJ-s-U.mjs";
import { n as CardContent, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Badge } from "./badge-BMh2Hxac.mjs";
import { t as Input } from "./input-CRT4sBU_.mjs";
import { R as CreditCard, a as Star, g as QrCode } from "../_libs/lucide-react.mjs";
import { t as OfficialLetterhead } from "./official-letterhead-0CBv-cY2.mjs";
import { u as downloadVolunteerExcel } from "./reports-0LItQuD8.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as qrSvg } from "./qr-r2hriz89.mjs";
import { i as openCertificateDocument, n as htmlForCertificate } from "./certificates-BpqtJ9x9.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
import { t as Label } from "./label-Bl0lQyM7.mjs";
import { t as openIdCard } from "./id-card-BhQsWlP5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/volunteers-i5I0ISN5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VolunteersPage() {
	const state = useNssStore();
	const [q, setQ] = (0, import_react.useState)("");
	const [course, setCourse] = (0, import_react.useState)("");
	const [semester, setSemester] = (0, import_react.useState)("");
	const [selected, setSelected] = (0, import_react.useState)([]);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [recordId, setRecordId] = (0, import_react.useState)(null);
	const best = bestVolunteer(state);
	const rows = (0, import_react.useMemo)(() => {
		const needle = q.toLowerCase();
		return activeVolunteers(state).filter((v) => {
			const hit = !needle || v.fullName.toLowerCase().includes(needle) || v.volunteerId.toLowerCase().includes(needle) || v.enrollment.toLowerCase().includes(needle) || v.mobile.includes(needle);
			const c = !course || v.course === course;
			const s = !semester || v.semester === semester;
			return hit && c && s;
		});
	}, [
		state,
		q,
		course,
		semester
	]);
	function toggle(id) {
		setSelected((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
	}
	function promote() {
		if (!selected.length) {
			toast.error("Select at least one volunteer.");
			return;
		}
		const n = state.promoteVolunteers(selected);
		toast.success(`Promoted ${n} volunteer(s) to the next semester.`);
		setSelected([]);
	}
	function removeSelected() {
		if (!selected.length) {
			toast.error("Select at least one volunteer.");
			return;
		}
		if (!confirm(`Delete ${selected.length} volunteer(s) permanently?`)) return;
		state.deleteVolunteers(selected);
		toast.success("Removed from the roll.");
		setSelected([]);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficialLetterhead, {
				title: "Volunteer roll",
				compact: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-semibold",
					children: "Volunteers"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [rows.length, " on the roll · A–Z · first name in CAPITAL · tick to promote or delete"]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => downloadVolunteerExcel(state),
					children: "Download Excel"
				})]
			}),
			best ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "border-saffron/40 bg-saffron/5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "flex flex-wrap items-center justify-between gap-3 pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "mr-2 inline size-4 text-saffron" }),
							"Best volunteer: ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: best.fullName }),
							" · ",
							best.volunteerId,
							" ·",
							" ",
							volunteerHours(state, best.id),
							" hrs"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => setRecordId(best.id),
						children: "Smart record"
					})]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2 rounded-lg border border-border bg-muted/40 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						onClick: promote,
						disabled: !selected.length,
						children: "Promote selected (Sem++)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "danger",
						onClick: removeSelected,
						disabled: !selected.length,
						children: "Delete selected"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "self-center text-xs text-muted-foreground",
						children: [selected.length, " selected"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-2 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Search name, ID, mobile",
						value: q,
						onChange: (e) => setQ(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-10 rounded-md border border-border bg-card px-3 text-sm",
						value: course,
						onChange: (e) => setCourse(e.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "All courses"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "B.A." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "B.Com." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "B.Sc." })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-10 rounded-md border border-border bg-card px-3 text-sm",
						value: semester,
						onChange: (e) => setSemester(e.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "All semesters"
						}), [
							"1",
							"2",
							"3",
							"4",
							"5",
							"6"
						].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: s,
							children: ["Semester ", s]
						}, s))]
					})
				]
			}),
			editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditVolunteer, {
				volunteer: editing,
				onClose: () => setEditing(null)
			}) : null,
			recordId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmartRecord, {
				volunteerId: recordId,
				onClose: () => setRecordId(null)
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "overflow-x-auto p-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[960px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-primary text-primary-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
							"",
							"#",
							"ID",
							"Name",
							"DOB",
							"Mobile",
							"Course",
							"Role",
							"Hours",
							"Actions"
						].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: h === "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: rows.length > 0 && rows.every((v) => selected.includes(v.id)),
								onChange: (e) => setSelected(e.target.checked ? rows.map((v) => v.id) : [])
							}) : h
						}, h || "sel")) })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: selected.includes(v.id),
									onChange: () => toggle(v.id)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 tabular-nums",
								children: i + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 font-medium",
								children: v.volunteerId
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										v.photoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: v.photoUrl,
											alt: "",
											className: "size-8 rounded object-cover"
										}) : null,
										v.fullName,
										best?.id === v.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3.5 text-saffron" }) : null
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-xs",
								children: v.dob ? formatLongDate(parseDob(v.dob)) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 tabular-nums",
								children: v.mobile
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-3 py-2",
								children: [
									v.course,
									" ",
									v.semester
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "rounded-md border border-border bg-card px-2 py-1 text-xs",
									value: v.nssRole,
									onChange: (e) => state.updateVolunteer(v.id, { nssRole: e.target.value }),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Volunteer" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Leader" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Group Leader" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Discipline Head" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Camp Coordinator" })
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 tabular-nums",
								children: volunteerHours(state, v.id)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => setRecordId(v.id),
											children: "Record"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => setEditing(v),
											children: "Edit"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => void openIdCard(v, state.settings),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, {}), "ID"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => {
												state.moveToAlumni(v.id, `Moved ${academicYear()}`);
												toast.success(`${v.fullName} sent to Alumni file`);
											},
											children: "Alumni"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => {
												if (confirm(`Delete ${v.fullName}?`)) {
													state.deleteVolunteer(v.id);
													toast.success("Removed");
												}
											},
											children: "Delete"
										})
									]
								})
							})
						]
					}, v.id)) })]
				})
			}) })
		]
	});
}
function SmartRecord({ volunteerId, onClose }) {
	const state = useNssStore();
	const [qrMarkup, setQrMarkup] = (0, import_react.useState)("");
	const [qrOpen, setQrOpen] = (0, import_react.useState)(false);
	const rec = volunteerRecord(state, volunteerId);
	const v = rec.volunteer;
	const events = [...state.events].sort((a, b) => b.date.localeCompare(a.date));
	if (!v) return null;
	async function showVolunteerQr() {
		const store = useNssStore.getState();
		const current = store.volunteers.find((row) => row.id === volunteerId);
		if (!current) return;
		const token = current.qrToken || `nss-vol-${current.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
		if (!current.qrToken) store.updateVolunteer(current.id, {
			qrToken: token,
			qrGeneratedAt: (/* @__PURE__ */ new Date()).toISOString()
		});
		try {
			const svg = await qrSvg(JSON.stringify({
				type: "NSS_VOLUNTEER_ID",
				volunteerId: current.id,
				token
			}), 260);
			setQrMarkup(svg);
			setQrOpen(true);
		} catch {
			toast.error("Unable to generate volunteer QR.");
		}
	}
	function printVolunteerQr() {
		if (!qrMarkup) return;
		const printVolunteer = useNssStore.getState().volunteers.find((row) => row.id === volunteerId);
		if (!printVolunteer) {
			toast.error("Volunteer record not found.");
			return;
		}
		const popup = window.open("", "_blank", "width=600,height=720");
		if (!popup) {
			toast.error("Please allow pop-ups to print the QR.");
			return;
		}
		popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>NSS Volunteer QR</title>
          <style>
            body{font-family:Arial,sans-serif;text-align:center;padding:30px}
            svg{max-width:300px;margin:20px auto}
            @media print{button{display:none}}
          </style>
        </head>
        <body>
          <h2>${escapeHtml(printVolunteer.fullName)}</h2>
          <p>${escapeHtml(printVolunteer.volunteerId)} · ${escapeHtml(printVolunteer.unit)}</p>
          ${qrMarkup}
          <button onclick="window.print()">Print QR</button>
        </body>
      </html>
    `);
		popup.document.close();
		popup.focus();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		className: "border-navy/30",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "space-y-4 pt-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [v.photoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: v.photoUrl,
							alt: "",
							className: "h-24 w-20 rounded-md object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-24 w-20 items-center justify-center rounded-md bg-navy text-paper",
							children: v.fullName.slice(0, 2).toUpperCase()
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-[0.16em] text-muted-foreground",
								children: "SMART RECORD"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-xl font-semibold",
								children: v.fullName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted-foreground",
								children: [
									v.volunteerId,
									" · ",
									v.enrollment,
									" · ",
									v.unit,
									" · ",
									v.nssRole
								]
							}),
							rec.isBest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "saffron",
								className: "mt-1",
								children: "Best volunteer"
							}) : null
						] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => void openIdCard(v, state.settings),
								children: "ID card"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => void showVolunteerQr(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, {}), "QR"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: onClose,
								children: "Close"
							})
						]
					})]
				}),
				qrOpen && qrMarkup ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-muted/30 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: "Volunteer Identity QR"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Scan this QR after the Event QR to identify this volunteer."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								onClick: printVolunteerQr,
								children: "Print QR"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => setQrOpen(false),
								children: "Close"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto mt-3 w-fit rounded-xl border border-border bg-white p-3",
						dangerouslySetInnerHTML: { __html: qrMarkup }
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-muted/30 p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "Achievement badges"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: [(v.badges ?? []).map((badge) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "rounded-full bg-saffron/15 px-3 py-1 text-xs",
							onClick: () => state.removeBadge(v.id, badge),
							children: [badge, " ×"]
						}, badge)), [
							"Eco Warrior",
							"Blood Donation Champion",
							"Best Volunteer",
							"Event Leader",
							"Community Service",
							"Attendance Champion",
							"Special Camp Participant"
						].filter((b) => !(v.badges ?? []).includes(b)).map((badge) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => state.awardBadge(v.id, badge),
							children: ["+ ", badge]
						}, badge))]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "Attendance",
							value: `${rec.pct}%`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "Present",
							value: `${rec.present}/${rec.marked}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "Hours",
							value: String(rec.hours)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "Certificates",
							value: String(rec.certs.length)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "grid gap-2 text-sm sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Mobile",
							val: v.mobile
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Email",
							val: v.email || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Course",
							val: `${v.course} · Sem ${v.semester}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Gender / Blood",
							val: `${v.gender || "—"} · ${v.bloodGroup || "—"}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Emergency",
							val: v.emergencyContact || v.parentMobile || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Address",
							val: v.address || "—"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-sm font-medium",
					children: "Activity history"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-56 overflow-auto rounded-md border border-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-2 py-1.5",
									children: "Event"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-2 py-1.5",
									children: "Date"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-2 py-1.5",
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-2 py-1.5",
									children: "Certificate"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: events.map((e) => {
							const att = attendanceOf(state, v.id, e.id);
							const cert = rec.certs.find((c) => c.eventId === e.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-1.5",
										children: e.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-1.5",
										children: formatLongDate(e.date)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-1.5",
										children: att ? att.present ? "Present" : "Absent" : e.status === "upcoming" ? "Upcoming" : "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-1.5",
										children: cert ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "text-forest underline",
											onClick: () => void htmlForCertificate(cert, v, e, state.settings).then(openCertificateDocument),
											children: "View"
										}) : "—"
									})
								]
							}, e.id);
						}) })]
					})
				})] })
			]
		})
	});
}
function escapeHtml(value) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#039;");
}
function Mini({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-border bg-muted/40 px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-xl font-semibold tabular-nums",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] text-muted-foreground",
			children: label
		})]
	});
}
function Row({ k, val }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between gap-3 border-b border-border/60 py-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted-foreground",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "text-right font-medium",
			children: val
		})]
	});
}
function EditVolunteer({ volunteer, onClose }) {
	const update = useNssStore((s) => s.updateVolunteer);
	const addLog = useNssStore((s) => s.addLog);
	const [form, setForm] = (0, import_react.useState)({
		fullName: volunteer.fullName,
		enrollment: volunteer.enrollment,
		mobile: volunteer.mobile,
		course: volunteer.course,
		semester: volunteer.semester,
		nssRole: volunteer.nssRole,
		photoUrl: volunteer.photoUrl ?? "",
		emergencyContact: volunteer.emergencyContact ?? ""
	});
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
		update(volunteer.id, form);
		addLog("Updated Student", `Updated details for ${form.fullName}`);
		toast.success("Student details saved");
		onClose();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-3 pt-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "font-medium",
			children: ["Edit ", volunteer.fullName]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
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
					label: "Full name",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.fullName,
						onChange: (e) => setForm({
							...form,
							fullName: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Enrollment",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.enrollment,
						onChange: (e) => setForm({
							...form,
							enrollment: e.target.value
						})
					})
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
					label: "Course",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-10 w-full rounded-md border border-border bg-card px-3 text-sm",
						value: form.course,
						onChange: (e) => setForm({
							...form,
							course: e.target.value
						}),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "B.A." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "B.Com." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "B.Sc." })
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Semester",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "h-10 w-full rounded-md border border-border bg-card px-3 text-sm",
						value: form.semester,
						onChange: (e) => setForm({
							...form,
							semester: e.target.value
						}),
						children: [
							"1",
							"2",
							"3",
							"4",
							"5",
							"6"
						].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: s }, s))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Role",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-10 w-full rounded-md border border-border bg-card px-3 text-sm",
						value: form.nssRole,
						onChange: (e) => setForm({
							...form,
							nssRole: e.target.value
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Volunteer" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Leader" })]
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sm:col-span-2 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						children: "Save changes"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						onClick: onClose,
						children: "Cancel"
					})]
				})
			]
		})]
	}) });
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
//#endregion
export { VolunteersPage as component };

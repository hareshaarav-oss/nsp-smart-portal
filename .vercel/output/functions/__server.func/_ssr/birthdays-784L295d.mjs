import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, C as daysUntilBirthday, D as formatLongDate, N as parseDob, R as todayIso, j as isBirthdayOn, t as BIRTHDAY_TEMPLATE } from "./utils-BIiJ-s-U.mjs";
import { n as CardContent, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Badge } from "./badge-BMh2Hxac.mjs";
import { Q as Cake } from "../_libs/lucide-react.mjs";
import { t as Textarea } from "./textarea-CRsubrpt.mjs";
import { i as birthdayWish, n as WhatsAppSendPanel, t as WhatsAppGroupButtons } from "./whatsapp-send-CZgw5BdW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/birthdays-784L295d.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BirthdaysPage() {
	const volunteers = useNssStore((s) => s.volunteers);
	const settings = useNssStore((s) => s.settings);
	const updateSettings = useNssStore((s) => s.updateSettings);
	const [template, setTemplate] = (0, import_react.useState)(settings.birthdayTemplate || BIRTHDAY_TEMPLATE);
	const [tab, setTab] = (0, import_react.useState)("today");
	const today = todayIso();
	const groups = (0, import_react.useMemo)(() => {
		const withDob = volunteers.filter((v) => parseDob(v.dob) && v.status !== "alumni");
		return {
			today: withDob.filter((v) => isBirthdayOn(v.dob, today)),
			week: withDob.filter((v) => {
				const d = daysUntilBirthday(v.dob, today);
				return d >= 0 && d <= 7;
			}).sort((a, b) => daysUntilBirthday(a.dob, today) - daysUntilBirthday(b.dob, today)),
			month: withDob.filter((v) => parseDob(v.dob).slice(5, 7) === today.slice(5, 7)).sort((a, b) => parseDob(a.dob).slice(8).localeCompare(parseDob(b.dob).slice(8))),
			all: [...withDob].sort((a, b) => daysUntilBirthday(a.dob, today) - daysUntilBirthday(b.dob, today))
		};
	}, [volunteers, today]);
	const birthdayDisabled = settings.birthdayEnabled === false;
	const list = birthdayDisabled ? [] : groups[tab];
	const girlsToday = groups.today.filter((v) => v.gender === "Female");
	const boysToday = groups.today.filter((v) => v.gender === "Male");
	const girlsMsg = girlsToday.length > 0 ? birthdayWish(girlsToday.map((v) => v.fullName).join(", "), template) : "";
	const boysMsg = boysToday.length > 0 ? birthdayWish(boysToday.map((v) => v.fullName).join(", "), template) : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			birthdayDisabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "pt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "Birthday feature is disabled."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Enable it from Settings → Birthday."
				})]
			}) }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-semibold",
				children: "Birthdays"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Names and dates so the NSS family can send a wish the same morning. Girls wishes go to the girls group, boys to the boys group."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					["today", `Today (${groups.today.length})`],
					["week", `This week (${groups.week.length})`],
					["month", `This month (${groups.month.length})`],
					["all", `All (${groups.all.length})`]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(id),
					className: tab === id ? "h-10 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" : "h-10 rounded-md bg-card px-3 text-sm ring-1 ring-border",
					children: label
				}, id))
			}),
			groups.today.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "border-saffron/40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3 pt-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: "Today’s wishes to WhatsApp groups"
						}),
						girlsToday.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppGroupButtons, {
							text: girlsMsg,
							audience: "girls"
						}) : null,
						boysToday.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppGroupButtons, {
							text: boysMsg,
							audience: "boys"
						}) : null
					]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3",
				children: list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "pt-5 text-sm text-muted-foreground",
					children: "No birthdays in this list."
				}) }) : list.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BirthdayRow, {
					volunteer: v,
					today,
					template
				}, v.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "Wish template"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						className: "gu min-h-48",
						value: template,
						onChange: (e) => {
							setTemplate(e.target.value);
							updateSettings({ birthdayTemplate: e.target.value });
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "{{NAME}} is replaced with the volunteer’s name."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppSendPanel, {
				title: "Send birthday wishes on WhatsApp",
				recipients: list,
				message: template,
				personalize: (v, text) => birthdayWish(v.fullName, text),
				showGroups: false
			})
		]
	});
}
function BirthdayRow({ volunteer: v, today, template }) {
	const days = daysUntilBirthday(v.dob, today);
	const isToday = days === 0;
	const text = birthdayWish(v.fullName, template);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		className: isToday ? "border-saffron/50" : void 0,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "flex flex-wrap items-center justify-between gap-3 pt-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cake, { className: isToday ? "size-5 text-saffron" : "size-5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg font-semibold",
						children: v.fullName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [
							v.volunteerId,
							" · ",
							v.unit,
							" · ",
							v.mobile,
							" · ",
							v.gender || "—"
						]
					}),
					isToday ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppGroupButtons, {
							text,
							gender: v.gender
						})
					}) : null
				] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-right",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: formatLongDate(v.dob)
				}), isToday ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: "saffron",
					children: "Today"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [days, " days"]
				})]
			})]
		})
	});
}
//#endregion
export { BirthdaysPage as component };

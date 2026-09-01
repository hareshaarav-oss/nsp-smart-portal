import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, W as waPhone, t as BIRTHDAY_TEMPLATE } from "./utils-BIiJ-s-U.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-2ADCK2Ma.mjs";
import { J as Check, f as Send, t as Users, x as MessageCircle, z as Copy } from "../_libs/lucide-react.mjs";
import { t as Textarea } from "./textarea-CRsubrpt.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/whatsapp-send-CZgw5BdW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function fillTemplate(template, name) {
	return template.replaceAll("{{NAME}}", name.trim().toUpperCase());
}
function birthdayWish(name, template = BIRTHDAY_TEMPLATE) {
	return fillTemplate(template, name);
}
function whatsappHref(mobile, text) {
	const phone = waPhone(mobile);
	const encoded = encodeURIComponent(text);
	if (!phone) return `https://wa.me/?text=${encoded}`;
	return `https://wa.me/${phone}?text=${encoded}`;
}
function openWhatsApp(mobile, text) {
	const href = whatsappHref(mobile, text);
	window.open(href, "_blank", "noopener,noreferrer");
}
function noticeBroadcastText(title, body, college) {
	return `*NSS NOTICE*\n${college}\n\n*${title}*\n\n${body}\n\n— NSS Smart Portal`;
}
function eventBroadcastText(name, date, location, extra) {
	return `*NSS EVENT*\n\n*${name}*\nDate: ${date}\nPlace: ${location}\n\n${extra}\n\n— NSS Unit, Mansa`;
}
function audienceLabel(audience) {
	if (audience === "girls") return "Girls";
	if (audience === "boys") return "Boys";
	if (audience === "leaders") return "Leaders";
	return "All";
}
function audienceRecipients(volunteers, audience) {
	const list = volunteers.filter((v) => v.status !== "alumni");
	if (audience === "girls") return list.filter((v) => v.gender === "Female");
	if (audience === "boys") return list.filter((v) => v.gender === "Male");
	if (audience === "leaders") return list.filter((v) => v.nssRole === "Leader");
	return list;
}
function groupLinks(settings) {
	return [
		{
			id: "girls",
			label: "Girls group",
			url: settings.waGirls || "https://chat.whatsapp.com/CwY4ERY2l24CzdnhWOC6RI"
		},
		{
			id: "boys",
			label: "Boys group",
			url: settings.waBoys || "https://chat.whatsapp.com/JqRZ51TGuZGCbXY62jm4zS"
		},
		{
			id: "leaders",
			label: "Leaders group",
			url: settings.waLeaders || "https://chat.whatsapp.com/CTZ6ATMbQB17PhVERCgZ4D"
		}
	];
}
function groupsForAudience(settings, audience) {
	const all = groupLinks(settings);
	if (audience === "girls") return all.filter((g) => g.id === "girls");
	if (audience === "boys") return all.filter((g) => g.id === "boys");
	if (audience === "leaders") return all.filter((g) => g.id === "leaders");
	return all.filter((g) => g.id === "girls" || g.id === "boys");
}
function groupsForGender(settings, gender) {
	if (gender === "Female") return groupsForAudience(settings, "girls");
	if (gender === "Male") return groupsForAudience(settings, "boys");
	return groupsForAudience(settings, "all");
}
async function copyAndOpenGroup(url, text) {
	try {
		await navigator.clipboard.writeText(text);
	} catch {}
	window.open(url, "_blank", "noopener,noreferrer");
}
function WhatsAppGroupButtons({ text, audience, gender, groups }) {
	const settings = useNssStore((s) => s.settings);
	const list = groups ?? (gender ? groupsForGender(settings, gender) : groupsForAudience(settings, audience ?? "all"));
	const [copied, setCopied] = (0, import_react.useState)(null);
	if (!list.length) return null;
	async function sendGroup(g) {
		await copyAndOpenGroup(g.url, text);
		setCopied(g.id);
		window.setTimeout(() => setCopied(null), 2500);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2 rounded-lg border border-forest/30 bg-forest/5 p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: "WhatsApp groups"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Message is copied, then the group opens. Paste and send. Group invite links cannot pre-fill text."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: list.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					size: "sm",
					variant: "forest",
					onClick: () => void sendGroup(g),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {}), copied === g.id ? "Copied — group opened" : `Send to ${g.label}`]
				}, g.id))
			})
		]
	});
}
function WhatsAppSendPanel({ title, recipients, message, personalize, audience, showGroups = true }) {
	const [text, setText] = (0, import_react.useState)(message);
	const [index, setIndex] = (0, import_react.useState)(0);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const list = (0, import_react.useMemo)(() => (audience ? audienceRecipients(recipients, audience) : recipients).filter((v) => v.mobile), [recipients, audience]);
	const current = list[index];
	(0, import_react.useEffect)(() => {
		setText(message);
		setIndex(0);
	}, [message]);
	function bodyFor(v) {
		return personalize ? personalize(v, text) : text;
	}
	async function copyText() {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	}
	function sendOne() {
		if (!current) return;
		openWhatsApp(current.mobile, bodyFor(current));
	}
	function sendAndNext() {
		sendOne();
		if (index < list.length - 1) setIndex(index + 1);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		id: "wa-all",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
			className: "flex items-center gap-2 text-base",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-4" }), title]
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: text,
					onChange: (e) => setText(e.target.value),
					rows: 8
				}),
				showGroups ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppGroupButtons, {
					text,
					audience: audience ?? "all"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						onClick: () => void copyText(),
						children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {}), copied ? "Copied" : "Copy message"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "self-center text-xs text-muted-foreground",
						children: [list.length, " volunteers with a mobile number"]
					})]
				}),
				current ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border bg-muted/50 p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-wide text-muted-foreground",
							children: "Now sending"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-display text-lg font-semibold",
							children: [
								index + 1,
								" / ",
								list.length,
								" · ",
								current.fullName
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted-foreground",
							children: [
								current.volunteerId,
								" · ",
								current.mobile,
								" · ",
								current.unit
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									onClick: sendAndNext,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {}), "Open WhatsApp — then next"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									onClick: sendOne,
									children: "Send only this"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "ghost",
									disabled: index >= list.length - 1,
									onClick: () => setIndex((i) => Math.min(list.length - 1, i + 1)),
									children: "Skip"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "ghost",
									disabled: index === 0,
									onClick: () => setIndex((i) => Math.max(0, i - 1)),
									children: "Previous"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-muted-foreground",
							children: "WhatsApp will open with the message ready. Send it, return here, then continue. Group buttons above post to girls / boys / leaders groups."
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "No mobile numbers on file."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-48 overflow-auto rounded-md border border-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border text-sm",
						children: list.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-2 px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "text-left",
								onClick: () => setIndex(i),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: v.fullName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 text-muted-foreground",
									children: v.mobile
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "text-xs font-medium text-forest",
								href: whatsappHref(v.mobile, bodyFor(v)),
								target: "_blank",
								rel: "noreferrer",
								children: "Chat"
							})]
						}, v.id))
					})
				})
			]
		})]
	});
}
//#endregion
export { eventBroadcastText as a, birthdayWish as i, WhatsAppSendPanel as n, noticeBroadcastText as o, audienceLabel as r, WhatsAppGroupButtons as t };

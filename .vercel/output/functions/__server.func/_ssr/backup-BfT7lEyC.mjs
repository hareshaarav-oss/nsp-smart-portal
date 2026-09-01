import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore } from "./utils-BIiJ-s-U.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-2ADCK2Ma.mjs";
import { B as CloudUpload, I as Download, L as DatabaseBackup, i as Trash2, m as RotateCcw } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/backup-BfT7lEyC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BackupPage() {
	const state = useNssStore();
	const fileRef = (0, import_react.useRef)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const recycleBin = state.recycleBin ?? [];
	const exportBackup = () => {
		const payload = {
			version: 3,
			exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
			source: "NSP",
			state: {
				volunteers: state.volunteers,
				events: state.events,
				attendance: state.attendance,
				eventRsvps: state.eventRsvps,
				notices: state.notices,
				gallery: state.gallery,
				certificates: state.certificates,
				pressReports: state.pressReports,
				logs: state.logs,
				settings: state.settings,
				visitors: state.visitors,
				recycleBin: state.recycleBin
			}
		};
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `NSP-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Complete NSP backup downloaded.");
	};
	async function importBackup(file) {
		if (!file) return;
		setBusy(true);
		try {
			const parsed = JSON.parse(await file.text());
			const data = parsed && typeof parsed === "object" && "state" in parsed ? parsed.state : parsed;
			if (!Array.isArray(data.volunteers) || !Array.isArray(data.events)) throw new Error("Invalid NSP backup");
			state.importBackup(data);
			toast.success("Backup restored on this device.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not restore backup.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl font-bold",
				children: "Backup & Restore"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Portable full backup for NSS records, including RSVP, press reports and Recycle Bin."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DatabaseBackup, { className: "size-5" }), " Create full backup"]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Exports students, events, RSVP, attendance, gallery, certificates, press reports, settings and audit logs."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "mt-4",
					onClick: exportBackup,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), " Download NSP Backup"]
				})] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { className: "size-5" }), " Restore backup"]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Restore a previously exported NSP JSON file to this browser."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: "application/json,.json",
						className: "hidden",
						onChange: (e) => void importBackup(e.target.files?.[0])
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-4",
						variant: "outline",
						disabled: busy,
						onClick: () => fileRef.current?.click(),
						children: busy ? "Restoring…" : "Choose Backup File"
					})
				] })] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-5" }),
					" Recycle Bin ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-sm font-normal text-muted-foreground",
						children: [
							"(",
							recycleBin.length,
							")"
						]
					})
				]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Deleted volunteers and events are retained here instead of being permanently lost."
					}),
					recycleBin.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-xl bg-muted p-4 text-sm text-muted-foreground",
						children: "Recycle Bin is empty."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: recycleBin.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: item.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									item.kind,
									" · ",
									new Date(item.deletedAt).toLocaleString()
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => {
										state.restoreDeleted(item.id);
										toast.success("Restored from Recycle Bin.");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {}), " Restore"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "danger",
									onClick: () => {
										if (confirm("Permanently delete this item?")) state.permanentlyDelete(item.id);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {}), " Delete"]
								})]
							})]
						}, item.id))
					}),
					recycleBin.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => {
							if (confirm("Permanently empty the Recycle Bin?")) state.emptyRecycleBin();
						},
						children: "Empty Recycle Bin"
					}) : null
				]
			})] })
		]
	});
}
//#endregion
export { BackupPage as component };

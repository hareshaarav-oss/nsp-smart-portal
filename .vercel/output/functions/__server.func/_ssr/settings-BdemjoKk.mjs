import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, S as compressPortrait, m as blobToDataUrl, t as BIRTHDAY_TEMPLATE } from "./utils-BIiJ-s-U.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Input } from "./input-CRT4sBU_.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Textarea } from "./textarea-CRsubrpt.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
import { t as Label } from "./label-Bl0lQyM7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-BdemjoKk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const settings = useNssStore((s) => s.settings);
	const update = useNssStore((s) => s.updateSettings);
	const resetDemo = useNssStore((s) => s.resetDemo);
	const [section, setSection] = (0, import_react.useState)("college");
	const [draft, setDraft] = (0, import_react.useState)(settings);
	(0, import_react.useEffect)(() => setDraft(settings), [settings]);
	const updateDraft = (patch) => setDraft((prev) => ({
		...prev,
		...patch
	}));
	const saveSettings = () => {
		update(draft);
		toast.success("Settings saved successfully.");
	};
	const [busy, setBusy] = (0, import_react.useState)(null);
	async function onLogo(kind, file) {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please choose an image file.");
			return;
		}
		try {
			const url = await blobToDataUrl(file);
			updateDraft(kind === "college" ? { collegeLogo: url } : { nssLogo: url });
			toast.success("Logo ready — click Save settings to publish it.");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not load logo");
		}
	}
	async function onPhoto(kind, file) {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please choose a photograph.");
			return;
		}
		setBusy(kind);
		try {
			const { blob } = await compressPortrait(file);
			const url = await blobToDataUrl(blob);
			updateDraft(kind === "principal" ? { principalPhoto: url } : { poPhoto: url });
			toast.success(kind === "principal" ? "Principal photograph ready — click Save settings" : "PO photograph ready — click Save settings");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not save photograph");
		} finally {
			setBusy(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl font-semibold",
			children: "NSP Control Center"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "Change portal content and behaviour without editing code."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-5 lg:grid-cols-[230px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "h-fit lg:sticky lg:top-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-2",
					children: [
						[
							"college",
							"College & Officers",
							"Identity, people and contact"
						],
						[
							"home",
							"Home Page",
							"Index page and slider controls"
						],
						[
							"birthday",
							"Birthday",
							"Birthday radar and wishes"
						],
						[
							"certificate",
							"Certificate",
							"Certificate output controls"
						],
						[
							"whatsapp",
							"WhatsApp",
							"Groups and communication"
						],
						[
							"security",
							"Security",
							"Admin and PO access"
						],
						[
							"system",
							"System",
							"Academic year and appearance"
						]
					].map(([id, title, sub]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setSection(id),
						className: `mb-1 w-full rounded-xl p-3 text-left ${section === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `text-[11px] ${section === id ? "text-primary-foreground/75" : "text-muted-foreground"}`,
							children: sub
						})]
					}, id))
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sticky top-2 z-10 flex justify-end rounded-xl border border-border bg-card/95 p-2 backdrop-blur",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: saveSettings,
							children: "Save settings"
						})
					}),
					section === "college" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollegeSection, {
						settings: draft,
						update: updateDraft,
						busy,
						onPhoto,
						onLogo
					}),
					section === "home" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeSection, {
						settings: draft,
						update: updateDraft
					}),
					section === "birthday" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BirthdaySection, {
						settings: draft,
						update: updateDraft
					}),
					section === "certificate" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CertificateSection, {
						settings: draft,
						update: updateDraft
					}),
					section === "whatsapp" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppSection, {
						settings: draft,
						update: updateDraft
					}),
					section === "security" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecuritySection, {
						settings: draft,
						update: updateDraft
					}),
					section === "system" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SystemSection, {
						settings: draft,
						update: updateDraft
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: saveSettings,
							children: "Save all changes"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "border-danger/30",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-base",
							children: "Danger zone"
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => {
								if (confirm("Reset portal data to the seeded college roll?")) {
									resetDemo();
									setDraft(useNssStore.getState().settings);
									toast.success("Restored sample data");
								}
							},
							children: "Restore sample roll"
						}) })]
					})
				]
			})]
		})]
	});
}
function CollegeSection({ settings, update, busy, onPhoto, onLogo }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
		className: "text-base",
		children: "College, portal & officers"
	}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "grid gap-4 sm:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "College name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.collegeName,
					onChange: (e) => update({ collegeName: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "College short name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.collegeShort,
					onChange: (e) => update({ collegeShort: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Portal / App name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.portalName,
					onChange: (e) => update({ portalName: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "College logo",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, {
					src: settings.collegeLogo,
					label: "College logo",
					onFile: (file) => onLogo("college", file),
					onClear: () => update({ collegeLogo: "" })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "NSS / programme logo",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, {
					src: settings.nssLogo,
					label: "NSS logo",
					onFile: (file) => onLogo("nss", file),
					onClear: () => update({ nssLogo: "" })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Academic year",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.academicYear,
					onChange: (e) => update({ academicYear: e.target.value }),
					placeholder: "2026-27"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "College address",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.address ?? "",
					onChange: (e) => update({ address: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Contact email",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "email",
					value: settings.contactEmail ?? "",
					onChange: (e) => update({ contactEmail: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "College website",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.website ?? "",
					onChange: (e) => update({ website: e.target.value }),
					placeholder: "https://..."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Annual service-hour target",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "number",
					min: "1",
					value: settings.serviceHourTarget,
					onChange: (e) => update({ serviceHourTarget: Number(e.target.value) || 120 })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Principal",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.principalName,
					onChange: (e) => update({ principalName: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Programme Officer",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.poName,
					onChange: (e) => update({ poName: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Principal message",
				className: "sm:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: settings.principalQuote,
					onChange: (e) => update({ principalQuote: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "PO message",
				className: "sm:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "gu",
					value: settings.poQuote,
					onChange: (e) => update({ poQuote: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Principal photograph",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficerPhoto, {
					src: settings.principalPhoto,
					busy: busy === "principal",
					onFile: (f) => onPhoto("principal", f),
					onClear: () => update({ principalPhoto: "" })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Programme Officer photograph",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficerPhoto, {
					src: settings.poPhoto,
					busy: busy === "po",
					onFile: (f) => onPhoto("po", f),
					onClear: () => update({ poPhoto: "" })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Programme Officer signature",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignatureUpload, {
					src: settings.poSignature,
					onFile: (v) => update({ poSignature: v }),
					onClear: () => update({ poSignature: "" })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Principal signature",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignatureUpload, {
					src: settings.principalSignature,
					onFile: (v) => update({ principalSignature: v }),
					onClear: () => update({ principalSignature: "" })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "English slogan",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.sloganEn,
					onChange: (e) => update({ sloganEn: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Gujarati slogan",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "gu",
					value: settings.sloganGu,
					onChange: (e) => update({ sloganGu: e.target.value })
				})
			})
		]
	})] });
}
function HomeSection({ settings, update }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
		className: "text-base",
		children: "Index / Welcome page controls"
	}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
				label: "Show PO & Principal cards",
				value: settings.showHomeOfficers !== false,
				onChange: (v) => update({ showHomeOfficers: v })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
				label: "Show homepage statistics",
				value: settings.showHomeStats !== false,
				onChange: (v) => update({ showHomeStats: v })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
				label: "Show latest notices",
				value: settings.showHomeNotices !== false,
				onChange: (v) => update({ showHomeNotices: v })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
				label: "Show upcoming activities",
				value: settings.showHomeEvents !== false,
				onChange: (v) => update({ showHomeEvents: v })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
				label: "Show activity gallery slider",
				value: settings.showHomeGallery !== false,
				onChange: (v) => update({ showHomeGallery: v })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
				label: "Hero slider auto-play",
				value: settings.heroAutoPlay !== false,
				onChange: (v) => update({ heroAutoPlay: v })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Hero slider interval (seconds)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "number",
					min: "2",
					max: "30",
					value: settings.heroIntervalSeconds ?? 5,
					onChange: (e) => update({ heroIntervalSeconds: Math.max(2, Math.min(30, Number(e.target.value) || 5)) })
				})
			})
		]
	})] });
}
function BirthdaySection({ settings, update }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
		className: "text-base",
		children: "Birthday automation"
	}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
				label: "Enable Birthday feature",
				value: settings.birthdayEnabled !== false,
				onChange: (v) => update({ birthdayEnabled: v })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
				label: "Show Birthday radar on dashboards",
				value: settings.birthdayShowOnDashboard !== false,
				onChange: (v) => update({ birthdayShowOnDashboard: v })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Birthday button label",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.birthdayAutoWishLabel ?? "Birthday wishes",
					onChange: (e) => update({ birthdayAutoWishLabel: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "WhatsApp birthday message",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "gu min-h-64",
					value: settings.birthdayTemplate ?? BIRTHDAY_TEMPLATE,
					onChange: (e) => update({ birthdayTemplate: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground",
				children: [
					"Use ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "{{NAME}}" }),
					" to insert the volunteer name automatically. The existing Today / Week / Month / All birthday screens and gender-wise WhatsApp groups remain enabled."
				]
			})
		]
	})] });
}
function CertificateSection({ settings, update }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
		className: "text-base",
		children: "Certificate controls"
	}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
				label: "Enable QR verification on certificates",
				value: settings.certificateQrEnabled !== false,
				onChange: (v) => update({ certificateQrEnabled: v })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Certificate footer text",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: settings.certificateFooterText ?? "",
					onChange: (e) => update({ certificateFooterText: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Upload approved certificate design",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "file",
					accept: "image/png,image/jpeg,image/webp",
					className: "block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground",
					onChange: (e) => {
						const file = e.target.files?.[0];
						if (!file) return;
						if (!file.type.startsWith("image/")) {
							toast.error("Please choose a certificate image.");
							return;
						}
						const reader = new FileReader();
						reader.onload = () => {
							update({ certificateTemplateUrl: String(reader.result) });
							toast.success("Certificate design loaded — click Save settings");
						};
						reader.readAsDataURL(file);
						e.currentTarget.value = "";
					}
				})
			}),
			settings.certificateTemplateUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-hidden rounded-xl border border-border bg-muted p-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: settings.certificateTemplateUrl,
					alt: "Certificate template preview",
					className: "w-full rounded-lg object-contain"
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Upload your approved design from outside. It becomes the certificate background; student name, event, academic year, date, Certificate ID, PO and Principal remain dynamic. No logo redraw or certificate redesign is performed."
			})
		]
	})] });
}
function WhatsAppSection({ settings, update }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
		className: "text-base",
		children: "WhatsApp groups & contact"
	}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "grid gap-4 sm:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "PO WhatsApp",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.poWhatsapp,
					onChange: (e) => update({ poWhatsapp: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Girls group",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.waGirls ?? "",
					onChange: (e) => update({ waGirls: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Boys group",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.waBoys ?? "",
					onChange: (e) => update({ waBoys: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Leaders group",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.waLeaders ?? "",
					onChange: (e) => update({ waLeaders: e.target.value })
				})
			})
		]
	})] });
}
function SecuritySection({ settings, update }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
		className: "text-base",
		children: "Sign-in settings"
	}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "grid gap-4 sm:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "PO username",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.poUsername,
					onChange: (e) => update({ poUsername: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "PO password",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "password",
					value: settings.poPassword,
					onChange: (e) => update({ poPassword: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Admin username",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: settings.adminUsername,
					onChange: (e) => update({ adminUsername: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Admin password",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "password",
					value: settings.adminPassword,
					onChange: (e) => update({ adminPassword: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground sm:col-span-2",
				children: "For a production deployment, move credential verification to authenticated server-side/cloud functions rather than relying only on browser settings."
			})
		]
	})] });
}
function SystemSection({ settings, update }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
		className: "text-base",
		children: "System & appearance"
	}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "grid gap-4 sm:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Alumni count",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "number",
					min: "0",
					value: settings.alumniCount,
					onChange: (e) => update({ alumniCount: Number(e.target.value) || 0 })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Theme",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
					value: settings.themeMode ?? "system",
					onChange: (e) => update({ themeMode: e.target.value }),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "system",
							children: "System"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "light",
							children: "Light"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "dark",
							children: "Dark"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Visitor counter",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "number",
					min: "0",
					value: settings.alumniCount >= 0 ? "" : "",
					readOnly: true,
					placeholder: "Managed automatically"
				})
			})
		]
	})] });
}
function Toggle({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => onChange(!value),
		className: "flex w-full items-center justify-between rounded-xl border p-4 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm font-medium",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `rounded-full px-3 py-1 text-xs font-semibold ${value ? "bg-forest text-white" : "bg-muted text-muted-foreground"}`,
			children: value ? "ON" : "OFF"
		})]
	});
}
function OfficerPhoto({ src, busy, onFile, onClear }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-24 w-20 overflow-hidden rounded-md border-2 border-navy/20 bg-navy/10",
			children: src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src,
				alt: "",
				className: "h-full w-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-full items-center justify-center text-[10px] text-muted-foreground",
				children: "No photo"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "file",
				accept: "image/*",
				disabled: busy,
				className: "block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1.5 file:text-primary-foreground",
				onChange: (e) => {
					onFile(e.target.files?.[0]);
					e.target.value = "";
				}
			}), src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				size: "sm",
				variant: "ghost",
				onClick: onClear,
				children: "Remove"
			}) : null]
		})]
	});
}
function BrandLogo({ src, label, onFile, onClear }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border bg-muted p-1",
			children: src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src,
				alt: `${label} preview`,
				className: "h-full w-full object-contain"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-center text-[10px] text-muted-foreground",
				children: "Default logo"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "file",
				accept: "image/png,image/jpeg,image/webp,image/svg+xml",
				className: "block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1.5 file:text-primary-foreground",
				onChange: (e) => {
					onFile(e.target.files?.[0]);
					e.currentTarget.value = "";
				}
			}), src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				size: "sm",
				variant: "ghost",
				onClick: onClear,
				children: "Use default"
			}) : null]
		})]
	});
}
function SignatureUpload({ src, onFile, onClear }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-16 w-40 overflow-hidden rounded-md border bg-white p-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src,
					alt: "Signature preview",
					className: "h-full w-full object-contain"
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "file",
				accept: "image/png,image/jpeg,image/webp",
				className: "block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1.5 file:text-primary-foreground",
				onChange: (e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					const reader = new FileReader();
					reader.onload = () => onFile(String(reader.result));
					reader.readAsDataURL(file);
					e.currentTarget.value = "";
				}
			}),
			src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				size: "sm",
				variant: "ghost",
				onClick: onClear,
				children: "Remove"
			}) : null
		]
	});
}
function Field({ label, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `space-y-1.5 ${className ?? ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
//#endregion
export { SettingsPage as component };

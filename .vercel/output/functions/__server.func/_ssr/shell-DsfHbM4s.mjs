import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, s as STORAGE_VISITOR_MARK, y as cn } from "./utils-BIiJ-s-U.mjs";
import { I as Download } from "../_libs/lucide-react.mjs";
import { t as TricolourStrip } from "./tricolour-DHYPuBOE.mjs";
import { a as dashboardPath, g as Button, h as useSessionStore, s as isOfficer } from "./router-Cdyjb-lJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-DsfHbM4s.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BrandHeader({ eyebrow, compact = false }) {
	const settings = useNssStore((s) => s.settings);
	const collegeLogo = settings.collegeLogo || "/images/college-logo.png";
	const nssLogo = settings.nssLogo || "/images/nss-logo.png";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "no-print border-b border-border bg-surface",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("mx-auto max-w-6xl px-4 md:px-6", compact ? "py-3" : "py-3 md:py-4"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 md:gap-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: collegeLogo,
						alt: "College emblem",
						className: cn("object-contain mix-blend-multiply", compact ? "h-12 w-12 md:h-14 md:w-14" : "h-16 w-16 md:h-[5.5rem] md:w-[5.5rem]")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("text-balance font-display font-semibold leading-tight text-navy", compact ? "text-sm md:text-base" : "text-base md:text-xl"),
							children: settings.collegeShort || settings.collegeName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("mt-0.5 uppercase tracking-[0.18em] text-forest", compact ? "text-[10px] md:text-xs" : "text-xs md:text-sm"),
							children: eyebrow ?? "Mansa · National Service Scheme"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: nssLogo,
						alt: "NSS emblem",
						className: cn("object-contain mix-blend-multiply", compact ? "h-12 w-12 md:h-14 md:w-14" : "h-16 w-16 md:h-[5.5rem] md:w-[5.5rem]")
					})
				]
			})
		})
	});
}
function PageNav({ showDashboard = true, current = "page" }) {
	const session = useSessionStore((s) => s.session);
	const setSession = useSessionStore((s) => s.setSession);
	const dash = dashboardPath(session);
	const officer = isOfficer(session);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "bg-navy text-paper",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 md:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-1 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: cn("rounded-sm px-3 py-2 hover:bg-white/10", current === "home" ? "bg-white/10" : ""),
						children: "Home"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/gallery",
						className: "rounded-sm px-3 py-2 hover:bg-white/10",
						children: "Gallery"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/contact",
						className: "rounded-sm px-3 py-2 hover:bg-white/10",
						children: "Contact"
					}),
					showDashboard ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: session ? dash : "/login",
						className: cn("rounded-sm px-3 py-2 hover:bg-white/10", current === "dashboard" ? "bg-white/10" : ""),
						children: officer ? "Desk" : "Back to dashboard"
					}) : null,
					officer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/po/attendance",
						className: "rounded-sm px-3 py-2 hover:bg-white/10",
						children: "Attendance"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/po/reports",
						className: "rounded-sm px-3 py-2 hover:bg-white/10",
						children: "Reports"
					})] }) : null
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "outline",
					className: "h-9 border-white/20 bg-transparent text-paper hover:bg-white/10",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/install",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "Install NSP"]
					})
				}), session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden text-xs text-paper/70 sm:inline",
					children: session.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "outline",
					className: "h-9 border-white/20 bg-transparent text-paper hover:bg-white/10",
					onClick: () => {
						setSession(null);
						window.location.href = "/";
					},
					children: "Sign out"
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "outline",
					className: "h-9 border-white/20 bg-transparent text-paper hover:bg-white/10",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						children: "Sign in"
					})
				})]
			})]
		})
	});
}
function SiteFooter() {
	const settings = useNssStore((s) => s.settings);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "no-print mt-auto border-t border-border bg-navy-deep px-4 py-8 text-center text-paper",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-lg",
				children: "Welcome to Avyansh Tech"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-paper/80",
				children: settings.collegeName
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-paper/70",
				children: [
					"National Service Scheme · “",
					settings.sloganEn,
					"” / ",
					settings.sloganGu
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-xs text-paper/50",
				children: "Created by Dr. Hareshkumar I. Prajapati · Assistant Professor"
			})
		]
	});
}
function AppShell({ children, eyebrow, current = "page", showDashboard = true, compactHeader = false }) {
	const bumpVisitor = useNssStore((s) => s.bumpVisitor);
	(0, import_react.useEffect)(() => {
		try {
			if (!sessionStorage.getItem("nsp-visitor-session")) {
				sessionStorage.setItem(STORAGE_VISITOR_MARK, "1");
				bumpVisitor();
			}
		} catch {}
	}, [bumpVisitor]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-bg text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandHeader, {
				eyebrow,
				compact: compactHeader
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TricolourStrip, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageNav, {
				showDashboard,
				current
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { AppShell as t };

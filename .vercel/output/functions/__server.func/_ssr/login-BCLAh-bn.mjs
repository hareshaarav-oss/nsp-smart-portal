import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, x as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, T as firstNameOf } from "./utils-BIiJ-s-U.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Input } from "./input-CRT4sBU_.mjs";
import { E as KeyRound, M as Fingerprint } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as dashboardPath, c as loginStaff, d as loginWithMpin, f as lookupUsernameByMobile, g as Button, h as useSessionStore, l as loginVolunteer, m as resetPasswordToMobile, r as Route$24, u as loginWithFingerprint } from "./router-Cdyjb-lJ.mjs";
import { t as AppShell } from "./shell-DsfHbM4s.mjs";
import { t as Label } from "./label-Bl0lQyM7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-BCLAh-bn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function makeCaptcha() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let out = "";
	for (let i = 0; i < 5; i += 1) out += alphabet[Math.floor(Math.random() * 32)];
	return out;
}
function LoginPage() {
	const { role: roleHint } = Route$24.useSearch();
	const [role, setRole] = (0, import_react.useState)(roleHint ?? "volunteer");
	const [mode, setMode] = (0, import_react.useState)("password");
	const [id, setId] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [captcha, setCaptcha] = (0, import_react.useState)(makeCaptcha);
	const [captchaIn, setCaptchaIn] = (0, import_react.useState)("");
	const [help, setHelp] = (0, import_react.useState)("none");
	const [helpMobile, setHelpMobile] = (0, import_react.useState)("");
	const [helpName, setHelpName] = (0, import_react.useState)("");
	const navigate = useNavigate();
	const settings = useNssStore((s) => s.settings);
	const volunteers = useNssStore((s) => s.volunteers);
	const updateVolunteer = useNssStore((s) => s.updateVolunteer);
	const setSession = useSessionStore((s) => s.setSession);
	(0, import_react.useEffect)(() => {
		if (roleHint) setRole(roleHint);
	}, [roleHint]);
	function refreshCaptcha() {
		setCaptcha(makeCaptcha());
		setCaptchaIn("");
	}
	function enter(session) {
		setSession(session);
		toast.success(`Welcome, ${session.name}`);
		navigate({ to: dashboardPath(session) });
	}
	function onSubmit(e) {
		e.preventDefault();
		if (captchaIn.trim().toUpperCase() !== captcha) {
			toast.error("Captcha does not match. Please type the letters again.");
			refreshCaptcha();
			return;
		}
		const result = role === "volunteer" ? mode === "mpin" ? loginWithMpin(id, password, volunteers) : loginVolunteer(id, password, volunteers) : loginStaff(role, id, password, settings);
		if (!result.ok) {
			toast.error(result.error);
			refreshCaptcha();
			return;
		}
		enter(result.session);
	}
	async function onFingerprint() {
		const result = await loginWithFingerprint(volunteers);
		if (!result.ok) {
			toast.error(result.error);
			return;
		}
		enter(result.session);
	}
	function recoverUsername() {
		const found = lookupUsernameByMobile(helpMobile, volunteers);
		if (!found) {
			toast.error("This mobile is not on the NSS roll.");
			return;
		}
		setId(found.firstName);
		toast.success(`Your username is ${found.firstName}`);
		setHelp("none");
	}
	function recoverPassword() {
		const v = resetPasswordToMobile(helpName, helpMobile, volunteers);
		if (!v) {
			toast.error("First name and registered mobile do not match.");
			return;
		}
		updateVolunteer(v.id, { loginPassword: "" });
		setId(firstNameOf(v.fullName));
		setPassword(v.mobile);
		toast.success("Password reset to your registered mobile number.");
		setHelp("none");
	}
	const staff = role !== "volunteer";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		eyebrow: "NSS PORTAL LOGIN",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-lg space-y-4 px-4 pb-16",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Sign in" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "space-y-4",
					onSubmit,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "role",
								children: "Login as"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "role",
								className: "flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm",
								value: role,
								onChange: (e) => setRole(e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "volunteer",
										children: "Student / Volunteer"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "po",
										children: "Programme Officer"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "admin",
										children: "Admin"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "id",
								children: staff ? "Username" : "Username"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "id",
								value: id,
								onChange: (e) => setId(staff ? e.target.value : e.target.value.toUpperCase()),
								placeholder: staff ? "Username" : "Username",
								autoComplete: "username",
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "pass",
								children: staff ? "Password" : mode === "mpin" ? "4-digit MPIN" : "Password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "pass",
								type: mode === "mpin" ? "text" : "password",
								inputMode: mode === "mpin" || !staff ? "numeric" : "text",
								value: password,
								onChange: (e) => setPassword(e.target.value),
								placeholder: mode === "mpin" ? "MPIN" : "Password",
								autoComplete: "current-password",
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "captcha",
									children: "Captcha"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": true,
										className: "select-none rounded-md bg-navy px-3 py-2 font-mono text-lg tracking-[0.35em] text-paper",
										style: {
											fontStyle: "italic",
											letterSpacing: "0.28em"
										},
										children: captcha
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "sm",
										variant: "ghost",
										onClick: refreshCaptcha,
										children: "Refresh"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "captcha",
									value: captchaIn,
									onChange: (e) => setCaptchaIn(e.target.value.toUpperCase()),
									placeholder: "Captcha",
									autoComplete: "off",
									required: true
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "w-full",
							size: "lg",
							children: "Sign in"
						})
					]
				}),
				!staff ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							size: "sm",
							variant: mode === "mpin" ? "default" : "outline",
							onClick: () => {
								setMode(mode === "mpin" ? "password" : "mpin");
								setPassword("");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {}), mode === "mpin" ? "Use mobile password" : "Login with MPIN"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							size: "sm",
							variant: "outline",
							onClick: () => void onFingerprint(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fingerprint, {}), "Login with fingerprint"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							variant: "ghost",
							onClick: () => setHelp("user"),
							children: "Forgot username"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							variant: "ghost",
							onClick: () => setHelp("pass"),
							children: "Forgot password"
						})
					]
				}) : null,
				help === "user" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-2 rounded-md border border-border p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: "Forgot username"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Registered mobile number",
							value: helpMobile,
							onChange: (e) => setHelpMobile(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								onClick: recoverUsername,
								children: "Show my username"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "ghost",
								onClick: () => setHelp("none"),
								children: "Close"
							})]
						})
					]
				}) : null,
				help === "pass" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-2 rounded-md border border-border p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: "Forgot password — resets to registered mobile"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "FIRST NAME in CAPITAL",
							value: helpName,
							onChange: (e) => setHelpName(e.target.value.toUpperCase())
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Registered mobile number",
							value: helpMobile,
							onChange: (e) => setHelpMobile(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								onClick: recoverPassword,
								children: "Reset password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "ghost",
								onClick: () => setHelp("none"),
								children: "Close"
							})]
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-center text-sm text-muted-foreground",
					children: [
						"New volunteer?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/register",
							className: "font-medium text-primary",
							children: "Register here"
						})
					]
				})
			] })] })
		})
	});
}
//#endregion
export { LoginPage as component };

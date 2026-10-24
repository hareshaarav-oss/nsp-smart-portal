import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Fingerprint, KeyRound } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/nss/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  dashboardPath,
  loginVolunteer,
  loginWithFingerprint,
  loginWithMpin,
  useSessionStore,
} from "@/lib/nss/session";
import { useNssStore, rememberVolunteer } from "@/lib/nss/store";

const searchSchema = z.object({
  role: z.enum(["volunteer", "po", "admin"]).optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

function makeCaptcha() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function LoginPage() {
  const { role: roleHint } = Route.useSearch();
  const [role, setRole] = useState<"volunteer" | "po" | "admin">(roleHint ?? "volunteer");
  const [mode, setMode] = useState<"password" | "mpin">("password");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaIn, setCaptchaIn] = useState("");
  const [help, setHelp] = useState<"none" | "user" | "pass">("none");
  const [helpMobile, setHelpMobile] = useState("");
  const [helpName, setHelpName] = useState("");
  const navigate = useNavigate();
  const volunteers = useNssStore((s) => s.volunteers);
  const setSession = useSessionStore((s) => s.setSession);
  useEffect(() => {
    setCaptcha(makeCaptcha());
  }, []);
  useEffect(() => {
    if (roleHint) setRole(roleHint);
  }, [roleHint]);

  function refreshCaptcha() {
    setCaptcha(makeCaptcha());
    setCaptchaIn("");
  }

  function enter(session: { role: "po" | "admin" | "volunteer" | "leader"; name: string }) {
    setSession(session);
    toast.success(`Welcome, ${session.name}`);
    void navigate({ to: dashboardPath(session) });
  }

  function acceptCloud(data: {
    session?: { role: "po" | "admin" | "volunteer" | "leader"; name: string; volunteerId?: string; enrollment?: string; mobile?: string };
    volunteer?: Parameters<typeof rememberVolunteer>[0];
    volunteers?: unknown[];
    attendance?: unknown[];
    events?: unknown[];
    serviceHours?: number;
    certificates?: { id: string; volunteerId: string; eventId: string; generatedAt: string; sentAt: string | null; certificateId?: string; printReady?: boolean }[];
  }) {
    if (!data.session) return;
    setSession(data.session);
    if (Array.isArray(data.volunteers) && data.volunteers.length) {
      useNssStore.getState().applyCloud({
        volunteers: data.volunteers as never,
        attendance: Array.isArray(data.attendance) ? (data.attendance as never) : undefined,
        events: Array.isArray(data.events) ? (data.events as never) : undefined,
        serviceHours: data.serviceHours,
        keepPrivate: true,
      });
    } else if (data.volunteer) {
      rememberVolunteer({
        ...data.volunteer,
        mobile: data.session.mobile || data.volunteer.mobile || "",
      });
    }
    if (Array.isArray(data.certificates) && data.certificates.length) {
      const current = useNssStore.getState().certificates ?? [];
      const seen = new Set(current.map((item) => item.id));
      const extra = data.certificates.filter((item) => item?.id && !seen.has(item.id));
      if (extra.length) useNssStore.setState({ certificates: [...current, ...extra] });
    }
    toast.success(`Welcome, ${data.session.name}`);
    void navigate({ to: dashboardPath(data.session) });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!captcha || captchaIn.trim().toUpperCase() !== captcha) {
      toast.error("Captcha does not match. Please type the letters again.");
      refreshCaptcha();
      return;
    }
    const action = role === "volunteer" && mode === "mpin" ? "mpin-login" : role === "volunteer" ? "login" : "staff-login";
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          role,
          username: id,
          password,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        session?: { role: "po" | "admin" | "volunteer" | "leader"; name: string; volunteerId?: string; enrollment?: string; mobile?: string };
        volunteer?: Parameters<typeof rememberVolunteer>[0];
        volunteers?: unknown[];
        attendance?: unknown[];
        events?: unknown[];
        serviceHours?: number;
        certificates?: { id: string; volunteerId: string; eventId: string; generatedAt: string; sentAt: string | null; certificateId?: string; printReady?: boolean }[];
      };
      if (!res.ok || !data.ok || !data.session) {
        if (role === "volunteer") {
          const local = mode === "mpin" ? loginWithMpin(id, password, volunteers) : loginVolunteer(id, password, volunteers);
          if (local.ok) {
            enter(local.session);
            return;
          }
        }
        toast.error(data.error || "Sign in failed.");
        refreshCaptcha();
        return;
      }
      acceptCloud(data);
    } catch {
      if (role !== "volunteer") {
        toast.error("Could not reach the college server.");
        return;
      }
      const result = mode === "mpin" ? loginWithMpin(id, password, volunteers) : loginVolunteer(id, password, volunteers);
      if (!result.ok) {
        toast.error(result.error);
        refreshCaptcha();
        return;
      }
      enter(result.session);
    }
  }

  async function onFingerprint() {
    if (!window.PublicKeyCredential) {
      toast.error("Fingerprint login is not available on this phone.");
      return;
    }
    try {
      const cred = (await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          timeout: 60_000,
          userVerification: "required",
          rpId: location.hostname,
        },
      })) as PublicKeyCredential | null;
      if (!cred) {
        toast.error("Fingerprint was cancelled.");
        return;
      }
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "finger-login", credentialId: cred.id }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        session?: { role: "po" | "admin" | "volunteer" | "leader"; name: string };
      };
      if (res.ok && data.ok && data.session) {
        acceptCloud(data);
        return;
      }
      const local = await loginWithFingerprint(volunteers);
      if (local.ok) {
        enter(local.session);
        return;
      }
      toast.error(data.error || local.error || "Turn fingerprint on from the student dashboard first.");
    } catch (error) {
      const local = await loginWithFingerprint(volunteers).catch(() => null);
      if (local?.ok) {
        enter(local.session);
        return;
      }
      toast.error(error instanceof Error ? error.message : "Fingerprint login failed.");
    }
  }

  async function recoverUsername() {
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "lookup", mobile: helpMobile }),
      });
      const data = (await res.json()) as { ok?: boolean; username?: string; error?: string };
      if (!res.ok || !data.ok || !data.username) {
        toast.error(data.error || "This mobile is not on the NSS roll.");
        return;
      }
      setId(data.username);
      toast.success(`Your username is ${data.username}`);
      setHelp("none");
    } catch {
      toast.error("Could not reach the college server.");
    }
  }

  function recoverPassword() {
    toast("Your password is the mobile number you registered with.");
    setHelp("none");
  }

  const staff = role !== "volunteer";

  return (
    <AppShell eyebrow="NSS PORTAL LOGIN">
      <div className="mx-auto max-w-lg space-y-4 px-4 pb-16">
        <div className="pt-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-saffron">NSS Smart Portal</p>
          <h1 className="mt-1 font-display text-3xl text-navy">Sign in</h1>
        </div>
        <Card>
          <CardContent className="pt-5">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="flex gap-6 border-b border-navy/15 pb-2 text-sm">
                {([
                  ["volunteer", "Student"],
                  ["po", "Officer"],
                  ["admin", "Admin"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={role === value ? "text-navy shadow-[inset_0_-2px_0_#9a7b3c]" : "text-navy/50"}
                    onClick={() => setRole(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="id">{staff ? "Username" : "Username"}</Label>
                <Input
                  id="id"
                  value={id}
                  onChange={(e) => setId(staff ? e.target.value : e.target.value.toUpperCase())}
                  placeholder={staff ? "Username" : "Username"}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pass">
                  {staff
                    ? "Password"
                    : mode === "mpin"
                      ? "4-digit MPIN"
                      : "Password"}
                </Label>
                <Input
                  id="pass"
                  type={mode === "mpin" ? "text" : "password"}
                  inputMode={mode === "mpin" || !staff ? "numeric" : "text"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "mpin" ? "MPIN" : "Password"}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="captcha">Captcha</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    aria-hidden
                    className="select-none rounded-xl bg-navy px-4 py-2 font-mono text-lg tracking-[0.35em] text-paper"
                  >
                    {captcha || "·····"}
                  </span>
                  <Button type="button" size="sm" variant="ghost" onClick={refreshCaptcha}>
                    Refresh
                  </Button>
                </div>
                <Input
                  id="captcha"
                  value={captchaIn}
                  onChange={(e) => setCaptchaIn(e.target.value.toUpperCase())}
                  placeholder="Captcha"
                  autoComplete="off"
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={!captcha}>
                Sign in
              </Button>
            </form>
            {!staff ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setMode(mode === "mpin" ? "password" : "mpin");
                    setPassword("");
                  }}
                >
                  <KeyRound />
                  {mode === "mpin" ? "Use mobile password" : "Login with MPIN"}
                </Button>
                <Button type="button" size="sm" variant="default" onClick={() => void onFingerprint()}>
                  <Fingerprint />
                  Login with fingerprint
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setHelp("user")}>
                  Forgot username
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setHelp("pass")}>
                  Forgot password
                </Button>
              </div>
            ) : null}
            {help === "user" ? (
              <div className="mt-4 space-y-2 rounded-md border border-border p-3">
                <p className="text-sm font-medium">Forgot username</p>
                <Input
                  placeholder="Registered mobile number"
                  value={helpMobile}
                  onChange={(e) => setHelpMobile(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={recoverUsername}>
                    Show my username
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setHelp("none")}>
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
            {help === "pass" ? (
              <div className="mt-4 space-y-2 rounded-md border border-border p-3">
                <p className="text-sm font-medium">Password</p>
                <Input
                  placeholder="Username"
                  value={helpName}
                  onChange={(e) => setHelpName(e.target.value.toUpperCase())}
                />
                <Input
                  placeholder="Registered mobile number"
                  value={helpMobile}
                  onChange={(e) => setHelpMobile(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={recoverPassword}>
                    Reset password
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setHelp("none")}>
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              New volunteer?{" "}
              <Link to="/register" className="font-medium text-primary">
                Register here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

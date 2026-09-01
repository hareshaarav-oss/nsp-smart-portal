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
  loginStaff,
  loginVolunteer,
  loginWithFingerprint,
  loginWithMpin,
  lookupUsernameByMobile,
  resetPasswordToMobile,
  useSessionStore,
} from "@/lib/nss/session";
import { firstNameOf } from "@/lib/nss/format";
import { useNssStore } from "@/lib/nss/store";

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
  const [captcha, setCaptcha] = useState(makeCaptcha);
  const [captchaIn, setCaptchaIn] = useState("");
  const [help, setHelp] = useState<"none" | "user" | "pass">("none");
  const [helpMobile, setHelpMobile] = useState("");
  const [helpName, setHelpName] = useState("");
  const navigate = useNavigate();
  const settings = useNssStore((s) => s.settings);
  const volunteers = useNssStore((s) => s.volunteers);
  const updateVolunteer = useNssStore((s) => s.updateVolunteer);
  const setSession = useSessionStore((s) => s.setSession);
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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (captchaIn.trim().toUpperCase() !== captcha) {
      toast.error("Captcha does not match. Please type the letters again.");
      refreshCaptcha();
      return;
    }
    const result =
      role === "volunteer"
        ? mode === "mpin"
          ? loginWithMpin(id, password, volunteers)
          : loginVolunteer(id, password, volunteers)
        : loginStaff(role, id, password, settings);
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

  return (
    <AppShell eyebrow="NSS PORTAL LOGIN">
      <div className="mx-auto max-w-lg space-y-4 px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="role">Login as</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                >
                  <option value="volunteer">Student / Volunteer</option>
                  <option value="po">Programme Officer</option>
                  <option value="admin">Admin</option>
                </select>
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
                    className="select-none rounded-md bg-navy px-3 py-2 font-mono text-lg tracking-[0.35em] text-paper"
                    style={{ fontStyle: "italic", letterSpacing: "0.28em" }}
                  >
                    {captcha}
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
              <Button type="submit" className="w-full" size="lg">
                Sign in
              </Button>
            </form>
            {!staff ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "mpin" ? "default" : "outline"}
                  onClick={() => {
                    setMode(mode === "mpin" ? "password" : "mpin");
                    setPassword("");
                  }}
                >
                  <KeyRound />
                  {mode === "mpin" ? "Use mobile password" : "Login with MPIN"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void onFingerprint()}>
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
                <p className="text-sm font-medium">Forgot password — resets to registered mobile</p>
                <Input
                  placeholder="FIRST NAME in CAPITAL"
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

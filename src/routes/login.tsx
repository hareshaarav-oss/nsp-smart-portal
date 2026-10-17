import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/nss/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dashboardPath, useSessionStore } from "@/lib/nss/session";
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
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState(makeCaptcha);
  const [captchaIn, setCaptchaIn] = useState("");
  const navigate = useNavigate();
  const setSession = useSessionStore((s) => s.setSession);
  const session = useSessionStore((s) => s.session);
  useEffect(() => {
    if (roleHint) setRole(roleHint);
  }, [roleHint]);

  function refreshCaptcha() {
    setCaptcha(makeCaptcha());
    setCaptchaIn("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (captchaIn.trim().toUpperCase() !== captcha) {
      toast.error("Captcha does not match.");
      refreshCaptcha();
      return;
    }
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: role === "volunteer" ? "login" : "staff-login",
          role,
          username: id,
          password,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        session?: { role: "po" | "admin" | "volunteer" | "leader"; name: string; volunteerId?: string; enrollment?: string; mobile?: string; chatToken?: string };
        volunteer?: Parameters<typeof rememberVolunteer>[0];
        volunteers?: unknown[];
        attendance?: unknown[];
        events?: unknown[];
        serviceHours?: number;
      };
      if (!res.ok || !data.ok || !data.session) {
        toast.error(data.error || "Sign in failed.");
        refreshCaptcha();
        return;
      }
      setSession(data.session);
      try {
        localStorage.setItem("nsp-view", "app");
      } catch {
        /* ignore */
      }
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
      toast.success(`Welcome, ${data.session.name}`);
      void navigate({ to: dashboardPath(data.session) });
    } catch {
      toast.error("Could not reach the college server.");
    }
  }

  const staff = role !== "volunteer";
  if (session) return <Navigate to={dashboardPath(session)} />;

  return (
    <AppShell eyebrow="NSS PORTAL LOGIN">
      <div className="mx-auto flex w-full max-w-sm flex-1 items-center px-4 py-10">
        <Card className="w-full shadow-md">
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
                  <option value="volunteer">Student</option>
                  <option value="po">Programme Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="id">Username</Label>
                <Input
                  id="id"
                  value={id}
                  onChange={(e) => setId(staff ? e.target.value : e.target.value.toUpperCase())}
                  placeholder="Username"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pass">Password</Label>
                <Input
                  id="pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="captcha">Captcha</Label>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="select-none rounded-md bg-navy px-3 py-2 font-mono text-lg tracking-[0.35em] text-paper"
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
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
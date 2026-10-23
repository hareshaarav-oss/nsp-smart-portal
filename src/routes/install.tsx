import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/nss/shell";
import { InstallNspButton } from "@/components/nss/nsp-pwa";
import { Card, CardContent } from "@/components/ui/card";
import { NSS_LOGO } from "@/lib/nss/constants";

export const Route = createFileRoute("/install")({ component: InstallPage });

function InstallPage() {
  return (
    <AppShell eyebrow="INSTALL NSP">
      <div className="mx-auto max-w-lg space-y-6 px-4 pb-16">
        <div className="text-center">
          <img
            src={NSS_LOGO}
            alt="NSS emblem"
            className="mx-auto size-24 rounded-3xl bg-primary object-contain p-3"
          />
          <h1 className="mt-4 font-display text-3xl font-semibold">NSS Smart Portal</h1>
          <p className="mt-1 text-sm tracking-[0.2em] text-muted-foreground">NSP</p>
          <p className="mt-3 text-sm text-muted-foreground">
            S.D. Arts & Shah B.R. Commerce College, Mansa
          </p>
        </div>
        <Card>
          <CardContent className="pt-5">
            <InstallNspButton />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
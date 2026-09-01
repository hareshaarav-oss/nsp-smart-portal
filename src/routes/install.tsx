import { createFileRoute } from "@tanstack/react-router";
import { Share, Smartphone } from "lucide-react";
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
          <CardContent className="space-y-4 pt-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Add this portal to your home screen. The icon is the NSS emblem and the name is{" "}
              <strong className="text-foreground">NSP</strong> — NSS Smart Portal.
            </p>
            <InstallNspButton />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-5">
            <p className="flex items-center gap-2 font-display font-semibold">
              <Smartphone className="size-4 text-saffron" />
              iPhone / iPad
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Tap the <Share className="inline size-3.5" /> Share button in Safari.
              </li>
              <li>Choose Add to Home Screen.</li>
              <li>
                Keep the name <strong className="text-foreground">NSP</strong> and the NSS logo, then
                Add.
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-5">
            <p className="flex items-center gap-2 font-display font-semibold">
              <Smartphone className="size-4 text-saffron" />
              Android
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Open this page in Chrome.</li>
              <li>Tap Install (or the button above) — or Chrome menu → Install app.</li>
              <li>Confirm. Home screen shows the NSS logo and the name NSP.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

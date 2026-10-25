import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import { AppShell } from "@/components/nss/shell";
import { OfficialLetterhead } from "@/components/nss/official-letterhead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { waPhone } from "@/lib/nss/format";
import { useNssStore } from "@/lib/nss/store";
import { useUi } from "@/lib/nss/ui-prefs";

export const Route = createFileRoute("/contact")({ component: ContactPage });

function ContactPage() {
  const settings = useNssStore((s) => s.settings);
  const { lang } = useUi();
  const tr = (en: string, gu: string) => (lang === "gu" ? gu : en);
  const phone = waPhone(settings.poWhatsapp);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <OfficialLetterhead title={tr("Contact NSS Unit", "NSS સંપર્ક")} compact />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="font-display text-xl">{settings.collegeName}</p>
            <p className="text-sm text-muted-foreground">{tr("Mansa, Gandhinagar, Gujarat", "માંસા, ગાંધીનગર, ગુજરાત")}</p>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-saffron">{tr("Programme Officer", "કાર્યક્રમ અધિકારી")}</p>
              <p className="font-medium">{settings.poName}</p>
              <p className="text-sm text-muted-foreground">{tr("Mobile / WhatsApp", "મોબાઇલ / વોટ્સએપ")}: {settings.poWhatsapp}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-saffron">{tr("Principal", "આચાર્ય")}</p>
              <p className="font-medium">{settings.principalName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
                  <MessageCircle />
                  {tr("WhatsApp the Programme Officer", "કાર્યક્રમ અધિકારીને વોટ્સએપ")}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`tel:${settings.poWhatsapp}`}>
                  <Phone />
                  {tr("Call", "ફોન")}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

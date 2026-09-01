import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import { AppShell } from "@/components/nss/shell";
import { OfficialLetterhead } from "@/components/nss/official-letterhead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { waPhone } from "@/lib/nss/format";
import { useNssStore } from "@/lib/nss/store";

export const Route = createFileRoute("/contact")({ component: ContactPage });

function ContactPage() {
  const settings = useNssStore((s) => s.settings);
  const phone = waPhone(settings.poWhatsapp);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <OfficialLetterhead title="Contact NSS Unit" compact />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="font-display text-xl">{settings.collegeName}</p>
            <p className="text-sm text-muted-foreground">Mansa, Gandhinagar, Gujarat</p>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-forest">Programme Officer</p>
              <p className="font-medium">{settings.poName}</p>
              <p className="text-sm text-muted-foreground">Mobile / WhatsApp: {settings.poWhatsapp}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-forest">Principal</p>
              <p className="font-medium">{settings.principalName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
                  <MessageCircle />
                  WhatsApp the Programme Officer
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`tel:${settings.poWhatsapp}`}>
                  <Phone />
                  Call
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppSendPanel } from "@/components/nss/whatsapp-send";
import { Badge } from "@/components/ui/badge";
import { audienceLabel, noticeBroadcastText } from "@/lib/nss/whatsapp";
import { formatLongDate, todayIso } from "@/lib/nss/format";
import { activeVolunteers, useNssStore } from "@/lib/nss/store";
import type { Audience } from "@/lib/nss/types";

export const Route = createFileRoute("/po/notices")({ component: NoticesPage });

function NoticesPage() {
  const state = useNssStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [broadcast, setBroadcast] = useState<{ text: string; audience: Audience } | null>(null);

  function publish(openWhatsApp: boolean) {
    if (!title.trim() || !body.trim()) return;
    const n = state.addNotice({ title: title.trim(), body: body.trim(), date: todayIso(), audience });
    toast.success("Notice published");
    if (openWhatsApp) {
      setBroadcast({
        text: noticeBroadcastText(n.title, n.body, state.settings.collegeName),
        audience: n.audience,
      });
      window.setTimeout(() => document.getElementById("wa-all")?.scrollIntoView({ behavior: "smooth" }), 80);
    }
    setTitle("");
    setBody("");
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    publish(true);
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold">Notices</h2>
      <Card>
        <CardContent className="pt-5">
          <form className="space-y-3" onSubmit={add}>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Notice (Gujarati or English)</Label>
              <Textarea className="gu" value={body} onChange={(e) => setBody(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <select
                className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
              >
                <option value="all">All (girls + boys groups)</option>
                <option value="girls">Girls group only</option>
                <option value="boys">Boys group only</option>
                <option value="leaders">Leaders group</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                <MessageCircle />
                Publish & WhatsApp
              </Button>
              <Button type="button" variant="outline" onClick={() => publish(false)}>
                Publish only
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Girls events go only to the girls group, boys to the boys group, all to both, leaders to the leaders group.
              Individual chats remain available below the group buttons.
            </p>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {state.notices.map((n) => (
          <Card key={n.id}>
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{formatLongDate(n.date)}</p>
                </div>
                <Badge tone={n.audience === "all" ? "muted" : "navy"}>{audienceLabel(n.audience)}</Badge>
              </div>
              <p className="gu mt-2 text-sm leading-relaxed">{n.body}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setBroadcast({
                      text: noticeBroadcastText(n.title, n.body, state.settings.collegeName),
                      audience: n.audience,
                    });
                    window.setTimeout(() => document.getElementById("wa-all")?.scrollIntoView({ behavior: "smooth" }), 80);
                  }}
                >
                  <MessageCircle />
                  WhatsApp
                </Button>
                <Button size="sm" variant="ghost" onClick={() => state.deleteNotice(n.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {broadcast ? (
        <WhatsAppSendPanel
          key={broadcast.text + broadcast.audience}
          title={`Send this notice to ${audienceLabel(broadcast.audience).toLowerCase()} on WhatsApp`}
          recipients={activeVolunteers(state)}
          message={broadcast.text}
          audience={broadcast.audience}
        />
      ) : null}
    </div>
  );
}

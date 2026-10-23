import { useEffect, useMemo, useState } from "react";
import { Check, Copy, MessageCircle, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  audienceRecipients,
  copyAndOpenGroup,
  groupsForAudience,
  groupsForGender,
  openWhatsApp,
  whatsappHref,
  type WaGroup,
} from "@/lib/nss/whatsapp";
import { useNssStore } from "@/lib/nss/store";
import type { Audience, Volunteer } from "@/lib/nss/types";

export function WhatsAppGroupButtons({
  text,
  audience,
  gender,
  groups,
}: {
  text: string;
  audience?: Audience;
  gender?: string;
  groups?: WaGroup[];
}) {
  const settings = useNssStore((s) => s.settings);
  const list =
    groups ??
    (gender ? groupsForGender(settings, gender) : groupsForAudience(settings, audience ?? "all"));
  const [copied, setCopied] = useState<string | null>(null);

  if (!list.length) return null;

  async function sendGroup(g: WaGroup) {
    await copyAndOpenGroup(g.url, text);
    setCopied(g.id);
    window.setTimeout(() => setCopied(null), 2500);
  }

  return (
    <div className="space-y-2 rounded-lg border border-forest/30 bg-forest/5 p-3">
      <p className="text-sm font-medium">WhatsApp groups</p>
      <p className="text-xs text-muted-foreground">
        Message is copied, then the group opens. Paste and send. Group invite links cannot pre-fill text.
      </p>
      <div className="flex flex-wrap gap-2">
        {list.map((g) => (
          <Button key={g.id} type="button" size="sm" variant="forest" onClick={() => void sendGroup(g)}>
            <Users />
            {copied === g.id ? "Copied — group opened" : `Send to ${g.label}`}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function WhatsAppSendPanel({
  title,
  recipients,
  message,
  personalize,
  audience,
  showGroups = true,
}: {
  title: string;
  recipients: Volunteer[];
  message: string;
  personalize?: (v: Volunteer, text: string) => string;
  audience?: Audience;
  showGroups?: boolean;
}) {
  const [text, setText] = useState(message);
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const list = useMemo(
    () => (audience ? audienceRecipients(recipients, audience) : recipients).filter((v) => v.mobile),
    [recipients, audience],
  );
  const current = list[index];

  useEffect(() => {
    setText(message);
    setIndex(0);
  }, [message]);

  function bodyFor(v: Volunteer) {
    return personalize ? personalize(v, text) : text;
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function sendOne() {
    if (!current) return;
    openWhatsApp(current.mobile, bodyFor(current));
  }

  function sendAndNext() {
    sendOne();
    if (index < list.length - 1) setIndex(index + 1);
  }

  return (
    <Card id="wa-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} />
        {showGroups ? <WhatsAppGroupButtons text={text} audience={audience ?? "all"} /> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void copyText()}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy message"}
          </Button>
          <p className="self-center text-xs text-muted-foreground">
            {list.length} volunteers with a mobile number
          </p>
        </div>
        {current ? (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-xs tracking-wide text-muted-foreground">Now sending</p>
            <p className="font-display text-lg font-semibold">
              {index + 1} / {list.length} · {current.fullName}
            </p>
            <p className="text-sm text-muted-foreground">
              {current.volunteerId} · {current.mobile} · {current.unit}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" onClick={sendAndNext}>
                <Send />
                Open WhatsApp — then next
              </Button>
              <Button type="button" variant="outline" onClick={sendOne}>
                Send only this
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={index >= list.length - 1}
                onClick={() => setIndex((i) => Math.min(list.length - 1, i + 1))}
              >
                Skip
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                Previous
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              WhatsApp will open with the message ready. Send it, return here, then continue. Group buttons
              above post to girls / boys / leaders groups.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No mobile numbers on file.</p>
        )}
        <div className="max-h-48 overflow-auto rounded-md border border-border">
          <ul className="divide-y divide-border text-sm">
            {list.map((v, i) => (
              <li key={v.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <button type="button" className="text-left" onClick={() => setIndex(i)}>
                  <span className="font-medium">{v.fullName}</span>
                  <span className="ml-2 text-muted-foreground">{v.mobile}</span>
                </button>
                <a
                  className="text-xs font-medium text-forest"
                  href={whatsappHref(v.mobile, bodyFor(v))}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat
                </a>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

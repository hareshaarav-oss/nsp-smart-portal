import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { blobToDataUrl, compressPortrait } from "@/lib/nss/media";
import { useNssStore } from "@/lib/nss/store";
import { BIRTHDAY_TEMPLATE } from "@/lib/nss/constants";

export const Route = createFileRoute("/po/settings")({ component: SettingsPage });

type Section = "college" | "home" | "birthday" | "certificate" | "whatsapp" | "security" | "system";

function SettingsPage() {
  const settings = useNssStore((s) => s.settings);
  const update = useNssStore((s) => s.updateSettings);
  const resetDemo = useNssStore((s) => s.resetDemo);
  const [section, setSection] = useState<Section>("college");
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);
  const updateDraft = (patch: Partial<typeof settings>) => setDraft((prev) => ({ ...prev, ...patch }));
  const saveSettings = () => { update(draft); toast.success("Settings saved successfully."); };
  const [busy, setBusy] = useState<"principal" | "po" | null>(null);

  async function onLogo(kind: "college" | "nss", file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    try {
      const url = await blobToDataUrl(file);
      updateDraft(kind === "college" ? { collegeLogo: url } : { nssLogo: url });
      toast.success("Logo ready — click Save settings to publish it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load logo");
    }
  }

  async function onPhoto(kind: "principal" | "po", file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a photograph.");
      return;
    }
    setBusy(kind);
    try {
      const { blob } = await compressPortrait(file);
      const url = await blobToDataUrl(blob);
      updateDraft(kind === "principal" ? { principalPhoto: url } : { poPhoto: url });
      toast.success(kind === "principal" ? "Principal photograph ready — click Save settings" : "PO photograph ready — click Save settings");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save photograph");
    } finally {
      setBusy(null);
    }
  }

  const sections: Array<[Section, string, string]> = [
    ["college", "College & Officers", "Identity, people and contact"],
    ["home", "Home Page", "Index page and slider controls"],
    ["birthday", "Birthday", "Birthday radar and wishes"],
    ["certificate", "Certificate", "Certificate output controls"],
    ["whatsapp", "WhatsApp", "Groups and communication"],
    ["security", "Security", "Admin and PO access"],
    ["system", "System", "Academic year and appearance"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">NSP Control Center</h2>
        <p className="text-sm text-muted-foreground">Change portal content and behaviour without editing code.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
        <Card className="h-fit lg:sticky lg:top-4">
          <CardContent className="p-2">
            {sections.map(([id, title, sub]) => (
              <button key={id} type="button" onClick={() => setSection(id)} className={`mb-1 w-full rounded-xl p-3 text-left ${section === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <p className="text-sm font-semibold">{title}</p>
                <p className={`text-[11px] ${section === id ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{sub}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="sticky top-2 z-10 flex justify-end rounded-xl border border-border bg-card/95 p-2 backdrop-blur"><Button onClick={saveSettings}>Save settings</Button></div>
          {section === "college" && <CollegeSection settings={draft} update={updateDraft} busy={busy} onPhoto={onPhoto} onLogo={onLogo} />}
          {section === "home" && <HomeSection settings={draft} update={updateDraft} />}
          {section === "birthday" && <BirthdaySection settings={draft} update={updateDraft} />}
          {section === "certificate" && <CertificateSection settings={draft} update={updateDraft} />}
          {section === "whatsapp" && <WhatsAppSection settings={draft} update={updateDraft} />}
          {section === "security" && <SecuritySection settings={draft} update={updateDraft} />}
          {section === "system" && <SystemSection settings={draft} update={updateDraft} />}

          <div className="flex justify-end"><Button onClick={saveSettings}>Save all changes</Button></div>

          <Card className="border-danger/30">
            <CardHeader><CardTitle className="text-base">Danger zone</CardTitle></CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => { if (confirm("Reset portal data to the seeded college roll?")) { resetDemo(); setDraft(useNssStore.getState().settings); toast.success("Restored sample data"); } }}>
                Restore sample roll
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

type Props = { settings: ReturnType<typeof useNssStore.getState>["settings"]; update: (patch: Partial<ReturnType<typeof useNssStore.getState>["settings"]>) => void };

function CollegeSection({ settings, update, busy, onPhoto, onLogo }: Props & { busy: "principal" | "po" | null; onPhoto: (kind: "principal" | "po", file: File | undefined) => void; onLogo: (kind: "college" | "nss", file: File | undefined) => void }) {
  return <Card><CardHeader><CardTitle className="text-base">College, portal & officers</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
    <Field label="College name"><Input value={settings.collegeName} onChange={(e) => update({ collegeName: e.target.value })} /></Field>
    <Field label="College short name"><Input value={settings.collegeShort} onChange={(e) => update({ collegeShort: e.target.value })} /></Field>
    <Field label="Portal / App name"><Input value={settings.portalName} onChange={(e) => update({ portalName: e.target.value })} /></Field>
    <Field label="College logo"><BrandLogo src={settings.collegeLogo} label="College logo" onFile={(file) => onLogo("college", file)} onClear={() => update({ collegeLogo: "" })} /></Field>
    <Field label="NSS / programme logo"><BrandLogo src={settings.nssLogo} label="NSS logo" onFile={(file) => onLogo("nss", file)} onClear={() => update({ nssLogo: "" })} /></Field>
    <Field label="Academic year"><Input value={settings.academicYear} onChange={(e) => update({ academicYear: e.target.value })} placeholder="2026-27" /></Field>
    <Field label="College address"><Input value={settings.address ?? ""} onChange={(e) => update({ address: e.target.value })} /></Field>
    <Field label="Contact email"><Input type="email" value={settings.contactEmail ?? ""} onChange={(e) => update({ contactEmail: e.target.value })} /></Field>
    <Field label="College website"><Input value={settings.website ?? ""} onChange={(e) => update({ website: e.target.value })} placeholder="https://..." /></Field>
    <Field label="Annual service-hour target"><Input type="number" min="1" value={settings.serviceHourTarget} onChange={(e) => update({ serviceHourTarget: Number(e.target.value) || 120 })} /></Field>
    <Field label="Principal"><Input value={settings.principalName} onChange={(e) => update({ principalName: e.target.value })} /></Field>
    <Field label="Programme Officer"><Input value={settings.poName} onChange={(e) => update({ poName: e.target.value })} /></Field>
    <Field label="Principal message" className="sm:col-span-2"><Textarea value={settings.principalQuote} onChange={(e) => update({ principalQuote: e.target.value })} /></Field>
    <Field label="PO message" className="sm:col-span-2"><Textarea className="gu" value={settings.poQuote} onChange={(e) => update({ poQuote: e.target.value })} /></Field>
    <Field label="Principal photograph"><OfficerPhoto src={settings.principalPhoto} busy={busy === "principal"} onFile={(f) => onPhoto("principal", f)} onClear={() => update({ principalPhoto: "" })} /></Field>
    <Field label="Programme Officer photograph"><OfficerPhoto src={settings.poPhoto} busy={busy === "po"} onFile={(f) => onPhoto("po", f)} onClear={() => update({ poPhoto: "" })} /></Field>
    <Field label="Programme Officer signature"><SignatureUpload src={settings.poSignature} onFile={(v) => update({ poSignature: v })} onClear={() => update({ poSignature: "" })} /></Field>
    <Field label="Principal signature"><SignatureUpload src={settings.principalSignature} onFile={(v) => update({ principalSignature: v })} onClear={() => update({ principalSignature: "" })} /></Field>
    <Field label="English slogan"><Input value={settings.sloganEn} onChange={(e) => update({ sloganEn: e.target.value })} /></Field>
    <Field label="Gujarati slogan"><Input className="gu" value={settings.sloganGu} onChange={(e) => update({ sloganGu: e.target.value })} /></Field>
  </CardContent></Card>;
}

function HomeSection({ settings, update }: Props) {
  return <Card><CardHeader><CardTitle className="text-base">Index / Welcome page controls</CardTitle></CardHeader><CardContent className="space-y-4">
    <Toggle label="Show PO & Principal cards" value={settings.showHomeOfficers !== false} onChange={(v) => update({ showHomeOfficers: v })} />
    <Toggle label="Show homepage statistics" value={settings.showHomeStats !== false} onChange={(v) => update({ showHomeStats: v })} />
    <Toggle label="Show latest notices" value={settings.showHomeNotices !== false} onChange={(v) => update({ showHomeNotices: v })} />
    <Toggle label="Show upcoming activities" value={settings.showHomeEvents !== false} onChange={(v) => update({ showHomeEvents: v })} />
    <Toggle label="Show activity gallery slider" value={settings.showHomeGallery !== false} onChange={(v) => update({ showHomeGallery: v })} />
    <Toggle label="Hero slider auto-play" value={settings.heroAutoPlay !== false} onChange={(v) => update({ heroAutoPlay: v })} />
    <Field label="Hero slider interval (seconds)"><Input type="number" min="2" max="30" value={settings.heroIntervalSeconds ?? 5} onChange={(e) => update({ heroIntervalSeconds: Math.max(2, Math.min(30, Number(e.target.value) || 5)) })} /></Field>
  </CardContent></Card>;
}

function BirthdaySection({ settings, update }: Props) {
  return <Card><CardHeader><CardTitle className="text-base">Birthday automation</CardTitle></CardHeader><CardContent className="space-y-4">
    <Toggle label="Enable Birthday feature" value={settings.birthdayEnabled !== false} onChange={(v) => update({ birthdayEnabled: v })} />
    <Toggle label="Show Birthday radar on dashboards" value={settings.birthdayShowOnDashboard !== false} onChange={(v) => update({ birthdayShowOnDashboard: v })} />
    <Field label="Birthday button label"><Input value={settings.birthdayAutoWishLabel ?? "Birthday wishes"} onChange={(e) => update({ birthdayAutoWishLabel: e.target.value })} /></Field>
    <Field label="WhatsApp birthday message"><Textarea className="gu min-h-64" value={settings.birthdayTemplate ?? BIRTHDAY_TEMPLATE} onChange={(e) => update({ birthdayTemplate: e.target.value })} /></Field>
    <p className="text-xs text-muted-foreground">Use <code>{"{{NAME}}"}</code> to insert the volunteer name automatically. The existing Today / Week / Month / All birthday screens and gender-wise WhatsApp groups remain enabled.</p>
  </CardContent></Card>;
}

function CertificateSection({ settings, update }: Props) {
  return <Card><CardHeader><CardTitle className="text-base">Certificate controls</CardTitle></CardHeader><CardContent className="space-y-4">
    <Toggle label="Enable QR verification on certificates" value={settings.certificateQrEnabled !== false} onChange={(v) => update({ certificateQrEnabled: v })} />
    <Field label="Certificate footer text"><Textarea value={settings.certificateFooterText ?? ""} onChange={(e) => update({ certificateFooterText: e.target.value })} /></Field>
    <Field label="Upload approved certificate design">
      <input type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground" onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { toast.error("Please choose a certificate image."); return; }
        const reader = new FileReader();
        reader.onload = () => { update({ certificateTemplateUrl: String(reader.result) }); toast.success("Certificate design loaded — click Save settings"); };
        reader.readAsDataURL(file);
        e.currentTarget.value = "";
      }} />
    </Field>
    {settings.certificateTemplateUrl ? <div className="overflow-hidden rounded-xl border border-border bg-muted p-2"><img src={settings.certificateTemplateUrl} alt="Certificate template preview" className="w-full rounded-lg object-contain" /></div> : null}
    <p className="text-xs text-muted-foreground">Upload your approved design from outside. It becomes the certificate background; student name, event, academic year, date, Certificate ID, PO and Principal remain dynamic. No logo redraw or certificate redesign is performed.</p>
  </CardContent></Card>;
}

function WhatsAppSection({ settings, update }: Props) {
  return <Card><CardHeader><CardTitle className="text-base">WhatsApp groups & contact</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
    <Field label="PO WhatsApp"><Input value={settings.poWhatsapp} onChange={(e) => update({ poWhatsapp: e.target.value })} /></Field>
    <Field label="Girls group"><Input value={settings.waGirls ?? ""} onChange={(e) => update({ waGirls: e.target.value })} /></Field>
    <Field label="Boys group"><Input value={settings.waBoys ?? ""} onChange={(e) => update({ waBoys: e.target.value })} /></Field>
    <Field label="Leaders group"><Input value={settings.waLeaders ?? ""} onChange={(e) => update({ waLeaders: e.target.value })} /></Field>
  </CardContent></Card>;
}

function SecuritySection({ settings, update }: Props) {
  return <Card><CardHeader><CardTitle className="text-base">Sign-in settings</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
    <Field label="PO username"><Input value={settings.poUsername} onChange={(e) => update({ poUsername: e.target.value })} /></Field>
    <Field label="PO password"><Input type="password" value={settings.poPassword} onChange={(e) => update({ poPassword: e.target.value })} /></Field>
    <Field label="Admin username"><Input value={settings.adminUsername} onChange={(e) => update({ adminUsername: e.target.value })} /></Field>
    <Field label="Admin password"><Input type="password" value={settings.adminPassword} onChange={(e) => update({ adminPassword: e.target.value })} /></Field>
    <p className="text-xs text-muted-foreground sm:col-span-2">For a production deployment, move credential verification to authenticated server-side/cloud functions rather than relying only on browser settings.</p>
  </CardContent></Card>;
}

function SystemSection({ settings, update }: Props) {
  return <Card><CardHeader><CardTitle className="text-base">System & appearance</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
    <Field label="Alumni count"><Input type="number" min="0" value={settings.alumniCount} onChange={(e) => update({ alumniCount: Number(e.target.value) || 0 })} /></Field>
    <Field label="Theme"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={settings.themeMode ?? "system"} onChange={(e) => update({ themeMode: e.target.value as "light" | "dark" | "system" })}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></Field>
    <Field label="Visitor counter"><Input type="number" min="0" value={settings.alumniCount >= 0 ? "" : ""} readOnly placeholder="Managed automatically" /></Field>
  </CardContent></Card>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!value)} className="flex w-full items-center justify-between rounded-xl border p-4 text-left"><span className="text-sm font-medium">{label}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${value ? "bg-forest text-white" : "bg-muted text-muted-foreground"}`}>{value ? "ON" : "OFF"}</span></button>;
}

function OfficerPhoto({ src, busy, onFile, onClear }: { src?: string; busy: boolean; onFile: (file: File | undefined) => void; onClear: () => void }) {
  return <div className="flex items-center gap-3"><div className="h-24 w-20 overflow-hidden rounded-md border-2 border-navy/20 bg-navy/10">{src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No photo</div>}</div><div className="space-y-2"><input type="file" accept="image/*" disabled={busy} className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1.5 file:text-primary-foreground" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />{src ? <Button type="button" size="sm" variant="ghost" onClick={onClear}>Remove</Button> : null}</div></div>;
}

function BrandLogo({ src, label, onFile, onClear }: { src?: string; label: string; onFile: (file: File | undefined) => void; onClear: () => void }) {
  return <div className="flex items-center gap-3"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border bg-muted p-1">{src ? <img src={src} alt={`${label} preview`} className="h-full w-full object-contain" /> : <span className="text-center text-[10px] text-muted-foreground">Default logo</span>}</div><div className="space-y-2"><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1.5 file:text-primary-foreground" onChange={(e) => { onFile(e.target.files?.[0]); e.currentTarget.value = ""; }} />{src ? <Button type="button" size="sm" variant="ghost" onClick={onClear}>Use default</Button> : null}</div></div>;
}

function SignatureUpload({ src, onFile, onClear }: { src?: string; onFile: (value: string) => void; onClear: () => void }) {
  return <div className="space-y-2">
    {src ? <div className="h-16 w-40 overflow-hidden rounded-md border bg-white p-2"><img src={src} alt="Signature preview" className="h-full w-full object-contain" /></div> : null}
    <input type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1.5 file:text-primary-foreground" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => onFile(String(reader.result)); reader.readAsDataURL(file); e.currentTarget.value = ""; }} />
    {src ? <Button type="button" size="sm" variant="ghost" onClick={onClear}>Remove</Button> : null}
  </div>;
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className ?? ""}`}><Label>{label}</Label>{children}</div>;
}

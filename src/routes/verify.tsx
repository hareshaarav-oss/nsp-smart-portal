import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Search, ShieldCheck, XCircle } from "lucide-react";
import { AppShell } from "@/components/nss/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveCertificate } from "@/lib/nss/certificates";
import { academicYear, formatLongDate } from "@/lib/nss/format";
import { useNssStore } from "@/lib/nss/store";

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : "",
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { id: initialId } = Route.useSearch();
  const [id, setId] = useState(initialId);
  const volunteers = useNssStore((s) => s.volunteers);
  const events = useNssStore((s) => s.events);
  const certificates = useNssStore((s) => s.certificates);
  const attendance = useNssStore((s) => s.attendance);
  const settings = useNssStore((s) => s.settings);
  const result = useMemo(
    () => resolveCertificate({ volunteers, events, certificates, attendance }, id),
    [id, volunteers, events, certificates, attendance],
  );
  const searched = Boolean(id.trim());

  return (
    <AppShell eyebrow="PUBLIC CERTIFICATE VERIFICATION" current="home">
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <Card className="overflow-hidden">
          <CardHeader className="bg-navy text-paper">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck /> Certificate Verification
            </CardTitle>
            <p className="text-sm text-paper/75">
              Enter the Certificate ID printed on the NSS certificate, or scan the QR code.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                setId((value) => value.trim());
              }}
            >
              <input
                className="h-11 flex-1 rounded-md border border-border bg-card px-3 text-sm"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="NSS/2026-27/NSS001/..."
                aria-label="Certificate ID"
              />
              <Button type="submit">
                <Search /> Verify
              </Button>
            </form>
          </CardContent>
        </Card>

        {result ? (
          <Card className="border-forest/40">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-forest">
                <CheckCircle2 />
                <strong>Certificate Verified</strong>
                <Badge tone="forest">VALID</Badge>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Student" value={result.volunteer.fullName} />
                <Info label="Event" value={result.event.name} />
                <Info label="Date" value={formatLongDate(result.event.date)} />
                <Info label="Certificate ID" value={result.serial} />
                <Info label="College" value={settings.collegeName} />
                <Info label="Academic Year" value={academicYear(result.event.date)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Only certificate verification details are shown. Private student information is not
                exposed.
              </p>
            </CardContent>
          </Card>
        ) : searched ? (
          <Card className="border-danger/40">
            <CardContent className="flex items-center gap-2 pt-6 text-danger">
              <XCircle />
              <strong>Certificate not found or invalid.</strong>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

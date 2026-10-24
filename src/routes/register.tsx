import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/nss/shell";
import { OfficialLetterhead } from "@/components/nss/official-letterhead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blobToDataUrl, compressPassport, rememberPhoto } from "@/lib/nss/media";
import { latinDigits } from "@/lib/nss/format";
import { useNssStore, rememberVolunteer } from "@/lib/nss/store";
import type { Course, Gender, NssRole, NssUnit, Volunteer } from "@/lib/nss/types";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const addLog = useNssStore((s) => s.addLog);
  const [done, setDone] = useState<{ name: string; id: string; mobile: string; enrollment: string } | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    course: "B.A." as Course,
    semester: "1",
    unit: "Unit 1" as NssUnit,
    nssRole: "Volunteer" as NssRole,
    fatherName: "",
    dob: "",
    gender: "" as Gender,
    bloodGroup: "",
    address: "",
    parentMobile: "",
    abcId: "",
    myBharatId: "",
    emergencyContact: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const { blob } = await compressPassport(file);
      setPhotoUrl(await blobToDataUrl(blob));
    } catch {
      toast.error("Could not read that photograph. Try a JPG or PNG.");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    let mobile = latinDigits(form.mobile).replace(/\D/g, "");
    if (mobile.length === 12 && mobile.startsWith("91")) mobile = mobile.slice(2);
    if (!/^\d{10}$/.test(mobile)) {
      toast.error("Enter a 10-digit mobile number.");
      return;
    }
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "register", ...form, mobile, photoUrl }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; volunteer?: Volunteer };
      if (!res.ok || !data.ok || !data.volunteer) {
        const message = data.error || "Cloud save failed";
        if (res.status === 409 || /already/i.test(message)) throw new Error(message);
        throw new Error(message);
      }
      rememberVolunteer({ ...data.volunteer, mobile });
      try {
        const fresh = await fetch("/api/nss-cloud", { cache: "no-store" });
        if (fresh.ok) {
          const cloud = (await fresh.json()) as {
            ok?: boolean;
            volunteers?: Volunteer[];
            visitors?: number;
            alumniCount?: number;
            serviceHours?: number;
          };
          if (cloud.ok && Array.isArray(cloud.volunteers)) {
            useNssStore.getState().applyCloud({
              volunteers: cloud.volunteers,
              visitors: cloud.visitors,
              alumniCount: cloud.alumniCount,
              serviceHours: cloud.serviceHours,
            });
          }
        }
      } catch {
        /* the saved volunteer stays in the local roll */
      }
      addLog("Student registration", `Registered ${data.volunteer.fullName} (${data.volunteer.enrollment}).`);
      rememberPhoto(
        [data.volunteer.volunteerId, data.volunteer.id, data.volunteer.fullName.toLowerCase()],
        photoUrl,
      );
      toast.success("Registration saved on the college cloud.");
      setDone({
        name: data.volunteer.fullName,
        id: data.volunteer.volunteerId,
        mobile,
        enrollment: data.volunteer.enrollment,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save the registration.";
      if (/already/i.test(message)) {
        toast.error(message);
        return;
      }
      toast.error(message || "Could not save on the college cloud. Try again.");
      return;
    }
  }

  return (
    <AppShell eyebrow="NSS STUDENT REGISTRATION">
      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10">
        <OfficialLetterhead title="Student registration" compact />
        <Card>
          <CardHeader>
            <CardTitle>Student registration form</CardTitle>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="space-y-3 text-center">
                <p className="font-display text-2xl font-semibold text-forest">Registration successful</p>
                <p className="text-muted-foreground">{done.name} is now on the NSS roll.</p>
                <div className="rounded-lg border border-border bg-muted/60 px-4 py-3 text-left text-sm">
                  <p>
                    Username (first name in CAPITAL):{" "}
                    <strong>{done.name.trim().split(/\s+/)[0]?.toUpperCase()}</strong>
                  </p>
                  <p>
                    Password: registered mobile <strong>{done.mobile}</strong>
                  </p>
                  <p>
                    Volunteer ID: <strong>{done.id}</strong> · Enrollment: <strong>{done.enrollment}</strong>
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  <Button asChild>
                    <Link to="/login">Go to student login</Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDone(null);
                      setPhotoUrl("");
                    }}
                  >
                    Register another
                  </Button>
                </div>
              </div>
            ) : (
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
                <div className="sm:col-span-2 flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/40 p-4">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" className="h-28 w-24 rounded-md object-cover ring-2 ring-forest" />
                  ) : (
                    <div className="flex h-28 w-24 items-center justify-center rounded-md bg-navy text-xs text-paper">
                      Photo
                    </div>
                  )}
                  <Label>Passport photograph (auto-compressed)</Label>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-sm"
                    onChange={(e) => void onPhoto(e.target.files?.[0])}
                  />
                </div>
                <Field label="Full name" className="sm:col-span-2">
                  <Input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
                </Field>
                <Field label="Mobile number">
                  <Input required inputMode="numeric" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
                <Field label="Course">
                  <select className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm" value={form.course} onChange={(e) => set("course", e.target.value as Course)}>
                    <option>B.A.</option>
                    <option>B.Com.</option>
                    <option>B.Sc.</option>
                  </select>
                </Field>
                <Field label="Semester">
                  <select className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm" value={form.semester} onChange={(e) => set("semester", e.target.value)}>
                    {["1", "2", "3", "4", "5", "6"].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="NSS unit">
                  <select className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm" value={form.unit} onChange={(e) => set("unit", e.target.value as NssUnit)}>
                    <option>Unit 1</option>
                    <option>Unit 2</option>
                  </select>
                </Field>
                <Field label="Role">
                  <Input value="Volunteer" readOnly />
                </Field>
                <Field label="Date of birth">
                  <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
                </Field>
                <Field label="Gender">
                  <select className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm" value={form.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Father / guardian">
                  <Input value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
                </Field>
                <Field label="Blood group">
                  <select className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm" value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                    <option value="">Select</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </Field>
                <Field label="ABC ID">
                  <Input value={form.abcId} onChange={(e) => set("abcId", e.target.value)} />
                </Field>
                <Field label="MY Bharat ID">
                  <Input value={form.myBharatId} onChange={(e) => set("myBharatId", e.target.value)} />
                </Field>
                <Field label="Parent mobile">
                  <Input value={form.parentMobile} onChange={(e) => set("parentMobile", e.target.value)} />
                </Field>
                <Field label="Emergency contact">
                  <Input value={form.emergencyContact} onChange={(e) => set("emergencyContact", e.target.value)} />
                </Field>
                <Field label="Address" className="sm:col-span-2">
                  <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="submit">Submit registration</Button>
                  <Button type="button" variant="outline" asChild>
                    <Link to="/">Cancel</Link>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

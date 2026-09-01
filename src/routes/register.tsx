import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/nss/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blobToDataUrl, compressPassport } from "@/lib/nss/media";
import { useNssStore } from "@/lib/nss/store";
import type { Course, Gender, NssRole, NssUnit } from "@/lib/nss/types";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const addVolunteer = useNssStore((s) => s.addVolunteer);
  const addLog = useNssStore((s) => s.addLog);
  const [done, setDone] = useState<{ name: string; id: string; mobile: string; enrollment: string } | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    aadhaarNumber: "",
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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.mobile.trim())) {
      toast.error("Enter a 10-digit mobile number.");
      return;
    }
    const v = addVolunteer({ ...form, photoUrl });
    addLog("Student registration", `Registered ${v.fullName} (${v.enrollment}).`);
    setDone({ name: v.fullName, id: v.volunteerId, mobile: v.mobile, enrollment: v.enrollment });
    toast.success("Registration saved.");
  }

  return (
    <AppShell eyebrow="NSS STUDENT REGISTRATION">
      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-16">
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
                <Field label="Mobile (this is the password)">
                  <Input required inputMode="numeric" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} />
                </Field>
                <Field label="Aadhaar number">
                  <Input inputMode="numeric" maxLength={12} value={form.aadhaarNumber} onChange={(e) => set("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))} />
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
                  <select className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm" value={form.nssRole} onChange={(e) => set("nssRole", e.target.value as NssRole)}>
                    <option>Volunteer</option>
                    <option>Leader</option>
                  </select>
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

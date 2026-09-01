import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OfficialLetterhead } from "@/components/nss/official-letterhead";
import { downloadAlumniExcel } from "@/lib/nss/reports";
import { alumniVolunteers, useNssStore } from "@/lib/nss/store";

export const Route = createFileRoute("/po/alumni")({ component: AlumniPage });

function AlumniPage() {
  const state = useNssStore();
  const rows = alumniVolunteers(state);

  return (
    <div className="space-y-4">
      <OfficialLetterhead title="NSS Alumni file" compact />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Alumni</h2>
          <p className="text-sm text-muted-foreground">
            Editable alumni register. Move a volunteer here from the Volunteers tab. Excel download is an editable file.
          </p>
        </div>
        <Button onClick={() => downloadAlumniExcel(state)} disabled={!rows.length}>
          Download editable Excel
        </Button>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                {["#", "ID", "Name", "Mobile", "Course", "Year", "Notes", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((v, i) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-3 py-2 tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2">{v.volunteerId}</td>
                  <td className="px-3 py-2">
                    <Input
                      value={v.fullName}
                      onChange={(e) => state.updateVolunteer(v.id, { fullName: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={v.mobile}
                      onChange={(e) => state.updateVolunteer(v.id, { mobile: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={`${v.course}`}
                      onChange={(e) => state.updateVolunteer(v.id, { course: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={v.alumniYear ?? ""}
                      onChange={(e) => state.updateVolunteer(v.id, { alumniYear: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={v.alumniNotes ?? ""}
                      onChange={(e) => state.updateVolunteer(v.id, { alumniNotes: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        state.restoreAlumni(v.id);
                        toast.success(`${v.fullName} restored to volunteers`);
                      }}
                    >
                      Restore
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No alumni yet. Open Volunteers and use “Send to alumni”.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

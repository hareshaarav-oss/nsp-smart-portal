import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfficialLetterhead, ReportPreview } from "@/components/nss/official-letterhead";
import {
  activityReportRows,
  alumniReportRows,
  buildAttendanceMatrix,
  downloadActivityExcel,
  downloadAlumniExcel,
  downloadAttendanceExcel,
  downloadEventExcel,
  downloadHoursExcel,
  downloadVolunteerExcel,
  downloadYearlyEventExcel,
  eventReportRows,
  hoursReportRows,
  printAlumniReport,
  printAttendanceReport,
  printOfficialReport,
  printVolunteerReport,
  volunteerReportRows,
} from "@/lib/nss/reports";
import { academicYear, todayIso } from "@/lib/nss/format";
import { useNssStore } from "@/lib/nss/store";

export const Route = createFileRoute("/po/reports")({ component: ReportsPage });

function ReportsPage() {
  const state = useNssStore();
  const [openPreview, setOpenPreview] = useState<string | null>("attendance");
  const [month, setMonth] = useState(todayIso().slice(0, 7));
  const yearlyAtt = buildAttendanceMatrix(state, { mode: "yearly" });
  const monthlyAtt = buildAttendanceMatrix(state, { mode: "monthly", month });

  const previews: Record<
    string,
    { title?: string; headers: string[]; rows: string[][]; intro?: string[] }
  > = {
    volunteer: volunteerReportRows(state),
    attendance: yearlyAtt,
    monthly: monthlyAtt,
    event: eventReportRows(state),
    yearly: eventReportRows(state, true),
    hours: hoursReportRows(state),
    activity: activityReportRows(state),
    alumni: alumniReportRows(state),
  };

  return (
    <div className="space-y-6">
      <OfficialLetterhead title="Official reports" compact />
      <Button variant="outline" onClick={() => {
        const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        const todayEvents = state.events.filter((event) => (event.date || "").slice(0, 10) === day);
        const lines = todayEvents.flatMap((event) =>
          state.attendance.filter((row) => row.eventId === event.id && row.present).map((row) => {
            const person = state.volunteers.find((volunteer) => volunteer.id === row.volunteerId);
            return `<tr><td>${person?.fullName || row.volunteerId}</td><td>${person?.unit || ""}</td><td>${event.name}</td><td>${event.hours || 0}</td></tr>`;
          }),
        );
        const html = `<!doctype html><html><head><title>Today</title><style>body{font-family:Georgia,serif;padding:32px;color:#13294b}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border-bottom:1px solid #ddd;text-align:left;padding:8px}</style></head><body><p>NSS</p><h1>${state.settings.collegeName}</h1><p>Attendance ${day}</p><table><tr><th>Name</th><th>Unit</th><th>Event</th><th>Hours</th></tr>${lines.join("") || "<tr><td colspan='4'>No attendance today.</td></tr>"}</table></body></html>`;
        const frame = window.open("", "_blank");
        if (!frame) return;
        frame.document.write(html);
        frame.document.close();
        frame.focus();
        frame.print();
      }}>Today's report PDF</Button>

      <Card className="border-forest/30">
        <CardHeader>
          <CardTitle className="text-base">Press</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/po/press">
              <Eye />
              Press report
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-navy/20">
        <CardHeader>
          <CardTitle className="text-base">Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <Button onClick={() => downloadAttendanceExcel(state, { mode: "yearly" })}>Yearly Excel</Button>
            <Button variant="outline" onClick={() => void printAttendanceReport(state, { mode: "yearly" })}>Print yearly</Button>
            <label className="text-xs text-muted-foreground">
              Month
              <input
                type="month"
                className="ml-2 h-9 border border-border bg-card px-2 text-sm text-foreground"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <Button variant="outline" onClick={() => downloadAttendanceExcel(state, { mode: "monthly", month })}>Monthly Excel</Button>
            <Button variant="outline" onClick={() => void printAttendanceReport(state, { mode: "monthly", month })}>Print monthly</Button>
          </div>
          <ReportPreview
            title={`Attendance Report — Full yearly (${academicYear()})`}
            headers={yearlyAtt.headers}
            rows={yearlyAtt.rows}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          id="volunteer"
          open={openPreview}
          onPreview={setOpenPreview}
          title="Volunteer Report"
          onExcel={() => downloadVolunteerExcel(state)}
          onPrint={() => void printVolunteerReport(state)}
          preview={previews.volunteer}
        />
        <ReportCard
          id="event"
          open={openPreview}
          onPreview={setOpenPreview}
          title="Event Report"
          onExcel={() => downloadEventExcel(state)}
          onPrint={() =>
            void printOfficialReport({
              title: "Event Report",
              headers: previews.event.headers,
              rows: previews.event.rows,
            })
          }
          preview={previews.event}
        />
        <ReportCard
          id="yearly"
          open={openPreview}
          onPreview={setOpenPreview}
          title={`Yearly Activity Report (${academicYear()})`}
          onExcel={() => downloadYearlyEventExcel(state)}
          onPrint={() =>
            void printOfficialReport({
              title: `Yearly Activity Report — ${academicYear()}`,
              headers: previews.yearly.headers,
              rows: previews.yearly.rows,
            })
          }
          preview={previews.yearly}
        />
        <ReportCard
          id="hours"
          open={openPreview}
          onPreview={setOpenPreview}
          title="Service Hours Report"
          onExcel={() => downloadHoursExcel(state)}
          onPrint={() =>
            void printOfficialReport({
              title: "Service Hours Report",
              headers: previews.hours.headers,
              rows: previews.hours.rows,
            })
          }
          preview={previews.hours}
        />
        <ReportCard
          id="activity"
          open={openPreview}
          onPreview={setOpenPreview}
          title="Activity Report"
          onExcel={() => downloadActivityExcel(state)}
          onPrint={() =>
            void printOfficialReport({
              title: "Activity Report",
              headers: previews.activity.headers,
              rows: previews.activity.rows,
            })
          }
          preview={previews.activity}
        />
        <ReportCard
          id="alumni"
          open={openPreview}
          onPreview={setOpenPreview}
          title="Alumni Register"
          onExcel={() => downloadAlumniExcel(state)}
          onPrint={() => void printAlumniReport(state)}
          preview={previews.alumni}
        />
      </div>
    </div>
  );
}

function ReportCard({
  id,
  title,
  onExcel,
  onPrint,
  preview,
  open,
  onPreview,
}: {
  id: string;
  title: string;
  onExcel: () => void;
  onPrint: () => void;
  preview: { title?: string; headers: string[]; rows: string[][]; intro?: string[] };
  open: string | null;
  onPreview: (id: string | null) => void;
}) {
  const shown = open === id;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <Button onClick={onExcel}>Excel</Button>
          <Button variant="outline" onClick={onPrint}>Print</Button>
        </div>
        {shown ? (
          <ReportPreview
            title={preview.title ?? title}
            headers={preview.headers}
            rows={preview.rows}
            intro={preview.intro}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

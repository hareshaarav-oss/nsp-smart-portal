import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Eye, Printer } from "lucide-react";
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
import { totalServiceHours, useNssStore } from "@/lib/nss/store";

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
      <div>
        <h2 className="font-display text-xl font-semibold">Reports</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Every downloaded report carries the college name, NSS SMART PORTAL, title and date. Print / PDF
          embeds the College logo and NSS logo so the page is never blank. Excel uses the same letterhead rows.
        </p>
      </div>

      <Card className="border-forest/30">
        <CardHeader>
          <CardTitle className="text-base">Event-wise press report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Dedicated Press desk: choose the event, photos load from Gallery, write or paste Gujarati, attendance
            prints at the foot, then View. English NAAC report is generated from the same file.
          </p>
          <Button asChild>
            <Link to="/po/press">
              <Eye />
              Open Press report desk
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-navy/20">
        <CardHeader>
          <CardTitle className="text-base">Attendance — yearly & monthly (event-wise columns)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            One Excel: Sr. No., Volunteer ID, Name, Unit, then a column for every event (Event name + date)
            with Present / Absent. Full yearly covers academic year {academicYear()}. Monthly uses the month you pick.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <Button onClick={() => downloadAttendanceExcel(state, { mode: "yearly" })}>
              <Download />
              Full yearly Excel
            </Button>
            <Button variant="outline" onClick={() => void printAttendanceReport(state, { mode: "yearly" })}>
              <Printer />
              Print yearly
            </Button>
            <label className="space-y-1 text-xs text-muted-foreground">
              Month
              <input
                type="month"
                className="flex h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <Button onClick={() => downloadAttendanceExcel(state, { mode: "monthly", month })}>
              <Download />
              Monthly Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => void printAttendanceReport(state, { mode: "monthly", month })}
            >
              <Printer />
              Print monthly
            </Button>
            <Button variant="outline" onClick={() => setOpenPreview("attendance")}>
              <Eye />
              Preview yearly
            </Button>
          </div>
          {openPreview === "attendance" ? (
            <ReportPreview
              title={`Attendance Report — Full yearly (${academicYear()})`}
              headers={yearlyAtt.headers}
              rows={yearlyAtt.rows}
            />
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          id="volunteer"
          open={openPreview}
          onPreview={setOpenPreview}
          title="Volunteer Report"
          body="Active roll, A–Z by name, with ID, mobile, unit, course and hours."
          onExcel={() => downloadVolunteerExcel(state)}
          onPrint={() => void printVolunteerReport(state)}
          preview={previews.volunteer}
        />
        <ReportCard
          id="event"
          open={openPreview}
          onPreview={setOpenPreview}
          title="Event Report"
          body="Every activity with date, place, hours and turnout."
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
          body="Auto-compiled from this academic year. Also generated when you complete an activity."
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
          body={`Cumulative hours. Unit total: ${totalServiceHours(state)} hours.`}
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
          body="Narrative list of NSS programmes for files and press notes."
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
          body="Editable alumni file. Move volunteers from the Volunteers tab, then download Excel."
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
  body,
  onExcel,
  onPrint,
  preview,
  open,
  onPreview,
}: {
  id: string;
  title: string;
  body: string;
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
        <p className="text-sm text-muted-foreground">{body}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onExcel}>
            <Download />
            Excel
          </Button>
          <Button variant="outline" onClick={onPrint}>
            <Printer />
            Print / PDF with logos
          </Button>
          <Button variant="outline" onClick={() => onPreview(shown ? null : id)}>
            <Eye />
            {shown ? "Hide preview" : "Preview"}
          </Button>
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

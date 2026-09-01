# NSS Smart Portal — Integrated Feature Baseline

This build preserves the existing NSS portal and integrates the agreed upgrades without replacing existing required facilities.

## Included
- Public Home live volunteers, visitors, alumni and service-hours statistics
- Upcoming event start/end dates and times
- Event volunteer assignment and RSVP participation panel
- Student RSVP: Will Attend / Will Not Attend
- Attendance Save button and event-wise attendance
- Service-hour tracking and 240-hour student progress
- Birthday radar: today/week/month/all, student dashboard birthday, home birthday board, WhatsApp template
- Gallery photo + video upload/playback
- External press report upload and generated press/report workflow
- Academic-year reporting
- Backup/restore
- Settings Save controls
- Public certificate verification route
- Existing certificate and ID-card templates preserved as the design baseline
- Windows-safe Vite launcher (`with-app-env.mjs`)

## Locked rules
- Do not verify ABC ID or MY Bharat ID.
- Do not alter the approved college logo lettering.
- Do not redesign the approved certificate.
- Do not remove existing required facilities.
- Do not create duplicate modules for the same task.


## Master integration additions
- Soft-delete Recycle Bin with restore/permanent delete for volunteers, events, notices, gallery media and press reports.
- Complete backup now includes RSVP, press reports and recycle bin.
- PO Dashboard Smart Search searches students, events, certificates and press reports.
- Notification & Alert Center surfaced on PO Dashboard.
- Manual achievement badges can be awarded/removed from volunteer Smart Record.
- Expanded volunteer role options: Group Leader, Discipline Head, Camp Coordinator.

import { createFileRoute } from "@tanstack/react-router";
import { OfficialLetterhead } from "@/components/nss/official-letterhead";
import { Card, CardContent } from "@/components/ui/card";
import { formatLongDate } from "@/lib/nss/format";
import { useNssStore } from "@/lib/nss/store";

export const Route = createFileRoute("/po/logs")({ component: LogsPage });

function LogsPage() {
  const logs = useNssStore((s) => s.logs) ?? [];

  return (
    <div className="space-y-4">
      <OfficialLetterhead title="Activity logs" compact />
      <div>
        <h2 className="font-display text-xl font-semibold">Activity logs</h2>
        <p className="text-sm text-muted-foreground">
          Programme Officer actions — promotions, deletions, edits, alumni moves, registrations.
        </p>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                {["When", "Actor", "Action", "Details"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                    No activity yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-border">
                    <td className="px-3 py-2 text-xs">
                      {formatLongDate(log.at.slice(0, 10))}
                      <span className="block text-muted-foreground">{log.at.slice(11, 19)}</span>
                    </td>
                    <td className="px-3 py-2">{log.actor}</td>
                    <td className="px-3 py-2 font-medium">{log.action}</td>
                    <td className="px-3 py-2 text-muted-foreground">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

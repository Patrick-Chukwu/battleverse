import { useQuery } from "@tanstack/react-query";
import { rpcAdminQuestionStats } from "@/lib/admin-api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AnalyticsPanel() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: rpcAdminQuestionStats });

  return (
    <div className="space-y-4">
      <p className="font-bold text-muted-foreground">
        Too easy: &gt;90% correct with n≥30. Too hard: &lt;25% correct with n≥30. Timeouts are
        unanswered / negative chosen_index.
      </p>
      {stats.error && (
        <p className="font-bold text-destructive">
          {stats.error instanceof Error ? stats.error.message : "Could not load stats."}
        </p>
      )}
      <div className="glass-card overflow-hidden rounded-3xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-black">Prompt</TableHead>
              <TableHead className="font-black">n</TableHead>
              <TableHead className="font-black">% correct</TableHead>
              <TableHead className="font-black">Timeout %</TableHead>
              <TableHead className="font-black">Flag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(stats.data ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-md truncate font-bold">{row.prompt}</TableCell>
                <TableCell className="font-bold">{row.attempts}</TableCell>
                <TableCell className="font-bold">{row.pct_correct ?? "—"}</TableCell>
                <TableCell className="font-bold">{row.timeout_rate ?? "—"}</TableCell>
                <TableCell className="font-black uppercase text-destructive">{row.flag ?? ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {stats.isLoading && <p className="p-4 font-bold text-muted-foreground">Loading analytics…</p>}
      </div>
    </div>
  );
}

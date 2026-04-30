import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataPageSkeleton } from "@/components/DataPageSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle2, BellOff, ChevronLeft, ChevronRight, Filter } from "lucide-react";

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";
type StatusFilter = "all" | "open" | "acknowledged" | "snoozed" | "resolved";

const PAGE_SIZE = 20;

const severityColor: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-destructive/10 text-destructive/80 border-destructive/20",
  medium: "bg-accent/15 text-accent border-accent/30",
  low: "bg-primary/10 text-primary border-primary/20",
};

export default function AlertHistory() {
  const [page, setPage] = useState(0);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["alert-history", page, severityFilter, statusFilter],
    queryFn: async () => {
      const now = new Date().toISOString();
      let query = supabase
        .from("alert_log")
        .select("id, severity, title, description, created_at, acknowledged_at, resolved_at, snoozed_until, metadata", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      if (statusFilter === "open") {
        query = query.is("resolved_at", null).or(`snoozed_until.is.null,snoozed_until.lt.${now}`);
      } else if (statusFilter === "acknowledged") {
        query = query.is("resolved_at", null).not("acknowledged_at", "is", null);
      } else if (statusFilter === "snoozed") {
        query = query.is("resolved_at", null).gt("snoozed_until", now);
      } else if (statusFilter === "resolved") {
        query = query.not("resolved_at", "is", null);
      }

      const { data: rows, count, error } = await query;
      if (error) throw error;
      return { rows: rows ?? [], total: count ?? 0 };
    },
    staleTime: 60 * 1000,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function statusBadge(row: typeof rows[number]) {
    const now = new Date();
    if (row.resolved_at) return <Badge variant="outline" className="text-[8px] bg-green-500/10 text-green-500 border-green-500/30">RESOLVED</Badge>;
    if (row.snoozed_until && new Date(row.snoozed_until) > now) return <Badge variant="outline" className="text-[8px] bg-muted text-muted-foreground">SNOOZED</Badge>;
    if (row.acknowledged_at) return <Badge variant="outline" className="text-[8px] bg-primary/10 text-primary border-primary/30">ACK</Badge>;
    return <Badge variant="outline" className="text-[8px] bg-destructive/10 text-destructive border-destructive/30">OPEN</Badge>;
  }

  if (isLoading) return <DataPageSkeleton cards={2} rows={12} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alert History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full audit log of all alerts — filterable by severity and status
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Severity:</span>
              {(["all", "critical", "high", "medium", "low"] as SeverityFilter[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={severityFilter === s ? "default" : "outline"}
                  className="h-6 text-[10px] px-2"
                  onClick={() => { setSeverityFilter(s); setPage(0); }}
                >
                  {s.toUpperCase()}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 ml-4">
              <span className="text-xs text-muted-foreground">Status:</span>
              {(["all", "open", "acknowledged", "snoozed", "resolved"] as StatusFilter[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? "default" : "outline"}
                  className="h-6 text-[10px] px-2"
                  onClick={() => { setStatusFilter(s); setPage(0); }}
                >
                  {s.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" />
            Alerts
            <Badge variant="outline" className="text-[9px] ml-auto">{total} total</Badge>
            {isFetching && <span className="text-[9px] text-muted-foreground animate-pulse">refreshing…</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No alerts match the current filters.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => {
                const affectedEcus = Number((row.metadata as Record<string, unknown> | null)?.affected_ecus ?? 0);
                return (
                  <div key={row.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      row.severity === "critical" ? "bg-destructive animate-pulse"
                      : row.severity === "high" ? "bg-destructive"
                      : row.severity === "medium" ? "bg-accent"
                      : "bg-primary"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-xs font-medium">{row.title}</p>
                        <Badge variant="outline" className={`text-[8px] ${severityColor[row.severity] ?? ""}`}>
                          {row.severity.toUpperCase()}
                        </Badge>
                        {statusBadge(row)}
                      </div>
                      {row.description && (
                        <p className="text-[10px] text-muted-foreground">{row.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1.5 text-[9px] text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                          <Bell className="w-2.5 h-2.5" />
                          {new Date(row.created_at).toLocaleString("en-US")}
                        </span>
                        {row.acknowledged_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-primary" />
                            ack {new Date(row.acknowledged_at).toLocaleString("en-US")}
                          </span>
                        )}
                        {row.resolved_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                            resolved {new Date(row.resolved_at).toLocaleString("en-US")}
                          </span>
                        )}
                        {row.snoozed_until && new Date(row.snoozed_until) > new Date() && (
                          <span className="flex items-center gap-1">
                            <BellOff className="w-2.5 h-2.5" />
                            snoozed until {new Date(row.snoozed_until).toLocaleString("en-US")}
                          </span>
                        )}
                        {affectedEcus > 0 && <span>ECU: {affectedEcus}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">
                Page {page + 1} of {totalPages} ({total} records)
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="w-3 h-3 mr-1" /> Prev
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

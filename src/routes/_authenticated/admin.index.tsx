import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PageShell, Panel } from "@/components/kabari/shell";
import { StatusPill } from "@/components/kabari/status";
import { supabase } from "@/integrations/supabase/client";
import { useIsTeam } from "@/lib/auth-hooks";
import { STATUS_FLOW, STATUS_SHORT, categoryTag, formatKg, formatPkr } from "@/lib/kabari";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Collection console — Kabari Gang" },
      {
        name: "description",
        content:
          "Kabari Gang team console: new requests, today's pickups by sector, weights collected and amounts paid.",
      },
      { property: "og:title", content: "Collection console — Kabari Gang" },
      { property: "og:description", content: "Manage every scrap pickup across Islamabad." },
    ],
  }),
  component: AdminDashboard,
});

const FILTERS = ["all", "new", "today", "active", "completed"] as const;

function AdminDashboard() {
  const { isTeam, isLoading: roleLoading } = useIsTeam();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("new");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-requests"],
    enabled: isTeam,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pickup_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (roleLoading) {
    return (
      <PageShell wide>
        <p className="mt-10 text-sm text-muted-foreground">Checking your access…</p>
      </PageShell>
    );
  }

  if (!isTeam) {
    return (
      <PageShell wide>
        <Panel className="mt-10">
          <h1 className="text-lg font-semibold">Team access only</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This console is for the Kabari Gang collection team.
          </p>
          <Link to="/requests" className="mt-4 inline-block text-sm text-accent">
            Go to my pickups
          </Link>
        </Panel>
      </PageShell>
    );
  }

  const all = requests ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const isToday = (item: (typeof all)[number]) =>
    item.preferred_date === today || (item.scheduled_at ?? "").slice(0, 10) === today;

  const newOnes = all.filter((item) => item.status === "received");
  const todays = all.filter(
    (item) => isToday(item) && item.status !== "completed" && item.status !== "rejected",
  );
  const activeOnes = all.filter(
    (item) =>
      item.status !== "received" && item.status !== "completed" && item.status !== "rejected",
  );
  const completed = all.filter((item) => item.status === "completed");

  const totalKg = all.reduce((sum, item) => sum + Number(item.actual_weight_kg ?? 0), 0);
  const totalPaid = all.reduce((sum, item) => sum + Number(item.amount_paid ?? 0), 0);
  const customers = new Set(all.map((item) => item.customer_id)).size;

  const sectorCounts = todays.reduce<Record<string, number>>((acc, item) => {
    acc[item.sector] = (acc[item.sector] ?? 0) + 1;
    return acc;
  }, {});
  const sectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);
  const maxSector = Math.max(1, ...sectors.map(([, count]) => count));

  const visible =
    filter === "new"
      ? newOnes
      : filter === "today"
        ? todays
        : filter === "active"
          ? activeOnes
          : filter === "completed"
            ? completed
            : all;

  return (
    <PageShell wide>
      <div className="mt-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Team console</p>
        <h1 className="mt-1 text-2xl font-semibold">Collection operations</h1>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <Stat label="New requests" value={String(newOnes.length)} />
        <Stat label="Pending pickups" value={String(activeOnes.length)} />
        <Stat label="Today's pickups" value={String(todays.length)} />
        <Stat label="Completed" value={String(completed.length)} />
        <Stat label="Customers" value={String(customers)} />
        <Stat label="Scrap collected" value={`${totalKg.toFixed(1)} kg`} />
        <Stat label="Amount paid" value={formatPkr(totalPaid)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Requests</h2>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize transition-transform duration-150 active:scale-95 ${
                    filter === item
                      ? "bg-primary text-primary-foreground"
                      : "bg-glass text-muted-foreground ring-1 ring-border hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading requests…</p>
            ) : visible.length ? (
              visible.map((request) => (
                <Link
                  key={request.id}
                  to="/admin/$id"
                  params={{ id: request.id }}
                  className="flex items-center gap-3 rounded-xl bg-glass p-3 ring-1 ring-border transition-transform duration-150 hover:bg-secondary active:scale-[0.99]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary font-mono text-xs font-bold text-accent">
                    {categoryTag(request.categories)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {request.contact_name || "Customer"} · {request.sector}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">
                      {request.code} · {request.categories?.join(", ")} · est.{" "}
                      {formatKg(request.estimated_weight_kg)}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <StatusPill status={request.status} />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {request.assigned_to || "unassigned"}
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nothing in this view.</p>
            )}
          </div>
        </Panel>

        <div className="grid gap-4 lg:col-span-4">
          <Panel>
            <h2 className="text-sm font-semibold">Today by sector</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Plan the route before dispatch.</p>
            <div className="mt-3 space-y-2">
              {sectors.length ? (
                sectors.map(([sector, count]) => (
                  <div key={sector} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 font-mono text-sm font-medium">{sector}</span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <span
                        className="barfill block h-full rounded-full bg-primary"
                        style={{ width: `${(count / maxSector) * 100}%` }}
                      />
                    </span>
                    <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">
                      {count} pickup{count > 1 ? "s" : ""}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No pickups scheduled for today.</p>
              )}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-sm font-semibold">Pipeline</h2>
            <div className="mt-3 space-y-1.5">
              {STATUS_FLOW.map((step) => {
                const count = all.filter((item) => item.status === step).length;
                return (
                  <div key={step} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{STATUS_SHORT[step]}</span>
                    <span className="font-mono font-bold text-accent">{count}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel settle rounded-2xl p-3.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold text-accent">{value}</p>
    </div>
  );
}

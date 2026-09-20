import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageShell, Panel } from "@/components/kabari/shell";
import { StatusPill } from "@/components/kabari/status";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/auth-hooks";
import { categoryTag, formatKg, formatPkr } from "@/lib/kabari";

export const Route = createFileRoute("/_authenticated/requests/")({
  head: () => ({
    meta: [
      { title: "My pickups — Kabari Gang" },
      {
        name: "description",
        content: "Track your scrap pickup requests, past collections and payments received.",
      },
      { property: "og:title", content: "My pickups — Kabari Gang" },
      { property: "og:description", content: "Track your scrap pickups and payments." },
    ],
  }),
  component: MyRequests,
});

function MyRequests() {
  const { data: user } = useCurrentUser();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-requests", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pickup_requests")
        .select("*")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const active = (requests ?? []).filter(
    (item) => item.status !== "completed" && item.status !== "rejected",
  );
  const past = (requests ?? []).filter(
    (item) => item.status === "completed" || item.status === "rejected",
  );
  const totalPaid = past.reduce((sum, item) => sum + Number(item.amount_paid ?? 0), 0);
  const totalKg = past.reduce((sum, item) => sum + Number(item.actual_weight_kg ?? 0), 0);

  return (
    <PageShell>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My pickups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you've sold to Kabari Gang, and what's on the way.
          </p>
        </div>
        <Link
          to="/sell"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-150 active:scale-95"
        >
          New pickup
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Active requests" value={String(active.length)} />
        <Stat label="Scrap sold" value={`${totalKg.toFixed(1)} kg`} />
        <Stat label="Total received" value={formatPkr(totalPaid)} />
      </div>

      <div className="mt-4 grid gap-4">
        <Panel>
          <h2 className="text-sm font-semibold">In progress</h2>
          <div className="mt-3 space-y-2.5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : active.length ? (
              active.map((request) => <RequestRow key={request.id} request={request} />)
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing in progress. Start by listing your scrap.
              </p>
            )}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-sm font-semibold">Previous collections</h2>
          <div className="mt-3 space-y-2.5">
            {past.length ? (
              past.map((request) => <RequestRow key={request.id} request={request} />)
            ) : (
              <p className="text-sm text-muted-foreground">No completed collections yet.</p>
            )}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel settle rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-accent">{value}</p>
    </div>
  );
}

type RequestRowProps = {
  request: {
    id: string;
    code: string;
    categories: string[];
    sector: string;
    status: string;
    estimated_weight_kg: number | null;
    actual_weight_kg: number | null;
    amount_paid: number | null;
  };
};

function RequestRow({ request }: RequestRowProps) {
  return (
    <Link
      to="/requests/$id"
      params={{ id: request.id }}
      className="flex items-center gap-3 rounded-xl bg-glass p-3 ring-1 ring-border transition-transform duration-150 hover:bg-secondary active:scale-[0.99]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary font-mono text-xs font-bold text-accent">
        {categoryTag(request.categories)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {request.categories?.join(", ") || "Scrap"}
        </span>
        <span className="block font-mono text-[11px] text-muted-foreground">
          {request.code} · {request.sector} ·{" "}
          {request.actual_weight_kg
            ? formatKg(request.actual_weight_kg)
            : `est. ${formatKg(request.estimated_weight_kg)}`}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <StatusPill status={request.status} />
        {request.amount_paid ? (
          <span className="font-mono text-xs text-success">{formatPkr(request.amount_paid)}</span>
        ) : null}
      </span>
    </Link>
  );
}

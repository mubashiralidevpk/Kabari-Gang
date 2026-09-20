import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageShell, Panel } from "@/components/kabari/shell";
import { ScrapPhotoGrid } from "@/components/kabari/photo";
import { StatusPill, StatusTimeline } from "@/components/kabari/status";
import { supabase } from "@/integrations/supabase/client";
import { PICKUP_SLOTS, STATUS_LABELS, formatKg, formatPkr } from "@/lib/kabari";
import type { RequestStatus } from "@/lib/kabari";

export const Route = createFileRoute("/_authenticated/requests/$id")({
  head: () => ({
    meta: [
      { title: "Pickup status — Kabari Gang" },
      {
        name: "description",
        content: "Follow your Kabari Gang pickup from request to weighing and payment.",
      },
      { property: "og:title", content: "Pickup status — Kabari Gang" },
      { property: "og:description", content: "Follow your scrap pickup step by step." },
    ],
  }),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pickup_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["request-events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_events")
        .select("*")
        .eq("request_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <PageShell>
        <p className="mt-10 text-sm text-muted-foreground">Loading your pickup…</p>
      </PageShell>
    );
  }

  if (!request) {
    return (
      <PageShell>
        <Panel className="mt-10">
          <h1 className="text-lg font-semibold">Pickup not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This request doesn't exist or isn't yours.
          </p>
          <Link to="/requests" className="mt-4 inline-block text-sm text-accent">
            Back to my pickups
          </Link>
        </Panel>
      </PageShell>
    );
  }

  const slot = PICKUP_SLOTS.find((item) => item.value === request.preferred_slot)?.label;

  return (
    <PageShell>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{request.code}</p>
          <h1 className="mt-1 text-2xl font-semibold">
            {request.categories?.join(", ") || "Scrap pickup"}
          </h1>
        </div>
        <StatusPill status={request.status} />
      </div>

      <Panel className="mt-4 overflow-x-auto">
        <div className="min-w-[540px]">
          <StatusTimeline status={request.status} />
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7">
          <h2 className="text-sm font-semibold">Your listing</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Info label="Estimated weight" value={formatKg(request.estimated_weight_kg)} />
            <Info label="Area" value={request.sector} />
            <Info label="Address" value={request.address || "—"} />
            <Info label="Preferred slot" value={slot ?? request.preferred_slot} />
            <Info label="Preferred date" value={request.preferred_date ?? "—"} />
            <Info label="Assigned team" value={request.assigned_to || "Not assigned yet"} />
          </div>
          {request.details ? (
            <p className="mt-4 rounded-xl bg-glass p-3 text-sm text-muted-foreground">
              {request.details}
            </p>
          ) : null}
          <div className="mt-4">
            <ScrapPhotoGrid paths={request.photos} />
          </div>
        </Panel>

        <div className="grid gap-4 lg:col-span-5">
          <Panel>
            <h2 className="text-sm font-semibold">Final transaction</h2>
            {request.actual_weight_kg ? (
              <div className="mt-3 space-y-2.5">
                <div className="rounded-xl bg-secondary p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Actual weight
                  </p>
                  <p className="settle mt-1 font-mono text-3xl font-bold text-accent">
                    {formatKg(request.actual_weight_kg)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    you estimated {formatKg(request.estimated_weight_kg)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Info label="Rate / kg" value={formatPkr(request.rate_per_kg)} />
                  <Info label="Final amount" value={formatPkr(request.final_amount)} />
                </div>
                <div className="rounded-xl bg-success/15 p-3">
                  <p className="text-xs uppercase tracking-wide text-success">Paid to you</p>
                  <p className="font-mono text-xl font-bold text-success">
                    {formatPkr(request.amount_paid)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Weighing and pricing appear here once our team has collected your scrap.
              </p>
            )}
          </Panel>

          <Panel>
            <h2 className="text-sm font-semibold">Updates</h2>
            <ul className="mt-3 space-y-2.5">
              {(events ?? []).map((event) => (
                <li key={event.id} className="rounded-xl bg-glass p-3">
                  <p className="text-sm font-medium">
                    {STATUS_LABELS[event.status as RequestStatus] ?? event.status}
                  </p>
                  {event.note ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{event.note}</p>
                  ) : null}
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">
                    {new Date(event.created_at).toLocaleString("en-PK")}
                  </p>
                </li>
              ))}
              {!events?.length ? (
                <li className="text-sm text-muted-foreground">No updates yet.</li>
              ) : null}
            </ul>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-glass p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

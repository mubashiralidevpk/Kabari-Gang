import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageShell, Panel } from "@/components/kabari/shell";
import { ScrapPhotoGrid } from "@/components/kabari/photo";
import { StatusPill, StatusTimeline } from "@/components/kabari/status";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useIsTeam } from "@/lib/auth-hooks";
import {
  PICKUP_SLOTS,
  STATUS_FLOW,
  STATUS_LABELS,
  TEAM_MEMBERS,
  formatKg,
  formatPkr,
  nextStatus,
} from "@/lib/kabari";
import type { RequestStatus } from "@/lib/kabari";

export const Route = createFileRoute("/_authenticated/admin/$id")({
  head: () => ({
    meta: [
      { title: "Manage pickup — Kabari Gang" },
      {
        name: "description",
        content:
          "Accept, schedule, dispatch, weigh, price and complete a Kabari Gang scrap collection.",
      },
      { property: "og:title", content: "Manage pickup — Kabari Gang" },
      { property: "og:description", content: "Run a scrap collection end to end." },
    ],
  }),
  component: AdminRequestDetail,
});

function AdminRequestDetail() {
  const { id } = Route.useParams();
  const { isTeam, isLoading: roleLoading } = useIsTeam();
  const queryClient = useQueryClient();

  const { data: request } = useQuery({
    queryKey: ["request", id],
    enabled: isTeam,
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
    enabled: isTeam,
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

  const [assignedTo, setAssignedTo] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [weight, setWeight] = useState("");
  const [rate, setRate] = useState("");
  const [paid, setPaid] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!request) return;
    setAssignedTo(request.assigned_to ?? "");
    setScheduledAt(request.scheduled_at ? request.scheduled_at.slice(0, 16) : "");
    setWeight(request.actual_weight_kg ? String(request.actual_weight_kg) : "");
    setRate(request.rate_per_kg ? String(request.rate_per_kg) : "");
    setPaid(request.amount_paid ? String(request.amount_paid) : "");
    setNotes(request.admin_notes ?? "");
  }, [request]);

  const computedAmount =
    Number(weight) > 0 && Number(rate) > 0 ? Number(weight) * Number(rate) : null;

  type PickupUpdate = Database["public"]["Tables"]["pickup_requests"]["Update"];

  const update = useMutation({
    mutationFn: async ({
      patch,
      event,
    }: {
      patch: PickupUpdate;
      event?: { status: string; note: string };
    }) => {
      const { error } = await supabase.from("pickup_requests").update(patch).eq("id", id);
      if (error) throw error;
      if (event) {
        const { error: eventError } = await supabase
          .from("request_events")
          .insert({ request_id: id, status: event.status, note: event.note });
        if (eventError) throw eventError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request", id] });
      queryClient.invalidateQueries({ queryKey: ["request-events", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      toast.success("Request updated");
    },
    onError: () => toast.error("Could not update this request"),
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
          <Link to="/requests" className="mt-3 inline-block text-sm text-accent">
            Go to my pickups
          </Link>
        </Panel>
      </PageShell>
    );
  }

  if (!request) {
    return (
      <PageShell wide>
        <p className="mt-10 text-sm text-muted-foreground">Loading request…</p>
      </PageShell>
    );
  }

  const upcoming = nextStatus(request.status);
  const slot = PICKUP_SLOTS.find((item) => item.value === request.preferred_slot)?.label;

  return (
    <PageShell wide>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin" className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            ← Console
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {request.code} · {request.contact_name || "Customer"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {request.categories?.join(", ")} · {request.sector}
          </p>
        </div>
        <StatusPill status={request.status} />
      </div>

      <Panel className="mt-4 overflow-x-auto">
        <div className="min-w-[540px]">
          <StatusTimeline status={request.status} />
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-5">
          <h2 className="text-sm font-semibold">Seller & location</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Info label="Contact" value={request.contact_name || "—"} />
            <Info label="Phone" value={request.contact_phone || "—"} />
            <Info label="Sector" value={request.sector} />
            <Info label="Address" value={request.address || "—"} />
            <Info label="Preferred date" value={request.preferred_date ?? "—"} />
            <Info label="Slot" value={slot ?? request.preferred_slot} />
            <Info label="Estimated weight" value={formatKg(request.estimated_weight_kg)} />
            <Info label="Assigned" value={request.assigned_to || "Unassigned"} />
          </div>
          {request.contact_phone ? (
            <div className="mt-3 flex gap-2">
              <a
                href={`tel:${request.contact_phone}`}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground transition-transform duration-150 active:scale-95"
              >
                Call seller
              </a>
              <a
                href={`https://wa.me/${request.contact_phone.replace(/\D/g, "").replace(/^0/, "92")}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-lg bg-glass px-3 py-2 text-center text-sm font-medium text-muted-foreground ring-1 ring-border transition-transform duration-150 hover:text-foreground active:scale-95"
              >
                WhatsApp
              </a>
            </div>
          ) : null}
          {request.details ? (
            <p className="mt-3 rounded-xl bg-glass p-3 text-sm text-muted-foreground">
              {request.details}
            </p>
          ) : null}
          <div className="mt-3">
            <ScrapPhotoGrid paths={request.photos} />
          </div>
        </Panel>

        <div className="grid gap-4 lg:col-span-4">
          <Panel>
            <h2 className="text-sm font-semibold">Move the collection forward</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {upcoming ? (
                <button
                  onClick={() =>
                    update.mutate({
                      patch: { status: upcoming },
                      event: { status: upcoming, note: STATUS_LABELS[upcoming] },
                    })
                  }
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-transform duration-150 active:scale-95"
                >
                  Mark {STATUS_LABELS[upcoming].toLowerCase()}
                </button>
              ) : null}
              {request.status === "received" ? (
                <button
                  onClick={() =>
                    update.mutate({
                      patch: { status: "rejected" },
                      event: { status: "rejected", note: "Request could not be accepted." },
                    })
                  }
                  className="rounded-lg bg-destructive/20 px-3 py-2 text-sm font-medium text-destructive transition-transform duration-150 active:scale-95"
                >
                  Reject
                </button>
              ) : null}
            </div>

            <div className="mt-4 space-y-2.5">
              <Field label="Set status">
                <select
                  value={request.status}
                  onChange={(e) =>
                    update.mutate({
                      patch: { status: e.target.value },
                      event: {
                        status: e.target.value,
                        note: STATUS_LABELS[e.target.value as RequestStatus] ?? e.target.value,
                      },
                    })
                  }
                  className={inputClass}
                >
                  {[...STATUS_FLOW, "rejected"].map((step) => (
                    <option key={step} value={step}>
                      {STATUS_LABELS[step as RequestStatus]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Assign team member">
                <select
                  value={assignedTo}
                  onChange={(e) => {
                    setAssignedTo(e.target.value);
                    update.mutate({
                      patch: { assigned_to: e.target.value },
                      event: {
                        status: request.status,
                        note: e.target.value
                          ? `Assigned to ${e.target.value}.`
                          : "Assignment cleared.",
                      },
                    });
                  }}
                  className={inputClass}
                >
                  <option value="">Unassigned</option>
                  {TEAM_MEMBERS.map((member) => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Scheduled pickup">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <button
                onClick={() =>
                  update.mutate({
                    patch: {
                      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
                      status: request.status === "received" ? "scheduled" : request.status,
                    },
                    event: {
                      status: "scheduled",
                      note: scheduledAt
                        ? `Pickup scheduled for ${new Date(scheduledAt).toLocaleString("en-PK")}.`
                        : "Schedule cleared.",
                    },
                  })
                }
                className="w-full rounded-lg bg-glass px-3 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-transform duration-150 hover:text-foreground active:scale-95"
              >
                Save schedule
              </button>
            </div>
          </Panel>

          <Panel>
            <h2 className="text-sm font-semibold">Team notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              className={`${inputClass} mt-3`}
              placeholder="Gate code, parking, who to ask for…"
            />
            <button
              onClick={() => update.mutate({ patch: { admin_notes: notes } })}
              className="mt-2 w-full rounded-lg bg-glass px-3 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-transform duration-150 hover:text-foreground active:scale-95"
            >
              Save notes
            </button>
          </Panel>
        </div>

        <div className="grid gap-4 lg:col-span-3">
          <Panel>
            <h2 className="text-sm font-semibold">Weigh & price</h2>
            <div className="mt-3 space-y-2.5">
              <Field label="Actual weight (kg)">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={inputClass}
                  placeholder="17.4"
                />
              </Field>
              <Field label="Rate (Rs. / kg)">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className={inputClass}
                  placeholder="85"
                />
              </Field>
              <div className="rounded-xl bg-secondary p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Final amount
                </p>
                <p className="font-mono text-2xl font-bold text-accent">
                  {computedAmount ? formatPkr(computedAmount) : formatPkr(request.final_amount)}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  est. {formatKg(request.estimated_weight_kg)}
                </p>
              </div>
              <Field label="Amount paid (Rs.)">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                  className={inputClass}
                  placeholder={computedAmount ? String(Math.round(computedAmount)) : "0"}
                />
              </Field>
              <button
                onClick={() =>
                  update.mutate({
                    patch: {
                      actual_weight_kg: weight ? Number(weight) : null,
                      rate_per_kg: rate ? Number(rate) : null,
                      final_amount: computedAmount,
                      status: request.status === "collected" ? "weighed" : request.status,
                    },
                    event: {
                      status: "weighed",
                      note: `Weighed ${weight || "—"} kg at Rs. ${rate || "—"}/kg.`,
                    },
                  })
                }
                className="w-full rounded-lg bg-glass px-3 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-transform duration-150 hover:text-foreground active:scale-95"
              >
                Save weighing
              </button>
              <button
                onClick={() =>
                  update.mutate({
                    patch: {
                      actual_weight_kg: weight ? Number(weight) : null,
                      rate_per_kg: rate ? Number(rate) : null,
                      final_amount: computedAmount,
                      amount_paid: paid ? Number(paid) : computedAmount,
                      status: "completed",
                    },
                    event: {
                      status: "completed",
                      note: `Paid Rs. ${paid || Math.round(computedAmount ?? 0)} to the seller. Collection completed.`,
                    },
                  })
                }
                className="w-full rounded-lg bg-success px-3 py-2 text-sm font-semibold text-success-foreground transition-transform duration-150 active:scale-95"
              >
                Record payment & complete
              </button>
            </div>
          </Panel>

          <Panel>
            <h2 className="text-sm font-semibold">History</h2>
            <ul className="mt-3 space-y-2">
              {(events ?? []).map((event) => (
                <li key={event.id} className="rounded-xl bg-glass p-2.5">
                  <p className="text-xs font-medium">
                    {STATUS_LABELS[event.status as RequestStatus] ?? event.status}
                  </p>
                  {event.note ? (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{event.note}</p>
                  ) : null}
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                    {new Date(event.created_at).toLocaleString("en-PK")}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

const inputClass =
  "w-full rounded-lg bg-glass px-3 py-2.5 text-sm text-foreground ring-1 ring-border outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-glass p-2.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

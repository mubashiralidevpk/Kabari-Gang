import { STATUS_FLOW, STATUS_LABELS, STATUS_SHORT, statusIndex } from "@/lib/kabari";
import type { RequestStatus } from "@/lib/kabari";

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "completed" || status === "paid"
      ? "bg-success/20 text-success"
      : status === "rejected"
        ? "bg-destructive/20 text-destructive"
        : status === "received"
          ? "bg-warning/20 text-warning"
          : "bg-primary/20 text-accent";

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>
      {STATUS_LABELS[status as RequestStatus] ?? status}
    </span>
  );
}

export function StatusTimeline({ status }: { status: string }) {
  if (status === "rejected") {
    return (
      <div className="rounded-xl bg-destructive/15 p-4 text-sm text-destructive">
        This request was not accepted. You can submit a new one any time.
      </div>
    );
  }

  const current = Math.max(statusIndex(status), 0);

  return (
    <div className="no-scrollbar -mx-1 flex min-w-0 items-center overflow-x-auto px-1 pb-1 [&>*]:min-w-[54px] sm:mx-0 sm:overflow-visible sm:px-0 sm:[&>*]:min-w-0">
      {STATUS_FLOW.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-success text-success-foreground"
                    : active
                      ? "bg-primary text-primary-foreground ring-2 ring-accent/40"
                      : "bg-glass text-muted-foreground ring-1 ring-border"
                }`}
              >
                {done ? "✓" : index + 1}
              </div>
              <span
                className={`mt-1.5 text-center text-[10px] ${active ? "font-medium text-accent" : "text-muted-foreground"}`}
              >
                {STATUS_SHORT[step]}
              </span>
            </div>
            {index < STATUS_FLOW.length - 1 ? (
              <div
                className={`mx-1 mb-5 h-0.5 flex-1 ${
                  index < current ? "bg-success" : active ? "bg-primary" : "bg-border"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

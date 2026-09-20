import { createFileRoute, Link } from "@tanstack/react-router";

import heroImage from "@/assets/scrap-hero.jpg";
import { PageShell, Panel } from "@/components/kabari/shell";
import { SCRAP_CATEGORIES, STATUS_FLOW, STATUS_SHORT } from "@/lib/kabari";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kabari Gang — Sell your scrap in Islamabad" },
      {
        name: "description",
        content:
          "List iron, copper, plastic, paper, electronics or appliances and book a pickup. Kabari Gang collects, weighs and pays you on the spot across Islamabad.",
      },
      { property: "og:title", content: "Kabari Gang — Sell your scrap in Islamabad" },
      {
        property: "og:description",
        content: "Book a scrap pickup in Islamabad. We collect, weigh and pay on the spot.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  { title: "List your scrap", body: "Pick categories, add photos and an approximate weight." },
  { title: "We accept it", body: "The Kabari Gang team reviews and confirms your request." },
  { title: "Pickup at your gate", body: "Our team arrives in your sector at the chosen slot." },
  { title: "Weighed and paid", body: "Actual weight, rate per kg and cash handed over." },
];

function Landing() {
  return (
    <PageShell>
      <div className="mt-10 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Islamabad · scrap pickup
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] text-balance sm:text-5xl">
            Stop hunting for a kabari. We come to your gate.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            List whatever scrap you want gone — iron grills, copper wire, cartons, an old fridge —
            and request a pickup. Kabari Gang handles collection, weighing, pricing and payment
            itself. No middlemen, no phone calls to random collectors.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/sell"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-150 active:scale-95"
            >
              Request a pickup
            </Link>
            <Link
              to="/requests"
              className="rounded-lg bg-glass px-4 py-2.5 text-sm font-medium text-muted-foreground ring-1 ring-border transition-transform duration-150 hover:text-foreground active:scale-95"
            >
              Track my pickups
            </Link>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-border pt-5">
            <div>
              <p className="font-mono text-2xl font-bold text-accent">20+</p>
              <p className="text-xs text-muted-foreground">sectors covered</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-accent">12</p>
              <p className="text-xs text-muted-foreground">scrap categories</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-accent">Cash</p>
              <p className="text-xs text-muted-foreground">paid on the spot</p>
            </div>
          </div>
        </Panel>

        <Panel className="overflow-hidden p-0 lg:col-span-5">
          <img
            src={heroImage}
            alt="Sorted scrap metal, cardboard and appliances in an Islamabad courtyard"
            width={1536}
            height={1024}
            className="size-full object-cover"
          />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7">
          <h2 className="text-sm font-semibold">How a pickup works</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-xl bg-glass p-3.5">
                <span className="grid size-7 place-items-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="mt-2.5 text-sm font-medium">{step.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status you can follow
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {STATUS_FLOW.map((step) => (
                <span
                  key={step}
                  className="rounded-full bg-glass px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
                >
                  {STATUS_SHORT[step]}
                </span>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="lg:col-span-5">
          <h2 className="text-sm font-semibold">What we buy</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {SCRAP_CATEGORIES.map((category) => (
              <span
                key={category}
                className="rounded-xl bg-glass px-3 py-2 text-sm font-medium ring-1 ring-border"
              >
                {category}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-secondary p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Honest weighing</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="font-mono text-3xl font-bold leading-none text-accent">17.4</span>
              <span className="pb-1 text-sm text-muted-foreground">kg</span>
              <span className="ml-auto pb-1 font-mono text-xs text-muted-foreground">
                est. 20 kg
              </span>
            </div>
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Your estimate stays separate from the final weight. You see the actual weight, the
              rate per kg and the amount paid.
            </p>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}

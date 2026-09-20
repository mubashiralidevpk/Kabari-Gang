import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageShell, Panel } from "@/components/kabari/shell";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useProfile } from "@/lib/auth-hooks";
import { ISLAMABAD_SECTORS, PICKUP_SLOTS, SCRAP_CATEGORIES } from "@/lib/kabari";

export const Route = createFileRoute("/_authenticated/sell")({
  head: () => ({
    meta: [
      { title: "List your scrap — Kabari Gang" },
      {
        name: "description",
        content:
          "Pick your scrap categories, add photos and an estimated weight, then request a pickup anywhere in Islamabad.",
      },
      { property: "og:title", content: "List your scrap — Kabari Gang" },
      {
        property: "og:description",
        content: "Request a scrap pickup in Islamabad in under a minute.",
      },
    ],
  }),
  component: SellPage,
});

const schema = z.object({
  categories: z.array(z.string()).min(1, "Pick at least one scrap category"),
  estimatedWeight: z
    .number({ message: "Enter an estimated weight in kg" })
    .positive("Weight must be more than 0")
    .max(100000, "That weight looks too large"),
  details: z.string().trim().max(1000, "Please keep details under 1000 characters"),
  sector: z.string().trim().min(1, "Select your sector"),
  address: z.string().trim().min(4, "Enter your house / street address").max(300),
  contactName: z.string().trim().min(2, "Enter a contact name").max(80),
  contactPhone: z.string().trim().min(10, "Enter a valid phone number").max(20),
  preferredDate: z.string().trim().min(1, "Pick a preferred date"),
  preferredSlot: z.string().trim().min(1),
});

function SellPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile();
  const fileInput = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [estimatedWeight, setEstimatedWeight] = useState("");
  const [details, setDetails] = useState("");
  const [sector, setSector] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().slice(0, 10));
  const [preferredSlot, setPreferredSlot] = useState("morning");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const nameValue = contactName || profile?.full_name || "";
  const phoneValue = contactPhone || profile?.phone || "";

  function toggleCategory(category: string) {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).filter((file) => file.size <= 10 * 1024 * 1024);
    if (picked.length !== list.length) toast.error("Photos must be under 10 MB each");
    setFiles((current) => [...current, ...picked].slice(0, 6));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;

    const parsed = schema.safeParse({
      categories,
      estimatedWeight: Number(estimatedWeight),
      details,
      sector,
      address,
      contactName: nameValue,
      contactPhone: phoneValue,
      preferredDate,
      preferredSlot,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setBusy(true);
    try {
      const paths: string[] = [];
      for (const file of files) {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("scrap-photos").upload(path, file);
        if (error) {
          toast.error("A photo could not be uploaded");
          return;
        }
        paths.push(path);
      }

      const { data, error } = await supabase
        .from("pickup_requests")
        .insert({
          customer_id: user.id,
          categories: parsed.data.categories,
          photos: paths,
          estimated_weight_kg: parsed.data.estimatedWeight,
          details: parsed.data.details,
          sector: parsed.data.sector,
          address: parsed.data.address,
          contact_name: parsed.data.contactName,
          contact_phone: parsed.data.contactPhone,
          preferred_date: parsed.data.preferredDate,
          preferred_slot: parsed.data.preferredSlot,
          status: "received",
        })
        .select("id")
        .single();

      if (error || !data) {
        toast.error("Could not submit your request. Please try again.");
        return;
      }

      await supabase.from("request_events").insert({
        request_id: data.id,
        status: "received",
        note: "Request received by Kabari Gang.",
      });

      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      toast.success("Pickup requested. We'll confirm shortly.");
      navigate({ to: "/requests/$id", params: { id: data.id } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <div className="mt-8">
        <h1 className="text-2xl font-semibold">Request a pickup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us what you have. Our team confirms, collects, weighs and pays you.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-5 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7">
          <h2 className="text-sm font-semibold">What are you selling?</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {SCRAP_CATEGORIES.map((category) => {
              const active = categories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition-transform duration-150 active:scale-95 ${
                    active
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-glass text-muted-foreground ring-border hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Estimated weight (kg)">
              <input
                type="number"
                min="0"
                step="0.1"
                value={estimatedWeight}
                onChange={(e) => setEstimatedWeight(e.target.value)}
                className={inputClass}
                placeholder="20"
              />
            </Field>
            <Field label="Preferred date">
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Additional details">
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
                rows={3}
                className={inputClass}
                placeholder="Old window grills, a broken fridge and some cartons in the store room."
              />
            </Field>
          </div>

          <div className="mt-4">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Photos (up to 6)
            </span>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-xl">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                    className="absolute right-1 top-1 rounded-md bg-background/80 px-1.5 text-xs font-bold text-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
              {files.length < 6 ? (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="grid aspect-square place-items-center rounded-xl bg-glass text-xs font-medium text-muted-foreground ring-1 ring-border transition-transform duration-150 active:scale-95"
                >
                  + Add
                </button>
              ) : null}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
          </div>
        </Panel>

        <Panel className="lg:col-span-5">
          <h2 className="text-sm font-semibold">Pickup details</h2>
          <div className="mt-3 space-y-3">
            <Field label="Sector / area">
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className={inputClass}
              >
                <option value="">Select your area</option>
                {ISLAMABAD_SECTORS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Address">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={300}
                className={inputClass}
                placeholder="House 44, Street 12"
              />
            </Field>
            <Field label="Time slot">
              <select
                value={preferredSlot}
                onChange={(e) => setPreferredSlot(e.target.value)}
                className={inputClass}
              >
                {PICKUP_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Contact name">
              <input
                value={nameValue}
                onChange={(e) => setContactName(e.target.value)}
                maxLength={80}
                className={inputClass}
                placeholder="Your name"
              />
            </Field>
            <Field label="Contact phone">
              <input
                value={phoneValue}
                onChange={(e) => setContactPhone(e.target.value)}
                maxLength={20}
                className={inputClass}
                placeholder="0300-1234567"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-150 active:scale-95 disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit pickup request"}
          </button>
          <p className="mt-2.5 text-xs text-muted-foreground">
            Your weight is only an estimate. The final amount is based on the weight recorded at
            pickup.
          </p>
        </Panel>
      </form>
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

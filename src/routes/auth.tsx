import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Backdrop, Brand } from "@/components/kabari/shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search["mode"] === "signup" ? ("signup" as const) : ("signin" as const),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Kabari Gang" },
      {
        name: "description",
        content: "Create your Kabari Gang account to list scrap and book a pickup in Islamabad.",
      },
      { property: "og:title", content: "Sign in — Kabari Gang" },
      { property: "og:description", content: "Create an account to book a scrap pickup." },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid phone number")
    .max(20, "Phone number is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Use at least 6 characters").max(72),
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Enter your password").max(72),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      if (isSignUp) {
        const parsed = signUpSchema.safeParse({ fullName, phone, email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (!data.session) {
          setNotice(
            "Account created. Check your email and click the confirmation link, then sign in here.",
          );
          setIsSignUp(false);
          return;
        }
        toast.success("Welcome to Kabari Gang");
        navigate({ to: "/sell" });
      } else {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Signed in");
        navigate({ to: "/requests" });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10">
      <Backdrop />
      <div className="relative w-full max-w-md">
        <Brand />
        <div className="glass-panel mt-6 rounded-2xl p-6">
          <h1 className="text-xl font-semibold">{isSignUp ? "Create your account" : "Sign in"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp
              ? "One account to list scrap and follow every pickup."
              : "Welcome back. Pick up where you left off."}
          </p>

          {notice ? (
            <p className="mt-4 rounded-xl bg-warning/15 p-3 text-sm text-warning">{notice}</p>
          ) : null}

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            {isSignUp ? (
              <>
                <Field label="Full name">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={80}
                    className={inputClass}
                    placeholder="Sana Qureshi"
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={20}
                    className={inputClass}
                    placeholder="0300-1234567"
                  />
                </Field>
              </>
            ) : null}
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className={inputClass}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={72}
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-150 active:scale-95 disabled:opacity-60"
            >
              {busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          <button
            onClick={() => {
              setIsSignUp((value) => !value);
              setNotice(null);
            }}
            className="mt-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
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

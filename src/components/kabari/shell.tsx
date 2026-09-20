import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useIsTeam, useProfile } from "@/lib/auth-hooks";

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-24 size-[420px] rounded-full bg-foreground/10 blur-3xl" />
      <div className="absolute top-24 right-0 size-[360px] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-[380px] rounded-full bg-earthy/25 blur-3xl" />
    </div>
  );
}

export function Brand() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary font-mono text-base font-bold text-primary-foreground ring-1 ring-border sm:size-11 sm:text-lg">
        KG
      </span>
      <span className="block min-w-0">
        <span className="block truncate text-base font-semibold leading-tight sm:text-lg">
          Kabari Gang
        </span>
        <span className="block truncate text-[11px] text-muted-foreground sm:text-xs">
          Scrap collection · Islamabad
        </span>
      </span>
    </Link>
  );
}

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name ?? "").trim() || (email ?? "").trim();
  if (!source) return "KG";
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "KG";
}

export function AppHeader() {
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile();
  const { isTeam } = useIsTeam();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }

  return (
    <header className="flex items-center justify-between gap-3">
      <Brand />
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        {user ? (
          <>
            <nav className="hidden items-center gap-1 text-sm md:flex">
              <HeaderLink to="/sell">Sell scrap</HeaderLink>
              <HeaderLink to="/requests">My pickups</HeaderLink>
              {isTeam ? <HeaderLink to="/admin">Console</HeaderLink> : null}
            </nav>
            <button
              onClick={signOut}
              className="rounded-lg bg-glass px-3 py-2 text-xs font-medium text-muted-foreground ring-1 ring-border transition-transform duration-150 hover:text-foreground active:scale-95 sm:text-sm"
            >
              Sign out
            </button>
            <span className="grid size-9 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              {initials(profile?.full_name, user.email)}
            </span>
          </>
        ) : (
          <>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="rounded-lg bg-glass px-3 py-2 text-xs font-medium text-muted-foreground ring-1 ring-border transition-transform duration-150 hover:text-foreground active:scale-95 sm:text-sm"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform duration-150 active:scale-95 sm:text-sm"
            >
              Create account
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

function HeaderLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
      activeProps={{ className: "text-foreground bg-glass" }}
    >
      {children}
    </Link>
  );
}

export function PageShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Backdrop />
      <div
        className={`safe-top relative mx-auto px-4 pb-28 pt-6 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8 ${wide ? "max-w-7xl" : "max-w-6xl"}`}
      >
        <AppHeader />
        {children}
        <footer className="mt-8 flex flex-col items-center justify-between gap-1 text-center text-xs text-muted-foreground/70 sm:flex-row sm:text-left">
          <span>Kabari Gang · single-operator collection, no marketplace</span>
          <span className="font-mono">Islamabad · PKR</span>
        </footer>
      </div>
      <MobileNav />
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`glass-panel rounded-2xl p-5 ${className}`}>{children}</section>;
}

function MobileNav() {
  const { data: user } = useCurrentUser();
  const { isTeam } = useIsTeam();
  if (!user) return null;

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
        <TabLink to="/sell" label="Sell" />
        <TabLink to="/requests" label="My pickups" />
        {isTeam ? <TabLink to="/admin" label="Console" /> : null}
      </div>
    </nav>
  );
}

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex min-h-11 flex-1 items-center justify-center rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors"
      activeProps={{ className: "text-accent bg-glass" }}
    >
      {label}
    </Link>
  );
}

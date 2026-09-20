import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
  });
}

export function useRoles() {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useQuery({
    queryKey: ["roles", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((row) => row.role as string);
    },
  });
}

export function useIsTeam() {
  const { data: roles, isLoading } = useRoles();
  return {
    isTeam: Boolean(roles?.some((role) => role === "admin" || role === "staff")),
    isLoading,
  };
}

export function useProfile() {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

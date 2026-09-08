import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/flags";

export const sessionQueryKey = ["session"] as const;

export function useSession() {
  const queryClient = useQueryClient();
  const supabase = getSupabase();

  const query = useQuery({
    queryKey: sessionQueryKey,
    queryFn: async (): Promise<Session | null> => {
      if (!supabase) return null;
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    enabled: isSupabaseConfigured(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(sessionQueryKey, session);
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [queryClient, supabase]);

  return query;
}

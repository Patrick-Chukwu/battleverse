import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { isServerProfileEnabled } from "@/lib/flags";
import type { ProfileRow, ProfileUpdate } from "@/lib/database.types";
import { useSession } from "@/hooks/useSession";

export function profileQueryKey(userId: string | undefined) {
  return ["profile", userId] as const;
}

export async function fetchOwnProfile(): Promise<ProfileRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getUser();
  const userId = sessionData.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export function useProfile() {
  const { data: session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: fetchOwnProfile,
    enabled: Boolean(userId) && isServerProfileEnabled(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (patch: ProfileUpdate) => {
      const supabase = getSupabase();
      if (!supabase || !userId) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", userId)
        .select("*")
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
    onSuccess: (row) => {
      queryClient.setQueryData(profileQueryKey(userId), row);
    },
  });
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

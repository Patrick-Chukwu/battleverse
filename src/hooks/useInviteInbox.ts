import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { isInvitesEnabled } from "@/lib/flags";
import { rpcListMyInvites } from "@/lib/invite-api";
import { dropChannel, subscribePostgresChanges } from "@/lib/realtime";
import { useSession } from "@/hooks/useSession";

export function inviteInboxKey(userId: string | undefined) {
  return ["invites", userId] as const;
}

const inboxConsumers = new Map<string, { count: number; channel: RealtimeChannel | null }>();

function retainInviteChannel(userId: string, refresh: () => void) {
  const existing = inboxConsumers.get(userId);
  if (existing) {
    existing.count += 1;
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;

  const channel = subscribePostgresChanges(supabase, `invites:${userId}`, [
    {
      event: "*",
      table: "invites",
      filter: `to_id=eq.${userId}`,
      handler: refresh,
    },
    {
      event: "*",
      table: "invites",
      filter: `from_id=eq.${userId}`,
      handler: refresh,
    },
  ]);

  inboxConsumers.set(userId, { count: 1, channel });
}

function releaseInviteChannel(userId: string) {
  const existing = inboxConsumers.get(userId);
  if (!existing) return;
  existing.count -= 1;
  if (existing.count > 0) return;
  dropChannel(getSupabase(), existing.channel);
  inboxConsumers.delete(userId);
}

export function useInviteInbox() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const enabled = Boolean(userId) && isInvitesEnabled();
  const refreshRef = useRef<() => void>(() => {});
  refreshRef.current = () => {
    void queryClient.invalidateQueries({ queryKey: inviteInboxKey(userId) });
  };

  const query = useQuery({
    queryKey: inviteInboxKey(userId),
    queryFn: rpcListMyInvites,
    enabled,
    refetchInterval: enabled ? 8000 : false,
  });

  useEffect(() => {
    if (!enabled || !userId) return;
    retainInviteChannel(userId, () => refreshRef.current());
    return () => {
      releaseInviteChannel(userId);
    };
  }, [enabled, userId]);

  const incoming = query.data?.incoming ?? [];
  const outgoing = query.data?.outgoing ?? [];
  const pendingIncoming = incoming.filter((row) => row.status === "pending");
  const pendingOutgoing = outgoing.filter((row) => row.status === "pending");

  return {
    ...query,
    incoming,
    outgoing,
    pendingIncoming,
    pendingOutgoing,
    pendingCount: pendingIncoming.length,
  };
}

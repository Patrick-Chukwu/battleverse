import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

export type PostgresBinding = {
  event: "*" | "INSERT" | "UPDATE" | "DELETE";
  table: string;
  filter?: string;
  schema?: string;
  handler: () => void;
};

/**
 * Open a fresh Realtime channel. Never reuse a subscribed topic — adding
 * postgres_changes after subscribe() throws and used to blank the app.
 */
export function subscribePostgresChanges(
  supabase: SupabaseClient,
  name: string,
  bindings: PostgresBinding[]
): RealtimeChannel | null {
  try {
    const topic = `${name}:${crypto.randomUUID().slice(0, 8)}`;
    let channel = supabase.channel(topic);
    for (const binding of bindings) {
      channel = channel.on(
        "postgres_changes",
        {
          event: binding.event,
          schema: binding.schema ?? "public",
          table: binding.table,
          filter: binding.filter,
        },
        () => {
          binding.handler();
        }
      );
    }
    channel.subscribe();
    return channel;
  } catch (err) {
    console.warn("Realtime subscribe skipped", err);
    return null;
  }
}

export function dropChannel(supabase: SupabaseClient | null, channel: RealtimeChannel | null) {
  if (!supabase || !channel) return;
  void supabase.removeChannel(channel);
}

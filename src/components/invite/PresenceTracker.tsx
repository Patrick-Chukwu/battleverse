import { useEffect } from "react";
import { isInvitesEnabled } from "@/lib/flags";
import { rpcHeartbeatPresence, type PresenceStatus } from "@/lib/invite-api";
import { useSession } from "@/hooks/useSession";
import { useBattleStore } from "@/store/useBattleStore";

export function PresenceTracker() {
  const { data: session } = useSession();
  const inBattle = useBattleStore((s) => s.isPlaying && s.isLive && !s.isFinished);

  useEffect(() => {
    if (!isInvitesEnabled() || !session) return;

    let disposed = false;

    const beat = (status: PresenceStatus) => {
      if (disposed) return;
      void rpcHeartbeatPresence(status).catch(() => undefined);
    };

    const current = (): PresenceStatus => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return "idle";
      if (inBattle) return "in_battle";
      return "online";
    };

    beat(current());
    const id = window.setInterval(() => beat(current()), 15_000);

    const onVis = () => beat(current());
    const onOnline = () => beat(current());
    const onHide = () => beat("offline");

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    window.addEventListener("pagehide", onHide);

    return () => {
      disposed = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pagehide", onHide);
      void rpcHeartbeatPresence("offline").catch(() => undefined);
    };
  }, [inBattle, session]);

  return null;
}

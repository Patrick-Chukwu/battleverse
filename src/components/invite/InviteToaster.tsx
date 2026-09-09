import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { subjects } from "@/data/quizData";
import { isInvitesEnabled } from "@/lib/flags";
import { rpcAcceptInvite, rpcDeclineInvite, type InviteDto } from "@/lib/invite-api";
import { useInviteInbox } from "@/hooks/useInviteInbox";
import { useBattleStore } from "@/store/useBattleStore";

function subjectName(id: string) {
  return subjects.find((s) => s.id === id)?.name ?? id;
}

export function InviteToaster() {
  const navigate = useNavigate();
  const joinBattle = useBattleStore((s) => s.joinBattle);
  const { pendingIncoming, isSuccess } = useInviteInbox();
  const seen = useRef(new Set<string>());
  const primed = useRef(false);

  useEffect(() => {
    if (!isInvitesEnabled() || !isSuccess) return;

    if (!primed.current) {
      for (const row of pendingIncoming) seen.current.add(row.id);
      primed.current = true;
      for (const row of pendingIncoming) showInviteToast(row, joinBattle, navigate);
      return;
    }

    for (const row of pendingIncoming) {
      if (seen.current.has(row.id)) continue;
      seen.current.add(row.id);
      showInviteToast(row, joinBattle, navigate);
    }
  }, [isSuccess, joinBattle, navigate, pendingIncoming]);

  return null;
}

function showInviteToast(
  row: InviteDto,
  joinBattle: (battleId: string) => void,
  navigate: ReturnType<typeof useNavigate>
) {
  const from = row.from_username ?? "A rival";
  toast(`${from} challenged you in ${subjectName(row.subject_id)} (${row.age_band})`, {
    id: `invite-${row.id}`,
    duration: Infinity,
    action: {
      label: "Accept",
      onClick: () => {
        void (async () => {
          try {
            const accepted = await rpcAcceptInvite(row.id);
            if (accepted.battle_id) {
              joinBattle(accepted.battle_id);
              navigate("/battle");
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : "Could not accept.";
            toast.error(message);
          }
        })();
      },
    },
    cancel: {
      label: "Decline",
      onClick: () => {
        void rpcDeclineInvite(row.id).catch(() => undefined);
      },
    },
  });
}

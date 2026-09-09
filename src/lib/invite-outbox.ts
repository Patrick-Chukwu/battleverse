import type { Subject } from "@/data/quizData";
import type { AgeBand } from "@/lib/database.types";
import { enqueueOutbox } from "@/lib/practice-sync";

export async function enqueueInviteSend(toId: string, subject: Subject, ageBand: AgeBand): Promise<string> {
  const id = crypto.randomUUID();
  await enqueueOutbox({
    id,
    type: "invite_send",
    payload: { to_id: toId, subject_id: subject, age_band: ageBand },
  });
  return id;
}

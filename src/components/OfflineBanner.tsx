import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { isDexieQuestionsEnabled } from "@/lib/flags";
import { pendingOutboxCount, syncPractice } from "@/lib/practice-sync";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);
  const enabled = isDexieQuestionsEnabled();

  useEffect(() => {
    if (!enabled) return;
    void pendingOutboxCount().then(setPending);
    const id = window.setInterval(() => {
      void pendingOutboxCount().then(setPending);
    }, 4000);
    return () => window.clearInterval(id);
  }, [enabled, online]);

  if (!enabled) return null;
  if (online && pending === 0) return null;

  const retry = async () => {
    setBusy(true);
    await syncPractice();
    setPending(await pendingOutboxCount());
    setBusy(false);
  };

  return (
    <div className="fixed top-[66px] right-0 left-0 z-40 border-b border-border bg-card/95 px-4 py-2 text-center text-sm font-bold shadow-sm backdrop-blur">
      {!online ? (
        <span>You are offline. Practice still works with saved questions. Challenges need a connection or will queue.</span>
      ) : (
        <span>
          {pending} result{pending === 1 ? "" : "s"} waiting to sync.{" "}
          <button
            type="button"
            onClick={() => void retry()}
            disabled={busy}
            className="font-black text-primary underline disabled:opacity-50"
          >
            {busy ? "Syncing…" : "Retry sync"}
          </button>
        </span>
      )}
    </div>
  );
}

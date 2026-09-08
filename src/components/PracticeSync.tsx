import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isDexieQuestionsEnabled } from "@/lib/flags";
import { syncPractice } from "@/lib/practice-sync";

export function PracticeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isDexieQuestionsEnabled()) return;

    const run = () => {
      void syncPractice().then(() => {
        void queryClient.invalidateQueries({ queryKey: ["profile"] });
      });
    };

    run();
    window.addEventListener("online", run);
    const onVis = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [queryClient]);

  return null;
}

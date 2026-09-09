export type ExamTypeId = "casual" | "jamb" | "waec" | "custom";

export const EXAM_TYPE_LABELS: Record<ExamTypeId, string> = {
  casual: "Casual",
  jamb: "JAMB",
  waec: "WAEC",
  custom: "Custom",
};

export function examLabel(id: string): string {
  return EXAM_TYPE_LABELS[id as ExamTypeId] ?? id.toUpperCase();
}

/** Exam papers award a flat 10 XP per correct (no leftover-paper-time bonus). */
export function examXp(isCorrect: boolean): number {
  return isCorrect ? 10 : 0;
}

export function examPercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export function examPassed(correct: number, total: number, passMarkPct: number | null | undefined): boolean {
  return examPercent(correct, total) >= (passMarkPct ?? 50);
}

export function formatPaperClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

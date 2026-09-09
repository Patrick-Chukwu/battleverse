/** Battle XP: 100 + ceil(secondsLeft * 10) when correct. */
export function battleXp(secondsLeft: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  return 100 + Math.ceil(Math.max(0, secondsLeft) * 10);
}

/** Display timer from the server clock (seconds remaining in the answer window). */
export function battleTimerRemaining(
  startedAtIso: string,
  durationMs: number,
  serverNowMs: number
): number {
  const started = Date.parse(startedAtIso);
  if (Number.isNaN(started)) return durationMs / 1000;
  return Math.max(0, (started + durationMs - serverNowMs) / 1000);
}

export function battleReconnectSeconds(lastSeenAtIso: string, serverNowMs: number, windowMs = 20_000): number {
  const last = Date.parse(lastSeenAtIso);
  if (Number.isNaN(last)) return 0;
  return Math.max(0, Math.ceil((last + windowMs - serverNowMs) / 1000));
}

export function isBattleFinishedStatus(status: string): boolean {
  return status === "complete" || status === "forfeit";
}

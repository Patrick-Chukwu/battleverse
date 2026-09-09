/** Practice XP: 10 + floor(timeLeft * 2) when correct. */
export function practiceXp(timeLeft: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  return 10 + Math.floor(Math.max(0, timeLeft) * 2);
}

export function practiceLevel(xp: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000];
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

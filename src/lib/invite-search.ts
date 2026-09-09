import type { AgeBand } from "@/lib/database.types";

export type SearchKind = "username" | "email" | "phone";

export function normalizePhoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

export function isUnder13AgeBand(band: AgeBand | null | undefined): boolean {
  return band === "6-8" || band === "9-12";
}

export function classifySearchQuery(raw: string): { kind: SearchKind; query: string } {
  const q = raw.trim();
  if (q.includes("@")) return { kind: "email", query: q.toLowerCase() };
  const digits = normalizePhoneDigits(q);
  if (digits.length >= 7 && /^[\d+\s().-]+$/.test(q)) {
    return { kind: "phone", query: digits };
  }
  return { kind: "username", query: q };
}

export function inviteSecondsLeft(expiresAt: string, nowMs = Date.now()): number {
  const ends = Date.parse(expiresAt);
  if (Number.isNaN(ends)) return 0;
  return Math.max(0, Math.ceil((ends - nowMs) / 1000));
}

export function inviteSharePath(code: string): string {
  return `/battle?code=${encodeURIComponent(code)}`;
}

export function inviteShareUrl(code: string, origin = typeof window === "undefined" ? "" : window.location.origin): string {
  return `${origin}${inviteSharePath(code)}`;
}

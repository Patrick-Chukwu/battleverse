const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function isValidUsername(value: string): boolean {
  return USERNAME_RE.test(value);
}

export function normalizeUsername(value: string): string {
  return value.trim();
}

export function usernameError(value: string): string | null {
  const v = normalizeUsername(value);
  if (v.length < 3) return "Username must be at least 3 characters.";
  if (v.length > 20) return "Username must be at most 20 characters.";
  if (!USERNAME_RE.test(v)) return "Use letters, numbers, and underscores only.";
  return null;
}

export function isGeneratedUsername(username: string): boolean {
  return /^[a-z0-9]+[a-f0-9]{6}$/i.test(username) && username.length >= 9;
}

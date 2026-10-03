type Entry = { count: number; resetAt: number };
const memory = new Map<string, Entry>();

export function rateLimit(key: string, max = 20, windowMs = 60_000) {
  const now = Date.now();
  const current = memory.get(key);
  if (!current || current.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  current.count += 1;
  if (current.count > max) return { ok: false, remaining: 0 };
  return { ok: true, remaining: max - current.count };
}

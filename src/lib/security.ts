const memoryRateLimit = new Map<string, { count: number; resetAt: number }>();

export function cleanText(value: unknown, maxLength = 700) {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(key: string, limit = 15, windowMs = 60_000) {
  const now = Date.now();
  const current = memoryRateLimit.get(key);
  if (!current || current.resetAt < now) {
    memoryRateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (current.count >= limit) return { ok: false };
  current.count += 1;
  memoryRateLimit.set(key, current);
  return { ok: true };
}

export function safeJsonError(message = "Something went wrong.", status = 400) {
  return Response.json({ error: message }, { status });
}

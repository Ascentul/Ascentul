/**
 * Resolve the Redis distributed lock TTL from configuration, enforcing a positive integer.
 * Falls back to 60 seconds if the environment variable is missing or invalid.
 * Caps values at 600 seconds (10 minutes) to prevent excessively long locks.
 */
const DEFAULT_REDIS_LOCK_TTL = 60;
const MAX_REDIS_LOCK_TTL = 600; // 10 minutes

export function getRedisLockTTL(): number {
  const rawValue = process.env.REDIS_LOCK_TTL ?? String(DEFAULT_REDIS_LOCK_TTL);
  const parsed = parseInt(rawValue, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    console.warn(
      `[Redis] Invalid REDIS_LOCK_TTL value "${rawValue}". Falling back to default TTL of 60 seconds.`
    );
    return DEFAULT_REDIS_LOCK_TTL;
  }

  if (parsed > MAX_REDIS_LOCK_TTL) {
    console.warn(
      `[Redis] REDIS_LOCK_TTL value "${parsed}" exceeds maximum of ${MAX_REDIS_LOCK_TTL} seconds. ` +
      `Capping to ${MAX_REDIS_LOCK_TTL} seconds.`
    );
    return MAX_REDIS_LOCK_TTL;
  }

  return parsed;
}

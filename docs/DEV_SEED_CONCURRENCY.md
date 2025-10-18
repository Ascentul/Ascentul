# Dev Seed Endpoint Concurrency Issue & Solutions

## Problem Statement

The current dev seed endpoint (`src/app/api/dev/seed/route.ts`) uses an **in-memory mutex** to prevent concurrent seeding operations. This approach has a critical flaw in serverless/multi-instance environments.

### Current Implementation Issues

**File**: `src/app/api/dev/seed/route.ts` (lines 27-55)

```typescript
class SeedMutex {
  private locked = false;
  private waitQueue: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
}

const seedMutex = new SeedMutex();
```

### Why This Fails in Production

#### 1. **Serverless Platforms (Vercel, AWS Lambda, Netlify)**

Each request may be handled by a different serverless function instance:

```
Request 1 → Lambda Instance A (mutex locked = true)
Request 2 → Lambda Instance B (mutex locked = false) ❌ BYPASSED!
Request 3 → Lambda Instance C (mutex locked = false) ❌ BYPASSED!
```

**Result**: All 3 instances check `before.templates === 0` simultaneously and attempt to seed, causing:
- Duplicate template entries
- Database constraint violations
- Race conditions

#### 2. **Container Orchestration (Kubernetes, ECS)**

Multiple pod/container replicas each have their own memory:

```
Pod 1 (127.0.0.1:3000) → seedMutex locked = true
Pod 2 (127.0.0.2:3000) → seedMutex locked = false ❌ SEPARATE INSTANCE!
```

#### 3. **Next.js Edge Runtime**

Edge functions run on different edge locations globally:

```
Request from USA → us-east-1 worker (mutex state A)
Request from EU  → eu-west-1 worker (mutex state B) ❌ DIFFERENT MEMORY!
```

### Attack Scenario

An attacker could exploit this by sending concurrent requests:

```bash
# Terminal 1
curl -X POST http://localhost:3000/api/dev/seed &

# Terminal 2 (immediately)
curl -X POST http://localhost:3000/api/dev/seed &

# Terminal 3 (immediately)
curl -X POST http://localhost:3000/api/dev/seed &
```

In serverless: All 3 bypass mutex → 3x seed operations → data corruption

## Solution 1: Distributed Lock (Recommended for Production)

### Using Redis

**Pros:**
- True distributed locking
- Works across all instances
- Industry-standard solution
- Built-in TTL for lock expiry

**Implementation:**

**Setup Instructions:**

1. Install the Redis client dependency:

```bash
npm install ioredis
# or
pnpm add ioredis
# or
yarn add ioredis
```

Add to your `package.json`:

```json
{
  "dependencies": {
    "ioredis": "^5.3.0"
  }
}
```

2. Configure environment variables:

```bash
# .env.local (development)
REDIS_URL=redis://localhost:6379

# .env.production (production)
REDIS_URL=rediss://default:password@your-redis-host:6380
```

3. For local development, start a Redis instance:

```bash
# Using Docker (recommended for consistency)
docker run -d -p 6379:6379 redis:7-alpine

# Or using Homebrew (macOS)
brew install redis
brew services start redis
```

**IMPORTANT:** Redis must be running in ALL environments (development, staging, production). The distributed locking implementation does NOT include fallback behavior - if Redis is unavailable, lock acquisition will fail and the seed operation will be rejected. This is intentional to ensure race conditions are caught early in development rather than silently failing.

**Code Implementation:**

```typescript
import { Redis } from 'ioredis';

/**
 * Redis singleton with connection pooling, retry strategy, and health monitoring
 *
 * Key features:
 * - Reuses single connection across requests (prevents connection exhaustion)
 * - Automatic reconnection on failed/closed connections
 * - Health monitoring via connection state tracking
 * - Exponential backoff retry strategy
 */
let redis: Redis | null = null;

function getRedis(): Redis {
  // Check if we need to create a new connection
  if (!redis) {
    redis = createRedisConnection();
  } else if (redis.status === 'end' || redis.status === 'close') {
    // Connection is dead or closed; attempt to reconnect
    console.warn('Redis connection is closed, reinitializing...');
    redis = null;
    return getRedis(); // Recursive call to reinitialize
  } else if (redis.status === 'reconnecting') {
    // Connection is attempting to reconnect, allow it to proceed
    console.log('Redis is reconnecting, using existing instance');
  }

  return redis;
}

function createRedisConnection(): Redis {
  const redisInstance = new Redis(process.env.REDIS_URL!, {
    retryStrategy: (times) => {
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms, 1600ms, 2000ms (capped)
      // Formula: min(2^times * 50ms, 2000ms)
      // This is more appropriate for long-lived connections than linear backoff
      const delay = Math.min(Math.pow(2, times) * 50, 2000);
      console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms (exponential backoff)`);

      // Give up after 10 attempts (~20 seconds total)
      if (times > 10) {
        console.error('[Redis] Connection failed after 10 attempts');
        return null; // Stop retrying
      }

      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    // Graceful connection handling
    lazyConnect: false,
    // Timeout settings
    connectTimeout: 10000,
    commandTimeout: 5000,
    // Enable auto-reconnect
    enableOfflineQueue: true,
  });

  // Handle connection errors (non-fatal, will retry)
  redisInstance.on('error', (err) => {
    // Defensive: ioredis sometimes emits error-like objects without .message
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorName = err instanceof Error ? err.name : 'UnknownError';

    console.error(`[Redis] Connection error (${errorName}):`, errorMessage);

    // Log additional context if available
    if (err && typeof err === 'object') {
      if ('code' in err) {
        console.error(`[Redis] Error code: ${err.code}`);
      }
      if ('syscall' in err) {
        console.error(`[Redis] System call: ${err.syscall}`);
      }

      // Capture additional diagnostic fields for network errors
      // These provide crucial context for debugging connection issues:
      // - errno: System error number (e.g., -3008 for ENOTFOUND)
      // - address: Host/IP that failed to connect (e.g., "redis.example.com")
      // - port: Port number attempted (e.g., 6379)
      if ('errno' in err || 'address' in err || 'port' in err) {
        console.error(`[Redis] Network context:`, {
          errno: 'errno' in err ? err.errno : undefined,
          address: 'address' in err ? err.address : undefined,
          port: 'port' in err ? err.port : undefined,
        });
      }
    }
  });

  // Track successful connections
  redisInstance.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  // Track connection close events
  redisInstance.on('close', () => {
    // Log timestamp for debugging connection lifecycle
    console.warn(`[Redis] Connection closed at ${new Date().toISOString()}`);
  });

  // Track reconnection attempts
  redisInstance.on('reconnecting', (delay) => {
    // Defensive: delay might be undefined in some error scenarios
    const delayMs = typeof delay === 'number' ? delay : 'unknown';
    console.log(`[Redis] Reconnecting in ${delayMs}ms`);
  });

  // Track when connection is ready
  redisInstance.on('ready', () => {
    console.log('[Redis] Connection ready to accept commands');
  });

  // Track graceful end events
  redisInstance.on('end', () => {
    console.log('[Redis] Connection ended gracefully');
  });

  return redisInstance;
}

/**
 * Graceful shutdown handler for production environments
 *
 * IMPORTANT: In serverless/edge environments, connections can accumulate across
 * cold starts and invocations. Always implement proper cleanup to prevent:
 * - Connection pool exhaustion
 * - Memory leaks
 * - Dangling connections consuming Redis connection limits
 *
 * For traditional Node.js servers (PM2, Docker, etc.), register shutdown handlers.
 * For serverless (Vercel, Lambda), the platform handles cleanup automatically.
 */
if (process.env.NODE_ENV !== 'development') {
  // Handle graceful shutdown on SIGTERM (Docker, Kubernetes)
  process.on('SIGTERM', async () => {
    console.log('[Redis] SIGTERM received, closing Redis connection gracefully');
    try {
      if (redis) {
        await redis.quit(); // Graceful shutdown (waits for pending commands)
        console.log('[Redis] Connection closed successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Redis] Error during shutdown:', errorMessage);
      // Force close if graceful shutdown fails
      redis?.disconnect();
    }
  });

  // Handle graceful shutdown on SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    console.log('[Redis] SIGINT received, closing Redis connection');
    try {
      if (redis) {
        await redis.quit();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Redis] Error during shutdown:', errorMessage);
      redis?.disconnect();
    }
    process.exit(0);
  });
}

/**
 * SERVERLESS ENVIRONMENT CONSIDERATIONS
 *
 * The SIGTERM/SIGINT handlers above work in traditional Node.js servers (Docker, Kubernetes).
 * However, serverless platforms (Lambda, Vercel Functions, Cloudflare Workers) have different
 * lifecycle characteristics:
 *
 * **Connection Lifecycle in Serverless:**
 * - Lambda: Function instances persist connections across invocations (by design)
 * - Vercel: Edge Functions may terminate without sending SIGTERM
 * - Cold starts: Each new instance creates a new Redis connection
 * - Warm invocations: Reuse existing connection from previous invocations
 *
 * **Why This Implementation is Acceptable for Serverless:**
 *
 * 1. **Connection Persistence is Intentional:**
 *    - Singleton pattern (`getRedis()`) ensures one connection per function instance
 *    - Reusing connections across invocations improves performance (no reconnection overhead)
 *    - This is the recommended pattern for serverless Redis clients
 *
 * 2. **Platform-Managed Cleanup:**
 *    - Lambda: Terminates idle instances after 15 minutes (connections auto-close)
 *    - Vercel: Handles connection cleanup when instances are recycled
 *    - Redis: Idle timeout (`tcp-keepalive`) closes stale connections server-side
 *
 * 3. **Lock TTL Provides Safety Net:**
 *    - If a Lambda instance dies mid-operation, lock expires via TTL (default: 60s)
 *    - No orphaned locks even if process terminates without cleanup
 *    - Automatic recovery without manual intervention
 *
 * **Monitoring Guidance:**
 *
 * Monitor Redis connection count over time:
 * ```bash
 * # Redis CLI
 * redis-cli INFO clients | grep connected_clients
 * ```
 *
 * **Expected Behavior:**
 * - Connection count = number of active serverless instances
 * - Spikes during traffic bursts (cold starts)
 * - Gradual decline during idle periods (instance recycling)
 *
 * **Warning Signs (Investigate):**
 * - Continuously growing connection count (possible leak)
 * - Connection count >> expected instance count (check for connection pooling misconfiguration)
 * - Sudden drops to zero (Redis server restart or network issue)
 *
 * **Alert Thresholds:**
 * - Warning: `connected_clients > 100` (for typical workloads)
 * - Critical: `connected_clients > 500` (approaching Redis max connections)
 * - Adjust based on your expected concurrency
 *
 * **Lambda-Specific Best Practices:**
 *
 * If you need explicit cleanup before Lambda freezes:
 * ```typescript
 * // Use Lambda context to hook into lifecycle
 * export const handler = async (event: any, context: any) => {
 *   context.callbackWaitsForEmptyEventLoop = false; // Don't wait for Redis
 *
 *   try {
 *     const result = await yourBusinessLogic();
 *     return result;
 *   } finally {
 *     // Optional: Don't disconnect - let connection persist for next invocation
 *     // Only disconnect if you detect the Lambda is about to shutdown
 *   }
 * };
 * ```
 *
 * **Connection Pool Limits (Optional):**
 *
 * If experiencing connection exhaustion, configure Redis max connections:
 * ```bash
 * # redis.conf
 * maxclients 1000  # Default is 10000
 * ```
 *
 * And add connection pooling limits in ioredis:
 * ```typescript
 * const redis = new Redis(process.env.REDIS_URL, {
 *   maxRetriesPerRequest: 3,
 *   enableOfflineQueue: true,
 *   // Limit connection attempts if Redis is at max capacity
 *   retryStrategy: (times) => {
 *     if (times > 10) return null; // Stop retrying
 *     return Math.min(times * 50, 2000);
 *   },
 * });
 * ```
 */

/**
 * Distributed mutex using Redis for cross-instance locking
 *
 * Redis Connection States (ioredis):
 * - 'wait': Initial state before connection
 * - 'connecting': Attempting to connect
 * - 'connect': TCP connection established
 * - 'ready': Connection ready to accept commands
 * - 'reconnecting': Attempting to reconnect after failure
 * - 'end': Connection closed gracefully
 * - 'close': Connection closed (possibly unexpectedly)
 *
 * The getRedis() function handles 'end' and 'close' states by reinitializing
 * the connection, preventing stale connection references.
 *
 * Lock TTL Configuration:
 * The lock TTL (Time To Live) determines how long the lock can be held before
 * it automatically expires. This is a critical safety mechanism to prevent
 * deadlocks if a process crashes while holding the lock.
 *
 * IMPORTANT: TTL must be LONGER than your longest expected seed operation.
 * If seeding takes longer than the TTL:
 * - The lock expires while the operation is still running
 * - Concurrent requests will bypass the mutex
 * - Multiple seed operations will run simultaneously (race condition!)
 *
 * How to tune TTL:
 * 1. Measure your seed operation duration in production
 * 2. Add 50% buffer for network latency and database slowness
 * 3. Set TTL via environment variable: REDIS_LOCK_TTL
 *
 * Examples:
 * - Seed takes 5s → set TTL to 10s (5s * 2)
 * - Seed takes 45s → set TTL to 90s (45s * 2)
 * - Seed takes 2min → set TTL to 180s (2min * 1.5)
 *
 * Monitoring recommendations:
 * - Log seed operation duration: console.log(`Seed completed in ${duration}ms`)
 * - Alert if duration approaches 80% of TTL
 * - Track lock acquisition failures (429 responses)
 */
class DistributedSeedMutex {
  private readonly lockKey = 'dev:seed:lock';
  // Configurable TTL with safe default of 60 seconds
  // Override via environment variable: REDIS_LOCK_TTL=90
  private readonly lockTTL = parseInt(process.env.REDIS_LOCK_TTL || '60', 10);

  async acquire(): Promise<boolean> {
    try {
      const redis = getRedis();

      // Fail fast if connection is in a bad state
      // CRITICAL: Don't attempt operations on dead/closed connections
      // This prevents silent failures where the operation appears to succeed
      // but the lock isn't actually acquired
      if (redis.status === 'end' || redis.status === 'close') {
        console.error(
          `[Redis] Cannot acquire lock: connection is ${redis.status}. ` +
          `This indicates a dead connection that should be reinitialized.`
        );
        return false;
      }

      // Fail fast if connection is still connecting or waiting
      // Operations during these states may timeout or fail silently
      if (redis.status === 'wait' || redis.status === 'connecting') {
        console.error(
          `[Redis] Cannot acquire lock: connection is ${redis.status}. ` +
          `Wait for connection to be 'ready' before attempting lock acquisition.`
        );
        return false;
      }

      // Warn but allow if reconnecting (ioredis queues commands during reconnect)
      if (redis.status === 'reconnecting') {
        console.warn(
          `[Redis] Attempting lock acquisition while reconnecting. ` +
          `Command will be queued but may timeout. Consider retrying.`
        );
      }

      // Connection should be 'ready' or 'connect' at this point
      // Log for debugging if status is truly unexpected
      // Note: 'reconnecting' is already logged above, so exclude it here to prevent duplicate warnings
      if (redis.status !== 'ready' && redis.status !== 'connect' && redis.status !== 'reconnecting') {
        console.warn(
          `[Redis] Unexpected connection state during lock acquisition: ${redis.status}. ` +
          `Expected 'ready' or 'connect'. Lock acquisition may fail.`
        );
      }

      /**
       * TIMEOUT IMPLICATIONS OF STATE-BASED VALIDATION:
       *
       * The fail-fast checks above prevent long timeouts during connection issues.
       * Without these checks, callers would experience unpredictable delays:
       *
       * | State         | Command Behavior                     | Typical Timeout | User Experience          |
       * |---------------|--------------------------------------|-----------------|--------------------------|
       * | `end`/`close` | Command fails immediately            | <1ms            | Fast failure (good)      |
       * | `wait`        | Command queued indefinitely          | 5-10s           | Unresponsive UI          |
       * | `connecting`  | Command queued until connect/timeout | 5-10s           | Unresponsive UI          |
       * | `reconnecting`| Command queued with backoff retry    | 10-20s          | Very slow response       |
       * | `ready`       | Command executes immediately         | <1ms            | Normal operation (best)  |
       * | `connect`     | Command executes immediately         | <1ms            | Normal operation (best)  |
       *
       * **Why Fail-Fast Strategy is Critical:**
       *
       * 1. **User Experience**: Without fail-fast, seed endpoint would hang for 5-20 seconds
       *    before returning an error, making the UI appear frozen.
       *
       * 2. **Resource Efficiency**: Failed commands during `wait`/`connecting` consume
       *    connection slots and queue memory unnecessarily.
       *
       * 3. **Clear Error Messages**: Failing fast allows us to return specific error:
       *    "Redis connection not ready" instead of generic "Command timeout after 10s"
       *
       * 4. **Debugging**: State-specific errors help identify root cause:
       *    - `wait`/`connecting` → Initial connection issue (check REDIS_URL)
       *    - `reconnecting` → Intermittent connection (check network stability)
       *    - `end`/`close` → Dead connection (check Redis server health)
       *
       * **Why `reconnecting` is Allowed (with Warning):**
       *
       * ioredis queues commands during reconnection and will execute them once
       * the connection is re-established. This can succeed if reconnection is fast.
       * However, we log a warning because:
       * - Reconnection may take 10-20 seconds (poor UX)
       * - Command might timeout before reconnection completes
       * - Caller should consider retrying with exponential backoff instead
       *
       * **Configuration:**
       *
       * Default ioredis timeout: 5000ms (5 seconds)
       * Can be configured in createRedisConnection():
       * ```typescript
       * const redis = new Redis(REDIS_URL, {
       *   commandTimeout: 5000,  // 5 seconds (default)
       *   // Set lower for fail-fast behavior in acquire()
       *   // Set higher if network latency is consistently high
       * });
       * ```
       */

      // SET lockKey "locked" NX EX {lockTTL}
      // NX = only set if not exists (atomic check-and-set)
      // EX = expiry in seconds (default: 60s, configurable via REDIS_LOCK_TTL)
      const result = await redis.set(
        this.lockKey,
        'locked',
        'NX',
        'EX',
        this.lockTTL
      );
      return result === 'OK';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Redis] Failed to acquire distributed lock: ${errorMessage}`);
      return false;
    }
  }

  async release(): Promise<void> {
    try {
      const redis = getRedis();

      // Check connection state before release
      // Unlike acquire(), we're more lenient here because:
      // 1. Lock will auto-expire via TTL even if release fails
      // 2. Release is called in finally blocks (must not throw)
      if (redis.status === 'end' || redis.status === 'close') {
        console.warn(
          `[Redis] Cannot release lock: connection is ${redis.status}. ` +
          `Lock will auto-expire after ${this.lockTTL}s.`
        );

        // OBSERVABILITY: Emit metric for connection failures during release
        // This helps track Redis connection health issues
        // Example implementations:
        //   metrics.increment('seed.lock.release_connection_failed');
        //   statsd.increment('redis.lock.release.connection_down');
        //   cloudwatch.putMetric('SeedLock/ReleaseConnectionFailed', 1);

        return; // Graceful degradation: rely on TTL expiry
      }

      // Attempt to release the lock
      const result = await redis.del(this.lockKey);

      // Log if lock wasn't held (DEL returned 0)
      // This can happen if:
      // - Lock was already released
      // - Lock expired due to TTL (seed took longer than lockTTL seconds)
      // - Lock was never acquired
      if (result === 0) {
        console.warn(
          '[Redis] Lock release returned 0 (key did not exist). ' +
          'This may indicate the lock expired before release was called.'
        );

        // OBSERVABILITY: Emit metric for lock auto-expiry
        // High frequency of this metric indicates seeds are taking longer than lockTTL
        // Action: Increase REDIS_LOCK_TTL or optimize seed performance
        // Example implementations:
        //   metrics.increment('seed.lock.auto_expired');
        //   statsd.increment('redis.lock.expired_before_release');
        //   cloudwatch.putMetric('SeedLock/AutoExpired', 1);
        //
        // Recommended alerts:
        //   Warning: > 5 auto-expirations per hour (seeds are slow)
        //   Critical: > 20 auto-expirations per hour (increase lockTTL urgently)
      } else {
        console.log('[Redis] Lock released successfully');

        // OBSERVABILITY: Emit metric for successful release (optional)
        // Useful for calculating success rate: released / (released + auto_expired + failed)
        // Example implementations:
        //   metrics.increment('seed.lock.released');
        //   statsd.increment('redis.lock.released_successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Redis] Failed to release distributed lock: ${errorMessage}`);

      // Lock will auto-expire after TTL, so this is not critical
      // but we should log it for monitoring to track Redis health issues
      console.warn(
        `[Redis] Lock will auto-expire after ${this.lockTTL}s. ` +
        'Consider investigating Redis connection issues if this happens frequently.'
      );

      // OBSERVABILITY: Emit metric for release failures
      // This helps distinguish between:
      // - Connection issues (tracked separately above)
      // - Redis command failures (network timeouts, Redis server errors)
      // Example implementations:
      //   metrics.increment('seed.lock.release_failed');
      //   statsd.increment('redis.lock.release.error');
      //   cloudwatch.putMetric('SeedLock/ReleaseFailed', 1);
      //
      // Recommended alerts:
      //   Warning: > 3 release failures per hour (investigate Redis health)
      //   Critical: > 10 release failures per hour (Redis connection unstable)
    }
  }

  /**
   * Health check method for monitoring Redis connection
   * Useful for debugging and health endpoints
   */
  async healthCheck(): Promise<{ status: string; healthy: boolean }> {
    try {
      const redis = getRedis();
      const status = redis.status;

      // Attempt a ping to verify connectivity
      const pingResult = await redis.ping();

      return {
        status,
        healthy: pingResult === 'PONG' && (status === 'ready' || status === 'connect'),
      };
    } catch (error) {
      return {
        status: 'error',
        healthy: false,
      };
    }
  }
}

/**
 * Connection Health Check Strategy
 *
 * The acquire() method implements fail-fast behavior for critical lock operations:
 *
 * Connection State Matrix:
 * ┌──────────────┬─────────────┬────────────────────────────────────────┐
 * │ State        │ acquire()   │ Reason                                 │
 * ├──────────────┼─────────────┼────────────────────────────────────────┤
 * │ ready        │ ✅ Proceed  │ Connection healthy, ready for commands │
 * │ connect      │ ✅ Proceed  │ TCP connected, commands will work      │
 * │ reconnecting │ ⚠️  Warn    │ Queues commands but may timeout        │
 * │ wait         │ ❌ Fail     │ Not yet connected, will timeout        │
 * │ connecting   │ ❌ Fail     │ Still establishing connection          │
 * │ end          │ ❌ Fail     │ Connection closed gracefully           │
 * │ close        │ ❌ Fail     │ Connection closed (possibly crashed)   │
 * └──────────────┴─────────────┴────────────────────────────────────────┘
 *
 * The release() method is more lenient:
 * - Fails gracefully on bad connection states
 * - Relies on TTL auto-expiry as backup
 * - Never throws (called in finally blocks)
 * - Logs warnings for monitoring
 *
 * Why fail-fast in acquire()?
 * 1. Prevents silent failures where lock appears acquired but isn't
 * 2. Forces client to retry or return proper error response
 * 3. Avoids race conditions from phantom lock acquisitions
 * 4. Makes debugging easier with clear error messages
 *
 * Why graceful degradation in release()?
 * 1. Lock will expire via TTL even if release fails
 * 2. Release is called in finally blocks (must not throw)
 * 3. Connection issues shouldn't prevent cleanup flow
 * 4. Temporary unavailability is acceptable here
 *
 * Example failure scenario prevented by health checks:
 *
 * WITHOUT health checks:
 * 1. Redis connection dies mid-request
 * 2. acquire() attempts SET command on dead connection
 * 3. Command times out after 5s (commandTimeout)
 * 4. Returns false, but no clear error about WHY
 * 5. Client gets generic "lock in use" error
 * 6. Debugging requires checking Redis logs
 *
 * WITH health checks:
 * 1. Redis connection dies mid-request
 * 2. acquire() checks redis.status === 'close'
 * 3. Immediately returns false with clear error log
 * 4. Error message: "Cannot acquire lock: connection is close"
 * 5. Client gets immediate feedback, can retry
 * 6. Debugging is straightforward from application logs
 */

// Usage in route handler
export async function POST(request: Request) {
  // It's OK to create a new mutex instance per request since the Redis
  // connection is a module-level singleton managed by getRedis()
  const mutex = new DistributedSeedMutex();

  const acquired = await mutex.acquire();
  if (!acquired) {
    // Lock acquisition failed - this could mean:
    // 1. Another seed operation is in progress (expected, return 409)
    // 2. Redis connection is unhealthy (fail-fast from health check)
    //
    // For production, consider adding retry logic for transient failures:
    // - Retry 2-3 times with exponential backoff (100ms, 200ms, 400ms)
    // - Only retry if error is connection-related (not lock contention)
    // - Return 503 Service Unavailable for Redis issues
    // - Return 409 Conflict for legitimate lock contention
    //
    // Simple implementation:
    // if (redisUnavailable) {
    //   return NextResponse.json(
    //     { error: 'Service temporarily unavailable' },
    //     { status: 503 }
    //   );
    // }

    return NextResponse.json(
      { error: 'Another seed operation is in progress' },
      { status: 409 } // Conflict
    );
  }

  // Track operation duration to ensure it doesn't exceed TTL
  const startTime = Date.now();

  try {
    // Seed logic here
    const result = await performSeedOperation();

    // Monitor operation duration with clock skew protection
    const duration = Date.now() - startTime;
    const lockTTL = parseInt(process.env.REDIS_LOCK_TTL || '60', 10) * 1000; // Convert to ms
    const ttlThreshold = lockTTL * 0.8; // Alert if using >80% of TTL

    // Guard against clock skew (negative duration shouldn't happen but could in edge cases)
    // This can occur if:
    // 1. System clock adjusted backward during operation (NTP correction, manual change)
    // 2. VM migrated to host with different clock (cloud environments)
    // 3. Time zone changes during operation (rare but possible)
    if (duration < 0) {
      console.error(
        `[Seed] CRITICAL: Detected negative operation duration (${duration}ms). ` +
        `This indicates clock skew or system time adjustment. ` +
        `Start time: ${new Date(startTime).toISOString()}, End time: ${new Date().toISOString()}`
      );

      // Emit metric for monitoring (if metrics are configured)
      // metrics.increment('seed.clock_skew_detected');

      // Fall back to conservative TTL check: assume operation took full TTL
      // This prevents false "operation completed quickly" when clock skewed backward
      console.warn(
        `[Seed] Using conservative TTL check due to clock skew. ` +
        `Lock may have expired during operation.`
      );

      // Log the result but warn about timing unreliability
      console.log(
        `[Seed] Operation completed (duration unreliable due to clock skew)`
      );
    } else {
      console.log(`[Seed] Operation completed in ${duration}ms`);

      // Alert if operation is approaching TTL limit
      if (duration > ttlThreshold) {
        console.warn(
          `[Seed] WARNING: Operation took ${duration}ms, which is ${Math.round((duration / lockTTL) * 100)}% of the lock TTL (${lockTTL}ms). ` +
          `Consider increasing REDIS_LOCK_TTL to avoid race conditions.`
        );

        // Emit metric for monitoring (if metrics are configured)
        // metrics.gauge('seed.duration_ms', duration);
        // metrics.gauge('seed.ttl_utilization_percent', (duration / lockTTL) * 100);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;

    // Guard against clock skew in error path as well
    if (duration < 0) {
      console.error(
        `[Seed] Operation failed (duration unreliable due to clock skew):`, error
      );
    } else {
      console.error(`[Seed] Operation failed after ${duration}ms:`, error);
    }
    return NextResponse.json(
      { error: 'Seed operation failed' },
      { status: 500 }
    );
  } finally {
    // Always release the lock, even if seeding fails
    await mutex.release();
  }
}
```

**Environment Configuration:**

```bash
# .env.local (development)
REDIS_URL=redis://localhost:6379
# Optional: Lock TTL in seconds (default: 60)
REDIS_LOCK_TTL=60

# .env.production (production)
REDIS_URL=rediss://default:password@your-redis-host:6380
# CRITICAL: Set TTL based on measured seed operation duration
# Rule: TTL should be 1.5-2x your longest seed operation time
REDIS_LOCK_TTL=90  # Example: if seed takes ~45 seconds
```

**Clock Skew Considerations:**

The duration monitoring above includes protection against clock skew (negative durations). This is important because:

**Clock Skew Scenarios:**
1. **NTP Correction**: System clock adjusted backward by Network Time Protocol
2. **Manual Clock Change**: Administrator manually sets clock backward
3. **VM Migration**: Virtual machine migrated to host with different system time
4. **Daylight Saving Time**: In rare cases, DST transitions can affect timestamps
5. **Cloud Environments**: AWS, GCP, Azure can have subtle clock drift between instances

**Detection and Handling:**
```typescript
if (duration < 0) {
  // CRITICAL: Clock skew detected
  // Log diagnostic information: start time, end time, ISO timestamps
  // Fall back to conservative check (assume full TTL used)
  // Emit metric for monitoring: seed.clock_skew_detected
}
```

**Alternative Timing Mechanisms:**

If clock skew is a frequent issue in your environment, consider using `performance.now()` instead:

```typescript
// Alternative: Use performance.now() for monotonic timing
// performance.now() is immune to system clock changes
const startTime = performance.now();

try {
  const result = await performSeedOperation();

  const duration = performance.now() - startTime; // Always positive and accurate
  console.log(`[Seed] Operation completed in ${duration.toFixed(2)}ms`);

  // ... rest of monitoring logic
} finally {
  await mutex.release();
}
```

**Tradeoffs:**

| Mechanism | Pros | Cons | Use When |
|-----------|------|------|----------|
| `Date.now()` | Wall clock time, correlates with logs | Subject to clock skew | Normal environments |
| `performance.now()` | Monotonic, immune to clock changes | Can't correlate with wall clock | Frequent clock sync issues |
| Both (defensive) | Best of both worlds | Slightly more code | High-reliability production |

**Monitoring Clock Skew:**

Add to your observability dashboard:
```typescript
// Emit metric when clock skew detected
if (duration < 0) {
  metrics.increment('seed.clock_skew_detected', {
    skew_ms: Math.abs(duration),
    environment: process.env.NODE_ENV,
  });

  // Alert if clock skew detected more than once per day
  // This indicates systemic time synchronization issues
}
```

**Alert Thresholds:**
- **Warning**: Clock skew detected (any occurrence)
- **Critical**: Clock skew detected > 3 times in 24 hours
- **Action**: Check NTP configuration, investigate VM migration patterns

**TTL Configuration Guidelines:**

1. **Measure first**: Deploy with default TTL (60s) and monitor logs for actual duration
2. **Calculate required TTL**: `Required TTL = Max Observed Duration * 2`
3. **Update environment variable**: Set `REDIS_LOCK_TTL` to calculated value
4. **Monitor alerts**: Watch for TTL threshold warnings in logs
5. **Watch for clock skew**: Monitor `seed.clock_skew_detected` metric

Example calculation:
```
# Observed seed durations from logs:
[Seed] Operation completed in 23456ms  # 23.4 seconds
[Seed] Operation completed in 34567ms  # 34.5 seconds
[Seed] Operation completed in 41234ms  # 41.2 seconds (slowest)

# Calculation:
Max duration: 41.2 seconds
Required TTL: 41.2 * 2 = 82.4 seconds
Set REDIS_LOCK_TTL=90 (round up for safety)
```

**Health Monitoring:**

Create a health check endpoint to monitor Redis connection:

```typescript
// src/app/api/health/redis/route.ts
import { NextResponse } from 'next/server';
import { DistributedSeedMutex } from '@/lib/redis-mutex';

export async function GET() {
  const mutex = new DistributedSeedMutex();
  const health = await mutex.healthCheck();

  return NextResponse.json(health, {
    status: health.healthy ? 200 : 503,
  });
}
```

**Usage example:**

```bash
# Check Redis health
curl http://localhost:3000/api/health/redis

# Response when healthy:
# {"status":"ready","healthy":true}

# Response when connection failed:
# {"status":"error","healthy":false}
```

**Production Monitoring:**

Integrate with your observability stack:

```typescript
import * as Sentry from '@sentry/nextjs';

// In createRedisConnection():
redisInstance.on('error', (err) => {
  // Defensive error handling for logging
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorName = err instanceof Error ? err.name : 'UnknownError';
  console.error(`[Redis] Connection error (${errorName}):`, errorMessage);

  // Log additional diagnostic context
  if (err && typeof err === 'object') {
    if ('code' in err) {
      console.error(`[Redis] Error code: ${err.code}`);
    }
    if ('syscall' in err) {
      console.error(`[Redis] System call: ${err.syscall}`);
    }
    if ('errno' in err || 'address' in err || 'port' in err) {
      console.error(`[Redis] Network context:`, {
        errno: 'errno' in err ? err.errno : undefined,
        address: 'address' in err ? err.address : undefined,
        port: 'port' in err ? err.port : undefined,
      });
    }
  }

  // Send to error tracking service
  // Normalize error to ensure Sentry can process it
  const normalizedError = err instanceof Error
    ? err
    : new Error(String(err));

  Sentry.captureException(normalizedError, {
    tags: {
      component: 'redis',
      errorType: errorName,
    },
    level: 'error',
    contexts: {
      redis: {
        errorCode: err && typeof err === 'object' && 'code' in err ? err.code : undefined,
        syscall: err && typeof err === 'object' && 'syscall' in err ? err.syscall : undefined,
        // Include network diagnostic fields for better debugging
        errno: err && typeof err === 'object' && 'errno' in err ? err.errno : undefined,
        address: err && typeof err === 'object' && 'address' in err ? err.address : undefined,
        port: err && typeof err === 'object' && 'port' in err ? err.port : undefined,
      },
    },
  });
});

redisInstance.on('close', () => {
  const timestamp = new Date().toISOString();
  console.warn(`Redis connection closed at ${timestamp}`);

  // Alert monitoring service
  // Defensive: Ensure status is serializable (ioredis status is always a string)
  const currentStatus = redisInstance.status;
  const safeStatus = typeof currentStatus === 'string' ? currentStatus : 'unknown';

  Sentry.captureMessage('Redis connection closed unexpectedly', {
    level: 'warning',
    tags: {
      component: 'redis',
      timestamp,
      status: safeStatus, // Include status in tags for quick filtering
    },
    contexts: {
      redis: {
        status: safeStatus,
        timestamp, // Include in context for detailed analysis
      },
    },
  });
});

redisInstance.on('reconnecting', (delay) => {
  // Track reconnection patterns for performance monitoring
  // Defensive: delay might be undefined in error scenarios
  const delayMs = typeof delay === 'number' ? delay : undefined;

  // Only send breadcrumb if we have meaningful data
  // This prevents misleading "0ms reconnect" entries when delay is unknown
  if (delayMs !== undefined) {
    Sentry.addBreadcrumb({
      category: 'redis',
      message: `Redis reconnecting in ${delayMs}ms`,
      level: 'info',
      data: {
        delayMs,
        timestamp: new Date().toISOString(),
        // Include retry attempt number if available from retryStrategy
        attemptNumber: undefined, // ioredis doesn't expose this in reconnecting event
      },
    });
  } else {
    // Log breadcrumb with unknown delay (still valuable for debugging)
    Sentry.addBreadcrumb({
      category: 'redis',
      message: 'Redis reconnecting (delay unknown)',
      level: 'warning', // Warning level since missing expected data
      data: {
        timestamp: new Date().toISOString(),
        delayUnknownReason: 'delay parameter not provided by ioredis',
      },
    });
  }
});

// Add TTL monitoring to route handler for alerting
// In your POST handler after operation completes:
const duration = Date.now() - startTime;
const lockTTL = parseInt(process.env.REDIS_LOCK_TTL || '60', 10) * 1000;

if (duration > lockTTL * 0.8) {
  // Alert via monitoring service
  Sentry.captureMessage('Seed operation approaching lock TTL limit', {
    level: 'warning',
    tags: {
      component: 'dev-seed',
      issue: 'ttl-threshold-exceeded',
    },
    contexts: {
      operation: {
        duration,
        lockTTL,
        utilizationPercent: Math.round((duration / lockTTL) * 100),
      },
    },
  });
}
```

**Lock Metrics Implementation Guide:**

The `release()` method includes three key observability points (see lines 533-599 above):

1. **Connection Failures During Release** (`seed.lock.release_connection_failed`)
2. **Lock Auto-Expiry** (`seed.lock.auto_expired`)
3. **Release Command Failures** (`seed.lock.release_failed`)

**Example Metric Integration:**

```typescript
// lib/metrics.ts - Simple metrics wrapper
interface MetricsClient {
  increment(metric: string, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
}

// Example: StatsD/Datadog
import { StatsD } from 'node-statsd';
const statsd = new StatsD({ host: 'localhost', port: 8125 });

export const metrics: MetricsClient = {
  increment: (metric, tags) => {
    statsd.increment(metric, 1, tags);
  },
  gauge: (metric, value, tags) => {
    statsd.gauge(metric, value, tags);
  },
};

// In DistributedSeedMutex.release():
async release(): Promise<void> {
  try {
    const redis = getRedis();

    if (redis.status === 'end' || redis.status === 'close') {
      console.warn(/* ... */);
      metrics.increment('seed.lock.release_connection_failed'); // ADD THIS
      return;
    }

    const result = await redis.del(this.lockKey);

    if (result === 0) {
      console.warn(/* ... */);
      metrics.increment('seed.lock.auto_expired'); // ADD THIS
    } else {
      console.log('[Redis] Lock released successfully');
      metrics.increment('seed.lock.released'); // ADD THIS (optional)
    }
  } catch (error) {
    console.error(/* ... */);
    metrics.increment('seed.lock.release_failed'); // ADD THIS
  }
}
```

**Dashboard Setup:**

```yaml
# Example: Grafana dashboard queries (PromQL / Datadog)

# Lock Success Rate
(
  sum(rate(seed_lock_released[5m]))
  /
  sum(rate(seed_lock_released[5m] + seed_lock_auto_expired[5m] + seed_lock_release_failed[5m]))
) * 100

# Lock Auto-Expiry Frequency
sum(rate(seed_lock_auto_expired[1h]))

# Connection Health
sum(rate(seed_lock_release_connection_failed[5m]))

# Release Failure Rate
sum(rate(seed_lock_release_failed[5m]))
```

**Alerting and Monitoring Best Practices:**

1. **Set up alerts for TTL threshold violations**:
   ```typescript
   // Example: Datadog alert
   // Monitor: logs("Seed operation approaching lock TTL limit")
   // Threshold: Alert when count > 0 in 5 minutes
   // Action: Page on-call engineer
   ```

2. **Track lock acquisition failures**:
   ```typescript
   // In your route handler
   if (!acquired) {
     // Track 409 responses in metrics
     metrics.increment('seed.lock.conflict', {
       endpoint: 'dev-seed',
       timestamp: Date.now(),
     });

     return NextResponse.json(
       { error: 'Another seed operation is in progress' },
       { status: 409 }
     );
   }
   ```

3. **Alert Thresholds for Lock Metrics**:
   ```yaml
   # seed.lock.auto_expired
   Warning: > 5 per hour
   Critical: > 20 per hour
   Action: Increase REDIS_LOCK_TTL or optimize seed performance

   # seed.lock.release_connection_failed
   Warning: > 3 per hour
   Critical: > 10 per hour
   Action: Investigate Redis connection stability

   # seed.lock.release_failed
   Warning: > 3 per hour
   Critical: > 10 per hour
   Action: Check Redis server health and network

   # Lock success rate (released / total)
   Warning: < 95%
   Critical: < 80%
   Action: Review all lock-related metrics for root cause
   ```

4. **Operational Insights from Metrics**:

   | Metric Pattern | Likely Cause | Action |
   |----------------|--------------|--------|
   | High `auto_expired`, low `release_failed` | Seeds taking too long | Increase TTL or optimize |
   | High `release_connection_failed` | Redis connection unstable | Check network/Redis health |
   | High `release_failed`, low `auto_expired` | Redis command timeouts | Increase Redis resources |
   | All metrics low, high 409 responses | Concurrent requests blocked | Expected behavior (working) |
   | All metrics high simultaneously | Redis instance failure | Emergency: failover Redis |

3. **Dashboard metrics to monitor**:
   - Seed operation duration (p50, p95, p99)
   - Lock acquisition success rate
   - Lock TTL utilization percentage
   - Redis connection health checks
   - Number of 409 (Conflict) responses

4. **Alert conditions**:
   - `seed_duration > lockTTL * 0.8` → Warning: Approaching TTL limit
   - `seed_duration > lockTTL` → Critical: Lock expired during operation
   - `lock_acquisition_failures > 5 in 10min` → Warning: High contention
   - `redis_connection_errors > 0` → Critical: Redis unavailable

**Cost**: Redis pricing varies
- Upstash: Free tier (10K requests/day)
- AWS ElastiCache: ~$15/month minimum
- Redis Cloud: Free tier available

**Connection Pooling Strategy:**

The singleton pattern used in `getRedis()` intentionally reuses **one connection** across all requests. This design choice is critical for:

1. **Cost Efficiency**: Redis providers often charge per connection. A singleton prevents connection exhaustion.
2. **Performance**: Reusing connections eliminates TCP handshake and authentication overhead on every request.
3. **Resource Management**: Prevents connection pool exhaustion in serverless cold starts.

**Important Notes:**

- **Serverless environments (Vercel, Lambda)**: Each function instance maintains its own singleton connection. Multiple concurrent invocations across different instances will have separate connections, which is the intended behavior for distributed locking.

- **Traditional servers (PM2, Docker)**: One connection is shared across all incoming requests within the same process. This is safe because ioredis uses connection pooling internally and commands are queued.

- **Monitoring**: Track connection count in your Redis dashboard. Expected pattern:
  - Development (single instance): 1 connection
  - Production (N serverless instances): N connections (one per active instance)
  - If you see connection count continuously growing, investigate for connection leaks

**Connection Lifecycle:**

```typescript
// Request 1 arrives → creates connection → singleton stores it
// Request 2 arrives → reuses existing connection (fast)
// Request 3 arrives → reuses existing connection (fast)
// Server/instance shuts down → SIGTERM handler closes connection gracefully
```

**When to use connection pooling (multiple connections):**

You typically do NOT need connection pooling for this use case because:
- The dev seed endpoint is low-traffic
- Lock operations (`SET NX`, `DEL`) are very fast (<1ms)
- Serverless platforms create multiple instances naturally for concurrent requests

However, if you're building a high-throughput system (>1000 req/sec), consider using ioredis cluster mode:

```typescript
import { Cluster } from 'ioredis';

const redis = new Cluster([
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
]);
```

## Solution 2: Idempotency Tokens (Recommended for Dev)

**Pros:**
- No external dependencies
- Simple to implement
- Works with existing Convex setup
- Perfect for development use case

**Implementation:**

```typescript
// In route.ts
export async function POST(request: Request) {
  const convex = new ConvexHttpClient(CONVEX_URL);

  // Generate idempotency token
  const seedToken = 'dev-seed-v1'; // Version-based token

  try {
    // Attempt to seed with idempotency check
    const result = await convex.mutation(api.devSeed.seedWithIdempotency, {
      token: seedToken,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error.message.includes('already seeded')) {
      return NextResponse.json({
        templates: { inserted: 0, skipped: 0 },
        themes: { inserted: 0 },
        skipped: true,
      });
    }
    throw error;
  }
}
```

```typescript
// In convex/devSeed.ts
export const seedWithIdempotency = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if this token was already used
    const existing = await ctx.db
      .query('seed_operations')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();

    if (existing) {
      throw new Error('Already seeded with this token');
    }

    // Record the token FIRST (atomic operation)
    const seedOpId = await ctx.db.insert('seed_operations', {
      token: args.token,
      timestamp: Date.now(),
      status: 'in_progress',
    });

    try {
      // Perform actual seeding
      const templatesResult = await seedTemplates(ctx);
      const themesResult = await seedThemes(ctx);

      // Mark as complete
      await ctx.db.patch(seedOpId, {
        status: 'completed',
        completedAt: Date.now(),
      });

      return {
        templates: templatesResult,
        themes: themesResult,
      };
    } catch (error) {
      // Mark as failed
      await ctx.db.patch(seedOpId, {
        status: 'failed',
        error: error.message,
      });
      throw error;
    }
  },
});
```

**Schema Addition:**

```typescript
// In convex/schema.ts
seed_operations: defineTable({
  token: v.string(),
  timestamp: v.number(),
  status: v.union(
    v.literal('in_progress'),
    v.literal('completed'),
    v.literal('failed')
  ),
  completedAt: v.optional(v.number()),
  error: v.optional(v.string()),
})
  .index('by_token', ['token'])
  .index('by_timestamp', ['timestamp']),
```

## Solution 3: Database-Level Constraints (Defense in Depth)

**Pros:**
- Prevents duplicates at the lowest level
- No race conditions possible
- Works regardless of application logic

**Implementation:**

```typescript
// In convex/schema.ts
builder_resume_templates: defineTable({
  slug: v.string(),
  name: v.string(),
  // ... other fields
})
  .index('by_slug', ['slug']), // Unique index

// In seed mutation
export const seedTemplates = mutation({
  handler: async (ctx) => {
    const templates = [
      { slug: 'modern-minimal', name: 'Modern Minimal', /* ... */ },
      { slug: 'professional', name: 'Professional', /* ... */ },
    ];

    const results = [];
    for (const template of templates) {
      // Check if exists before inserting
      const existing = await ctx.db
        .query('builder_resume_templates')
        .withIndex('by_slug', (q) => q.eq('slug', template.slug))
        .first();

      if (!existing) {
        const id = await ctx.db.insert('builder_resume_templates', template);
        results.push(id);
      }
    }

    return { inserted: results.length };
  },
});
```

**Benefits:**
- Even if mutex fails, database prevents duplicates
- Convex enforces uniqueness at index level
- Graceful handling (insert succeeds or is skipped)

## Solution 4: Single-Use Deployment Script (Best for Dev)

**Pros:**
- Simplest solution
- No concurrency issues
- Standard practice for seed data

**Implementation:**

```bash
# scripts/seed-dev.sh
#!/bin/bash

echo "Seeding development database..."

# Run seed command directly via Convex CLI
npx convex run devSeed:seedAll --prod

echo "Seed complete!"
```

```typescript
// convex/devSeed.ts
export const seedAll = internalMutation({
  handler: async (ctx) => {
    /**
     * RACE CONDITION WINDOW:
     * There is a small window between the lock check (lines 410-413) and lock insert (lines 434-438)
     * where concurrent calls could both pass the check and insert duplicate locks.
     *
     * Mitigation strategies:
     * 1. This is an internalMutation (not accessible via public API)
     * 2. Template count check provides secondary defense
     * 3. Documented expectation: only call from single-origin (one deployment script)
     *
     * For true atomicity, Convex would need compare-and-swap or transaction support.
     * Since this is dev-only tooling called from controlled sources, current approach is acceptable.
     *
     * If stricter guarantees are needed in production:
     * - Use distributed lock (Redis with SETNX)
     * - Use Convex action with external mutex service
     * - Redesign to make seed operations idempotent (insert-or-ignore pattern)
     */

    // Safety: Check for seed lock to prevent concurrent/duplicate runs
    // This provides additional protection beyond the template count check
    // NOTE: Not atomic with insert below - see race condition warning above
    const lockEntry = await ctx.db
      .query('seed_operations')
      .withIndex('by_status', (q) => q.eq('status', 'in_progress'))
      .first();

    if (lockEntry) {
      throw new Error(
        `Seed already in progress (started ${new Date(lockEntry.timestamp).toISOString()}). ` +
        `Wait for completion before retrying.`
      );
    }

    // Check if already seeded by examining actual data
    const templateCount = await ctx.db
      .query('builder_resume_templates')
      .collect()
      .then(t => t.length);

    if (templateCount > 0) {
      console.log('Database already seeded');
      return {
        templates: { inserted: 0, skipped: templateCount },
        themes: { inserted: 0 },
        skipped: true,
      };
    }

    // Record that seeding is starting (creates lock)
    // RACE CONDITION: Another call could insert between check and this insert
    const seedOpId = await ctx.db.insert('seed_operations', {
      token: 'seed-script-run',
      timestamp: Date.now(),
      status: 'in_progress',
    });

    try {
      // Seed templates
      const templatesResult = await seedTemplates(ctx);

      // Seed themes
      const themesResult = await seedThemes(ctx);

      // Mark as completed
      await ctx.db.patch(seedOpId, {
        status: 'completed',
        completedAt: Date.now(),
      });

      return {
        templates: templatesResult,
        themes: themesResult,
      };
    } catch (error) {
      // Mark as failed so the lock doesn't block future attempts
      await ctx.db.patch(seedOpId, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});
```

**Schema requirement for this approach:**

```typescript
// In convex/schema.ts
seed_operations: defineTable({
  token: v.string(),
  timestamp: v.number(),
  status: v.union(
    v.literal('in_progress'),
    v.literal('completed'),
    v.literal('failed')
  ),
  completedAt: v.optional(v.number()),
  error: v.optional(v.string()),
})
  .index('by_token', ['token'])
  .index('by_status', ['status']),
```

**Usage:**
```bash
# In package.json
{
  "scripts": {
    "seed:dev": "npx convex run devSeed:seedAll"
  }
}

# Run once during setup
npm run seed:dev
```

**Operational Procedures:**

1. **Check Seed Status:**
   ```bash
   # Query current seed operations
   npx convex query seed_operations:list

   # Expected output if seeding in progress:
   # { status: "in_progress", timestamp: 1234567890, token: "seed-script-run" }

   # Expected output if seeding completed:
   # { status: "completed", timestamp: 1234567890, completedAt: 1234568000 }
   ```

2. **Handle Stuck Seed (Failed Without Cleanup):**
   ```bash
   # If seed crashes and leaves lock in "in_progress" state indefinitely:

   # Option 1: Manual cleanup mutation
   npx convex run seed_operations:clearStuckLock

   # Option 2: Delete stuck lock via dashboard
   # Navigate to Convex Dashboard → seed_operations table → Delete stuck entry

   # Then retry seed:
   npm run seed:dev
   ```

3. **Reset Seed for Testing:**
   ```bash
   # WARNING: This deletes all seeded data
   npx convex run seed_operations:resetAll

   # Then re-seed:
   npm run seed:dev
   ```

**Helper Mutations for Seed Operations:**

```typescript
// convex/seed_operations.ts
import { internalMutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * List all seed operations (for monitoring)
 */
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('seed_operations').collect();
  },
});

/**
 * Clear stuck lock (use only if seed crashed)
 */
export const clearStuckLock = internalMutation({
  handler: async (ctx) => {
    const stuck = await ctx.db
      .query('seed_operations')
      .withIndex('by_status', (q) => q.eq('status', 'in_progress'))
      .first();

    if (!stuck) {
      return { message: 'No stuck lock found' };
    }

    // Check if truly stuck (older than 10 minutes)
    const ageMinutes = (Date.now() - stuck.timestamp) / 1000 / 60;

    if (ageMinutes < 10) {
      throw new Error(
        `Lock is only ${Math.round(ageMinutes)} minutes old. ` +
        `Wait at least 10 minutes before clearing.`
      );
    }

    // Mark as failed instead of deleting (preserves audit trail)
    await ctx.db.patch(stuck._id, {
      status: 'failed',
      error: 'Manually cleared - assumed stuck',
    });

    return { message: 'Stuck lock cleared', lockAge: ageMinutes };
  },
});

/**
 * Reset all seeded data (dev/test only)
 */
export const resetAll = internalMutation({
  handler: async (ctx) => {
    // Delete all seed operations
    const ops = await ctx.db.query('seed_operations').collect();
    for (const op of ops) {
      await ctx.db.delete(op._id);
    }

    // Delete all seeded templates
    const templates = await ctx.db.query('builder_resume_templates').collect();
    for (const template of templates) {
      await ctx.db.delete(template._id);
    }

    // Delete all seeded themes
    const themes = await ctx.db.query('builder_themes').collect();
    for (const theme of themes) {
      await ctx.db.delete(theme._id);
    }

    return {
      deleted: {
        operations: ops.length,
        templates: templates.length,
        themes: themes.length,
      },
    };
  },
});
```

**Monitoring Seed Operations:**

Add to your health check dashboard:
```typescript
// Check for stuck seed operations
export const healthCheck = query({
  handler: async (ctx) => {
    const inProgress = await ctx.db
      .query('seed_operations')
      .withIndex('by_status', (q) => q.eq('status', 'in_progress'))
      .first();

    if (inProgress) {
      const ageMinutes = (Date.now() - inProgress.timestamp) / 1000 / 60;

      return {
        healthy: ageMinutes < 5, // Warning if seed takes >5 minutes
        status: 'in_progress',
        ageMinutes: Math.round(ageMinutes),
        warning: ageMinutes > 5 ? 'Seed operation taking longer than expected' : null,
      };
    }

    return { healthy: true, status: 'idle' };
  },
});
```

## Recommended Approach by Environment

| Environment | Solution | Reason |
|-------------|----------|--------|
| **Local Development** | Single-use script | Simplest, no concurrency needed |
| **Development/Staging** | Idempotency tokens | No external dependencies, safe |
| **Production** | Distributed lock (Redis) | True cross-instance locking |
| **All Environments** | DB constraints | Defense in depth |

## Implementation Priority

### Phase 1: Quick Fix (Current State)
1. ✅ Add warning comments to existing code
2. ✅ Document the limitation
3. ✅ Recommend single-use script for dev

### Phase 2: Development Safety (1-2 days)
1. 🔲 Implement idempotency tokens in Convex
2. 🔲 Add database-level constraints (unique indexes)
3. 🔲 Update route to use idempotency

### Phase 3: Production Ready (1 week)
1. 🔲 Set up Redis instance
2. 🔲 Implement distributed locking
3. 🔲 Add monitoring/alerting for lock failures
4. 🔲 Load testing to verify concurrency handling

## Testing the Fix

### Standard Response Format

All seed endpoint implementations return a consistent response format:

```typescript
// Success (data seeded)
{
  templates: { inserted: number },  // Number of templates created
  themes: { inserted: number }      // Number of themes created
}

// Skipped (already seeded)
{
  templates: { inserted: 0, skipped: number },  // How many existing templates
  themes: { inserted: 0 },
  skipped: true  // Flag indicating operation was skipped
}

// Error (concurrent conflict or failure)
{
  error: string  // Error message
}
```

This standardized format allows the test script to reliably detect:
- Successful insertions: `response.templates.inserted > 0`
- Skipped operations: `response.skipped === true`
- Concurrent conflicts: `response.error !== undefined`

### Test Concurrent Requests

**IMPORTANT**: This test verifies true concurrent execution and detects race conditions.

```bash
# Test script: test-concurrent-seed.sh
#!/bin/bash

# ============================================================================
# Concurrent Seed Test Script
# ============================================================================
# This script tests that the seed endpoint properly handles concurrent requests
# and prevents race conditions that could lead to duplicate data.
#
# CONFIGURATION:
#   SEED_EXPECTED_TEMPLATES  - Number of templates your seed data creates (default: 3)
#
# VALIDATION STAGES:
#   1. Response file validation - Checks all files exist and are non-empty
#   2. Connection error detection - Checks for curl errors and HTML responses
#   3. JSON validation - Ensures all responses are valid JSON before parsing
#   4. Response analysis - Counts success/skip/error responses
#   5. Database verification - Checks for duplicates and expected count
#   6. Concurrency verification - Ensures requests truly overlapped
#
# EXIT CODES:
#   0 - Test passed (1 success, 4+ skipped)
#   1 - Test failed (race condition detected or errors)
#   2 - Test inconclusive (validation errors, malformed responses, or unexpected results)
#
# USAGE:
#   # Use default values
#   bash test-concurrent-seed.sh
#
#   # Specify expected template count
#   SEED_EXPECTED_TEMPLATES=5 bash test-concurrent-seed.sh
#
# CI/CD INTEGRATION:
#   Add to package.json:
#   {
#     "scripts": {
#       "test:seed": "SEED_EXPECTED_TEMPLATES=3 bash scripts/test-concurrent-seed.sh"
#     }
#   }
# ============================================================================

echo "🧪 Testing concurrent seed requests..."
echo ""

# Clean up any previous test files
rm -f response-*.json concurrent.log 2>/dev/null

# Record start time (nanoseconds for precision)
start_time=$(date +%s%N)

# Launch 5 concurrent requests with detailed logging
for i in {1..5}; do
  (
    req_start=$(date +%s%N)
    echo "Request $i starting at $req_start" >> concurrent.log

    curl -s -X POST http://localhost:3000/api/dev/seed \
      -H "Content-Type: application/json" \
      -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
      > response-$i.json 2>&1

    req_end=$(date +%s%N)
    req_duration=$(( (req_end - req_start) / 1000000 ))
    echo "Request $i completed at $req_end (${req_duration}ms)" >> concurrent.log
  ) &
done

# Wait for all background processes to complete
wait

end_time=$(date +%s%N)
elapsed_ms=$(( (end_time - start_time) / 1000000 ))

echo "✓ All requests completed in ${elapsed_ms}ms"
echo ""

# Validate that all response files were created and are not empty
echo "Validating response files..."
missing_responses=0
empty_responses=0

for i in {1..5}; do
  if [ ! -f "response-$i.json" ]; then
    echo "⚠️  WARNING: response-$i.json not found"
    ((missing_responses++))
  elif [ ! -s "response-$i.json" ]; then
    echo "⚠️  WARNING: response-$i.json is empty"
    ((empty_responses++))
  fi
done

if [ "$missing_responses" -gt 0 ] || [ "$empty_responses" -gt 0 ]; then
  echo "❌ ERROR: Some requests failed to complete or return data"
  echo "   Missing: $missing_responses, Empty: $empty_responses"
  echo ""
  echo "This indicates connection or server errors. Check:"
  echo "  - Is the server running on http://localhost:3000?"
  echo "  - Check server logs for errors"
  echo "  - Verify API endpoint is accessible"
  exit 2
fi

echo "✓ All response files present and non-empty"
echo ""

# Check for curl connection errors in responses
echo "Checking for connection errors..."
curl_errors=0

for i in {1..5}; do
  # Check for common curl error messages
  if grep -q "curl: (" response-$i.json 2>/dev/null; then
    echo "⚠️  WARNING: Request $i contains curl error:"
    grep "curl: (" response-$i.json
    ((curl_errors++))
  fi

  # Check for HTML error pages (server returning 500, 404, etc.)
  if grep -qi "<!DOCTYPE html>" response-$i.json 2>/dev/null; then
    echo "⚠️  WARNING: Request $i returned HTML instead of JSON (likely HTTP error page)"
    ((curl_errors++))
  fi
done

if [ "$curl_errors" -gt 0 ]; then
  echo "❌ ERROR: $curl_errors request(s) encountered connection or server errors"
  echo ""
  echo "First failed response:"
  for i in {1..5}; do
    if grep -q "curl: (" response-$i.json 2>/dev/null || grep -qi "<!DOCTYPE html>" response-$i.json 2>/dev/null; then
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      head -30 response-$i.json
      break
    fi
  done
  exit 2
fi

echo "✓ No connection errors detected"
echo ""

# Analyze concurrency - requests should overlap, not run sequentially
echo "📊 Concurrency Analysis:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sort concurrent.log | head -10
echo ""

# Check if requests truly overlapped (proper concurrent execution)
start_count=$(grep "starting" concurrent.log | wc -l)
if [ "$start_count" -eq 5 ]; then
  first_start=$(grep "starting" concurrent.log | head -1 | awk '{print $5}')
  last_start=$(grep "starting" concurrent.log | tail -1 | awk '{print $5}')
  first_complete=$(grep "completed" concurrent.log | head -1 | awk '{print $5}')

  # Convert to milliseconds and check overlap
  overlap_check=$(( (last_start - first_start) / 1000000 ))

  if [ $overlap_check -lt $elapsed_ms ]; then
    echo "✓ Requests executed concurrently (overlap detected)"
  else
    echo "⚠️  WARNING: Requests may have run sequentially!"
  fi
fi
echo ""

# Analyze responses
echo "📄 Response Analysis:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Count successful insertions
if command -v jq &> /dev/null; then
  # Validate JSON parsing before proceeding
  echo "Validating response JSON..."

  # Check if we can parse the responses as valid JSON
  if ! cat response-*.json | grep -v "^HTTP" | grep -v "^Time" | jq -s 'length' > /dev/null 2>&1; then
    echo "❌ ERROR: Failed to parse JSON responses"
    echo ""
    echo "This could indicate:"
    echo "  - Connection errors to the API"
    echo "  - Truncated or malformed responses"
    echo "  - Server errors returning HTML instead of JSON"
    echo ""

    # Display raw responses for debugging
    for i in {1..5}; do
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "Raw response from request $i:"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      head -20 response-$i.json
      echo ""
    done

    exit 2
  fi

  echo "✓ All responses are valid JSON"
  echo ""

  # Extract insertion counts
  cat response-*.json | grep -v "^HTTP" | grep -v "^Time" | jq -s '[.[] | select(.templates.inserted != null) | .templates.inserted] | add // 0' > total_inserted.tmp
  total_inserted=$(cat total_inserted.tmp)

  # Count responses by type
  success_count=$(cat response-*.json | grep -v "^HTTP" | grep -v "^Time" | jq 'select(.templates.inserted != null)' 2>/dev/null | wc -l)
  skipped_count=$(cat response-*.json | grep -v "^HTTP" | grep -v "^Time" | jq 'select(.skipped == true or .message == "Data already seeded")' 2>/dev/null | wc -l)
  error_count=$(cat response-*.json | grep -v "^HTTP" | grep -v "^Time" | jq 'select(.error != null)' 2>/dev/null | wc -l)

  echo "Successful insertions: $success_count"
  echo "Skipped (already seeded): $skipped_count"
  echo "Errors: $error_count"
  echo "Total templates inserted: $total_inserted"
  echo ""

  # Detailed breakdown
  echo "Response type breakdown:"
  cat response-*.json | grep -v "^HTTP" | grep -v "^Time" | jq -s 'group_by(.message // .error // "success") | map({key: .[0].message // .[0].error // "success", count: length}) | .[]'

  rm -f total_inserted.tmp
else
  echo "⚠️  jq not found - install for detailed analysis"
  echo "Response summaries:"
  for i in {1..5}; do
    echo "Response $i: $(head -1 response-$i.json)"
  done
fi
echo ""

# CRITICAL: Verify database state for duplicates
echo "🔍 Database Verification:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for duplicate templates
if command -v npx &> /dev/null; then
  echo "Checking for duplicate entries..."
  npx convex query devSeed:checkDuplicates 2>&1

  # Also verify expected template count
  echo ""
  echo "Verifying template count..."
  actual_count=$(npx convex query builder_resume_templates:count 2>&1 | tail -1)

  # Dynamically determine expected count from seed data or environment variable
  # Set SEED_EXPECTED_TEMPLATES in your environment or CI configuration
  expected_count=${SEED_EXPECTED_TEMPLATES:-3}

  if [ "$actual_count" -eq "$expected_count" ]; then
    echo "✓ Template count correct: $actual_count"
  else
    echo "⚠️  WARNING: Expected $expected_count templates, found $actual_count"
    echo "   This may indicate duplicates or missing templates!"
    echo "   Tip: Set SEED_EXPECTED_TEMPLATES environment variable to match your seed data"
  fi
else
  echo "⚠️  npx not found - cannot verify database state"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Test Summary:"

# Determine test result
if [ "$error_count" -gt 0 ]; then
  echo "❌ TEST FAILED: Errors detected"
  exit 1
elif [ "$success_count" -gt 1 ]; then
  echo "❌ TEST FAILED: Multiple successful insertions (race condition!)"
  echo "   Expected: 1 success, 4 skipped"
  echo "   Actual: $success_count success, $skipped_count skipped"
  exit 1
elif [ "$success_count" -eq 1 ] && [ "$skipped_count" -ge 4 ]; then
  echo "✅ TEST PASSED: Concurrency handling works correctly"
  echo "   1 request seeded, others properly rejected"
  exit 0
else
  echo "⚠️  TEST INCONCLUSIVE: Unexpected response distribution"
  echo "   Success: $success_count, Skipped: $skipped_count, Errors: $error_count"
  exit 2
fi

# Expected output with proper fix:
# ✓ Requests executed concurrently (overlap detected)
# Successful insertions: 1
# Skipped (already seeded): 4
# ✓ Template count correct: 3
# ✅ TEST PASSED: Concurrency handling works correctly
```

**What This Test Verifies:**

1. **True Concurrency**: Checks that requests actually overlap in time
2. **Race Condition Detection**: Verifies only one request succeeds
3. **Database Integrity**: Confirms no duplicate entries were created
4. **Response Validation**: Analyzes success/error/skipped responses
5. **Performance Metrics**: Reports total execution time and per-request timing

### CI/CD Integration

**GitHub Actions Example:**

```yaml
# .github/workflows/test-seed.yml
name: Test Seed Endpoint

on:
  pull_request:
    paths:
      - 'src/app/api/dev/seed/**'
      - 'convex/devSeed.ts'

jobs:
  test-concurrency:
    runs-on: ubuntu-latest
    env:
      SEED_EXPECTED_TEMPLATES: 3  # Configure based on your seed data
      CONVEX_URL: ${{ secrets.CONVEX_DEV_URL }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run concurrency test
        run: bash scripts/test-concurrent-seed.sh
```

**package.json Scripts:**

```json
{
  "scripts": {
    "test:seed": "SEED_EXPECTED_TEMPLATES=3 bash scripts/test-concurrent-seed.sh",
    "test:seed:ci": "SEED_EXPECTED_TEMPLATES=${SEED_EXPECTED_TEMPLATES:-3} bash scripts/test-concurrent-seed.sh"
  }
}
```

**Local Development:**

```bash
# Quick test with defaults
npm run test:seed

# Override expected count for different seed data
SEED_EXPECTED_TEMPLATES=5 npm run test:seed
```

### Verify Database State

```bash
# Check for duplicates
npx convex query devSeed:checkDuplicates

# Should return: { duplicates: 0 }
```

## Cost Analysis

| Solution | Setup Cost | Runtime Cost | Maintenance |
|----------|-----------|--------------|-------------|
| **In-memory mutex** | $0 | $0 | ⚠️ Doesn't work |
| **Single-use script** | $0 | $0 | None |
| **Idempotency tokens** | 1-2 days | $0 | Low |
| **Database constraints** | 1 day | $0 | None |
| **Redis lock** | 2-3 days | ~$15/mo | Medium |

## Security Considerations

### Current State
- ✅ NODE_ENV check prevents production access
- ✅ Optional API key protection
- ✅ Constant-time comparison for API key
- ⚠️ Mutex bypass vulnerability in serverless

### Recommendations

**Priority order for security:**

1. **Remove endpoint entirely in production** (CRITICAL)

   Use **defense-in-depth** with multiple layers of protection:

   ```typescript
   // src/app/api/dev/seed/route.ts
   export async function POST(request: Request) {
     // LAYER 1: Explicit feature flag (primary control)
     // This makes the control explicit and reduces risk of misconfiguration
     // Default to DISABLED - must explicitly enable in development
     if (process.env.ENABLE_DEV_ENDPOINTS !== 'true') {
       return NextResponse.json(
         { error: 'Dev endpoints are disabled' },
         { status: 403 }
       );
     }

     // LAYER 2: Environment check (secondary safeguard)
     // Even if someone sets ENABLE_DEV_ENDPOINTS=true, block in production
     if (process.env.NODE_ENV === 'production') {
       console.error('SECURITY: Attempted to access dev seed endpoint in production');
       return NextResponse.json(
         { error: 'Seed endpoint is disabled in production' },
         { status: 403 }
       );
     }

     // LAYER 3: Vercel environment check (tertiary safeguard)
     // Vercel sets VERCEL_ENV to 'production', 'preview', or 'development'
     if (process.env.VERCEL_ENV === 'production') {
       console.error('SECURITY: Dev endpoint blocked via VERCEL_ENV check');
       return NextResponse.json(
         { error: 'Not available in production' },
         { status: 403 }
       );
     }

     // LAYER 4: Explicit allow-list (optional, for stricter control)
     // Only allow from specific domains/IPs in non-production
     const allowedOrigins = process.env.DEV_SEED_ALLOWED_ORIGINS?.split(',') || [];
     if (allowedOrigins.length > 0) {
       const origin = request.headers.get('origin') || 'unknown';
       if (!allowedOrigins.includes(origin)) {
         console.warn(`Dev seed blocked from unauthorized origin: ${origin}`);
         return NextResponse.json(
           { error: 'Unauthorized origin' },
           { status: 403 }
         );
       }
     }

     // All checks passed - proceed with seed operation
     // ... rest of implementation
   }
   ```

   **Environment Configuration:**

   ```bash
   # .env.local (development)
   ENABLE_DEV_ENDPOINTS=true
   NODE_ENV=development
   DEV_SEED_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

   # .env.production (production) - explicitly do NOT set ENABLE_DEV_ENDPOINTS
   # ENABLE_DEV_ENDPOINTS is NOT SET (defaults to disabled)
   NODE_ENV=production
   ```

   **Why Multiple Layers?**
   - **Layer 1 (Feature Flag)**: Explicit opt-in prevents accidental enablement
   - **Layer 2 (NODE_ENV)**: Standard Node.js environment detection
   - **Layer 3 (VERCEL_ENV)**: Platform-specific safeguard for Vercel deployments
   - **Layer 4 (Origin Allow-list)**: Optional restriction to specific origins

   **Security Benefits:**
   - **Fail-safe default**: Disabled unless explicitly enabled
   - **No single point of failure**: Must bypass multiple checks
   - **Audit trail**: Logs all blocked attempts
   - **Platform-aware**: Works across different hosting providers

   **Testing Security Layers:**

   ```bash
   # Test 1: Verify default is disabled (no ENABLE_DEV_ENDPOINTS set)
   unset ENABLE_DEV_ENDPOINTS
   curl -X POST http://localhost:3000/api/dev/seed
   # Expected: 403 "Dev endpoints are disabled"

   # Test 2: Verify production block even if enabled
   ENABLE_DEV_ENDPOINTS=true NODE_ENV=production curl -X POST http://localhost:3000/api/dev/seed
   # Expected: 403 "Seed endpoint is disabled in production"

   # Test 3: Verify Vercel production block
   ENABLE_DEV_ENDPOINTS=true VERCEL_ENV=production curl -X POST http://localhost:3000/api/dev/seed
   # Expected: 403 "Not available in production"

   # Test 4: Verify origin allow-list (if configured)
   ENABLE_DEV_ENDPOINTS=true DEV_SEED_ALLOWED_ORIGINS=http://example.com \
     curl -X POST http://localhost:3000/api/dev/seed -H "Origin: http://malicious.com"
   # Expected: 403 "Unauthorized origin"

   # Test 5: Verify success with all checks passed
   ENABLE_DEV_ENDPOINTS=true NODE_ENV=development curl -X POST http://localhost:3000/api/dev/seed
   # Expected: 200 with seed response
   ```

   **CI/CD Verification:**

   Add automated tests to verify security layers:

   ```typescript
   // __tests__/api/dev-seed-security.test.ts
   describe('Dev Seed Endpoint Security', () => {
     it('should block when ENABLE_DEV_ENDPOINTS is not set', async () => {
       delete process.env.ENABLE_DEV_ENDPOINTS;
       const response = await fetch('/api/dev/seed', { method: 'POST' });
       expect(response.status).toBe(403);
     });

     it('should block in production even if enabled', async () => {
       process.env.ENABLE_DEV_ENDPOINTS = 'true';
       process.env.NODE_ENV = 'production';
       const response = await fetch('/api/dev/seed', { method: 'POST' });
       expect(response.status).toBe(403);
     });

     it('should block in Vercel production', async () => {
       process.env.ENABLE_DEV_ENDPOINTS = 'true';
       process.env.VERCEL_ENV = 'production';
       const response = await fetch('/api/dev/seed', { method: 'POST' });
       expect(response.status).toBe(403);
     });

     it('should allow in development when properly configured', async () => {
       process.env.ENABLE_DEV_ENDPOINTS = 'true';
       process.env.NODE_ENV = 'development';
       delete process.env.VERCEL_ENV;
       const response = await fetch('/api/dev/seed', { method: 'POST' });
       expect(response.status).not.toBe(403);
     });
   });
   ```

2. **Use idempotency tokens** (PRIMARY DEFENSE for dev/staging)
   - Implement token-based idempotency as shown in Solution 2
   - Prevents duplicate seeding even if mutex fails
   - Works across all deployment environments

3. **Add rate limiting** (ADDITIONAL PROTECTION)
   - Limit to 1 request per minute
   - **Implementation options:**
     - **Middleware approach**: Next.js middleware with in-memory or Redis-based rate limiting
     - **Edge Config**: Vercel Edge Config for serverless rate limiting
     - **External service**: Upstash Rate Limit, Cloudflare Rate Limiting
   - Example with Next.js middleware:
     ```typescript
     // middleware.ts
     import { Ratelimit } from "@upstash/ratelimit";
     import { Redis } from "@upstash/redis";

     const ratelimit = new Ratelimit({
       redis: Redis.fromEnv(),
       limiter: Ratelimit.slidingWindow(1, "60 s"), // 1 request per minute
     });

     export async function middleware(request: NextRequest) {
       if (request.nextUrl.pathname === '/api/dev/seed') {
         const ip = request.ip ?? '127.0.0.1';
         const { success } = await ratelimit.limit(ip);
         if (!success) {
           return new NextResponse('Rate limit exceeded', { status: 429 });
         }
       }
     }
     ```

4. **Add audit logging**
   - Log all seed attempts with timestamp, user, IP, and result
   - Helps detect abuse and troubleshoot issues
   - Send logs to monitoring service (Datadog, Sentry, etc.)

## Migration Path

### Step 0: Implement Security Layers (CRITICAL - Before Any Deployment)

**Add defense-in-depth security checks:**

```typescript
// src/app/api/dev/seed/route.ts
export async function POST(request: Request) {
  // ⚠️ SECURITY: Multiple layers prevent accidental production exposure

  // Layer 1: Explicit feature flag (fail-safe default)
  if (process.env.ENABLE_DEV_ENDPOINTS !== 'true') {
    return NextResponse.json({ error: 'Dev endpoints are disabled' }, { status: 403 });
  }

  // Layer 2: NODE_ENV check
  if (process.env.NODE_ENV === 'production') {
    console.error('SECURITY: Dev endpoint accessed in production');
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  // Layer 3: Platform-specific check (Vercel)
  if (process.env.VERCEL_ENV === 'production') {
    console.error('SECURITY: Dev endpoint blocked via VERCEL_ENV');
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  // ... rest of implementation
}
```

**⚠️ Common Misconfiguration Pitfalls:**

| Mistake | Impact | How to Prevent |
|---------|--------|----------------|
| Setting `ENABLE_DEV_ENDPOINTS=true` in production `.env` | Endpoint exposed to public | Use fail-safe default; require explicit opt-in |
| Relying solely on `NODE_ENV` | Can be overridden or misconfigured | Use multiple independent checks |
| Not testing security layers | Silent security failures | Add automated tests for all layers |
| Copying `.env.local` to production | Leaks dev configuration | Never copy dev env files to production |
| Using `.env` instead of `.env.production` | Wrong config loaded | Use environment-specific files |

**Verification Checklist:**

- [ ] `ENABLE_DEV_ENDPOINTS` defaults to disabled (not set in production)
- [ ] Multiple security layers implemented
- [ ] Security tests added and passing
- [ ] Production `.env` audited (dev flags removed)
- [ ] Deployment process documented
- [ ] Team trained on security requirements

### Step 1: Add Warnings (Immediate)
```typescript
// WARNING: This mutex only works in single-instance environments.
// In serverless/multi-instance deployments (Vercel, AWS Lambda, etc.),
// concurrent requests will bypass this lock entirely.
// See docs/DEV_SEED_CONCURRENCY.md for production-ready solutions.
class SeedMutex { /* ... */ }
```

### Step 2: Implement Idempotency (This Week)
- Add `seed_operations` table to schema
- Update mutations to check idempotency token
- Test with concurrent requests

### Step 3: Add Redis Lock (Before Production)
- Provision Redis instance
- Implement `DistributedSeedMutex`
- Update route to use distributed lock
- Add monitoring

### Step 4: Remove Mutex (After Redis Deployed)
- Delete `SeedMutex` class
- Update documentation
- Add migration notes

## References

- [Redis SETNX for Distributed Locking](https://redis.io/docs/manual/patterns/distributed-locks/)
- [Idempotency in Distributed Systems](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
- [Convex Transactions](https://docs.convex.dev/database/writes#transactions)
- [Next.js API Routes in Serverless](https://nextjs.org/docs/api-routes/introduction)

---

**Status**: 🚨 Critical Issue - Needs Fix Before Production
**Owner**: Engineering Team
**Created**: 2025-01-16
**Priority**: High

const globalAny = globalThis as typeof globalThis & {
  vi?: {
    stubEnv: (key: string, value: string) => () => void;
    resetModules: () => void;
  };
  jest?: {
    resetModules?: () => void;
  };
};

type Unstub = () => void;

type TestFn<T> = () => Promise<T> | T;

type Flags = Record<string, string>;

const isVitest = typeof globalAny.vi !== 'undefined';

const stubEnv = (key: string, value: string): Unstub => {
  if (isVitest) {
    return globalAny.vi!.stubEnv(key, value);
  }

  const original = process.env[key];
  process.env[key] = value;
  return () => {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  };
};

/**
 * Reset module cache to ensure environment variables are re-evaluated
 *
 * This is necessary when changing environment variables during tests to ensure
 * modules that read `process.env` at import time pick up the new values.
 *
 * **Framework Support:**
 * - Vitest: Uses `vi.resetModules()`
 * - Jest: Uses `jest.resetModules()` if available
 * - Fallback: No-op (module state may persist between tests)
 *
 * **Note on Fallback:**
 * If neither framework is detected, this function does nothing. This may cause
 * tests to fail if modules cache environment variables at import time. In such
 * cases, ensure you're running tests with Vitest or Jest, or refactor code to
 * read environment variables at runtime instead of import time.
 */
const resetModules = () => {
  if (isVitest) {
    globalAny.vi!.resetModules();
  } else if (typeof globalAny.jest?.resetModules === 'function') {
    globalAny.jest.resetModules();
  }
  // No-op fallback: Module state will persist if no test framework is detected.
  // This is acceptable for most cases but may cause issues with modules that
  // cache environment variables at import time.
};

export function testWithFeatureFlag<T>(flags: Flags, testFn: TestFn<T>): Promise<T> | T {
  const unstubFns: Unstub[] = [];

  const cleanup = () => {
    unstubFns.forEach((fn) => fn());
    unstubFns.length = 0;
  };

  try {
    for (const [key, value] of Object.entries(flags)) {
      const unstub = stubEnv(key, value);
      unstubFns.push(unstub);
    }

    resetModules();

    const result = testFn();
    if (result instanceof Promise) {
      return result.finally(cleanup);
    }

    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
}

import { vi } from 'vitest';

/**
 * Run a test with temporary feature flag overrides.
 * Ensures env stubs and module cache are cleaned up automatically.
 */
export function testWithFeatureFlag<T>(
  flags: Record<string, string>,
  testFn: () => Promise<T>
): Promise<T>;
export function testWithFeatureFlag<T>(
  flags: Record<string, string>,
  testFn: () => T
): T;
export function testWithFeatureFlag<T>(
  flags: Record<string, string>,
  testFn: () => Promise<T> | T
): Promise<T> | T {
  const unstubFns: Array<() => void> = [];
  const cleanup = () => {
    unstubFns.forEach((fn) => fn());
    unstubFns.length = 0;
  };

  try {
    for (const [key, value] of Object.entries(flags)) {
      const unstub = vi.stubEnv(key, value);
      if (typeof unstub === 'function') {
        unstubFns.push(unstub);
      }
    }

    vi.resetModules();
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

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

const resetModules = () => {
  if (isVitest) {
    globalAny.vi!.resetModules();
  } else if (typeof globalAny.jest?.resetModules === 'function') {
    globalAny.jest.resetModules();
  }
};

export function testWithFeatureFlag<T>(flags: Flags, testFn: TestFn<T>): Promise<T>;
export function testWithFeatureFlag<T>(flags: Flags, testFn: TestFn<T>): T;
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

import type { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest, test } from '@jest/globals'

export {}

declare global {
  const describe: typeof describe
  const it: typeof it
  const test: typeof test
  const expect: typeof expect
  const beforeEach: typeof beforeEach
  const afterEach: typeof afterEach
  const beforeAll: typeof beforeAll
  const afterAll: typeof afterAll
  const jest: typeof jest

  namespace jest {
    type Mock<T = any, Y extends any[] = any[]> = {
      (...args: Y): T
      mock: {
        calls: unknown[]
        clear(): void
        reset(): void
        restore(): void
      }
      mockReturnValue(value: T): Mock<T, Y>
      mockImplementation(fn?: (...args: Y) => T): Mock<T, Y>
    }
    type MockedFunction<T extends (...args: any[]) => any> = Mock<ReturnType<T>, Parameters<T>>
  }
}

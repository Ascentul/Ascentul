import type {
  afterAll as JestAfterAll,
  afterEach as JestAfterEach,
  beforeAll as JestBeforeAll,
  beforeEach as JestBeforeEach,
  describe as JestDescribe,
  expect as JestExpect,
  it as JestIt,
  jest as JestJest,
  test as JestTest,
} from '@jest/globals'

export {}

declare global {
  const describe: typeof JestDescribe
  const it: typeof JestIt
  const test: typeof JestTest
  const expect: typeof JestExpect
  const beforeEach: typeof JestBeforeEach
  const afterEach: typeof JestAfterEach
  const beforeAll: typeof JestBeforeAll
  const afterAll: typeof JestAfterAll
  const jest: typeof JestJest


}

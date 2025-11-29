const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/convex/__tests_disabled__/',
    '/convex/.*\\.test\\.ts$'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^convex/react$': '<rootDir>/__mocks__/convex-react.js',
    '^convex/_generated/(.*)$': '<rootDir>/__mocks__/convex-generated.js',
    '^.+/convex/react$': '<rootDir>/__mocks__/convex-react.js',
    '^.+/convex/_generated/(.*)$': '<rootDir>/__mocks__/convex-generated.js',
    '^convex/browser$': '<rootDir>/__mocks__/convex-browser.js',
    '^.+/convex/browser$': '<rootDir>/__mocks__/convex-browser.js',
    '^convex/nextjs$': '<rootDir>/__mocks__/convex/nextjs.js',
    '^\\.\\./\\.\\./convex/nextjs$': '<rootDir>/__mocks__/convex/nextjs.js',
    '^@/contexts/ImpersonationContext$': '<rootDir>/__mocks__/contexts/ImpersonationContext.tsx',
    '^@/hooks/use-toast$': '<rootDir>/__mocks__/use-toast.js',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/components/ui/**', // Exclude UI components from coverage
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

// jest.config.js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'domain/**/*.ts',
    'lib/api/**/*.ts',
    'application/**/*.ts',
    '!**/*.d.ts',
  ],
  coverageReporters: ['text', 'lcov'],
}

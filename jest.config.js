module.exports = {
    preset: 'ts-jest',
    setupFiles: ['<rootDir>/scripts/jestSetUp'],
    testMatch: [`<rootDir>/src/**/*.test.ts`],
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
}

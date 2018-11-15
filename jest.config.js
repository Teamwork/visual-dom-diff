module.exports = {
    preset: 'ts-jest',
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.test.{ts,tsx,js,jsx}'
    ]
}

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/main.ts',
    'src/app.module.ts',
    'src/database/**/*.(t|j)s',
    'src/common/**/*.(t|j)s',
    'src/modules/health/**/*.(t|j)s',
    'src/modules/marketplace/**/*.(t|j)s',
    'src/modules/store/**/*.(t|j)s',
    'src/modules/users/**/*.(t|j)s',
    'src/modules/orders/**/*.(t|j)s',
    'src/modules/drivers/**/*.(t|j)s',
    'src/modules/coupons/**/*.(t|j)s',
    'src/modules/payouts/**/*.(t|j)s',
    'src/modules/deliveries/**/*.(t|j)s',
    'src/modules/auctions/**/*.(t|j)s',
    'src/modules/loyalty/**/*.(t|j)s',
    'src/modules/payments/**/*.(t|j)s',
    'src/modules/maps/**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testPathIgnorePatterns: [
    '/node_modules/',
    // Specs e2e (test/e2e/*.e2e-spec.ts) rodam via `test:e2e`
    // (test/jest-e2e.json), contra um Postgres real — nao aqui, que
    // roda os unitarios com Prisma mockado.
    '<rootDir>/test/e2e',
  ],
};

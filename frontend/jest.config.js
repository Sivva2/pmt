module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@angular/core$': '<rootDir>/src/__mocks__/angular-core.ts',
    '^@angular/common/http$': '<rootDir>/src/__mocks__/angular-http.ts',
    '^.*environments/environment$': '<rootDir>/src/__mocks__/environment.ts'
  },
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { target: 'es2022', module: 'commonjs', esModuleInterop: true, experimentalDecorators: true, emitDecoratorMetadata: true } }]
  },
  collectCoverageFrom: [
    'src/app/core/services/**/*.ts',
    '!src/app/**/*.module.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
};
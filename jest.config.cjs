/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',

  // 👇 Use ts-jest via transform instead of globals
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts'],

  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/src/__tests__/fileMock.ts',
  },

  // only *.test.ts / *.test.tsx are tests
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],

  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@core/(.*)$": "<rootDir>/src/core/$1",
    "^@/core$": "<rootDir>/src/__tests__/mocks/hooks.ts",
    "^@core$": "<rootDir>/src/__tests__/mocks/hooks.ts"
  },
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ['babel-jest', { presets: ['next/babel'] }]
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@starknet-react|starknet|get-starknet|@starknet-react/chains|eventemitter3)/)"
  ],
  moduleDirectories: ["node_modules", "<rootDir>"],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};

export default config;

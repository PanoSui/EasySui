module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  testTimeout: 1000000,
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: false }],
  },
};

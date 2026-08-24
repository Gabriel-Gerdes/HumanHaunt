module.exports = {
  preset: '@react-native/jest-preset',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
};

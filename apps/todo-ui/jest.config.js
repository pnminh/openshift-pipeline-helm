module.exports = {
  // Indicates which environment to use for testing
  testEnvironment: 'jsdom',
  // The glob patterns Jest uses to detect test files
  testMatch: ['<rootDir>/src/**/*.test.js'],
  // Transform files before running tests
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  // Directories that Jest should use to search for files
  roots: ['<rootDir>/src'],
  // Setup files before Jest runs tests
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect']
};
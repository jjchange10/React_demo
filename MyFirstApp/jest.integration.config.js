module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '<rootDir>/jest.integration.setup.js'
  ],
  testMatch: [
    '**/__tests__/integration/**/*.(test|spec).(ts|tsx|js)',
    '**/__tests__/e2e/**/*.(test|spec).(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/__tests__/services/',
    '<rootDir>/__tests__/types/'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          'module:@react-native/babel-preset'
        ]
      }
    ]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-vector-icons|expo-haptics|expo-sqlite|expo-image-picker|expo-file-system)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'context/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  testEnvironment: 'node',
  displayName: 'Integration & E2E Tests',
  testTimeout: 30000, // 30 seconds for integration tests
  slowTestThreshold: 10000 // 10 seconds
};
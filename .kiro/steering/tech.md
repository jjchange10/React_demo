# Technology Stack

## Framework & Platform
- **React Native** with **Expo SDK 53** for cross-platform mobile development
- **Expo Router** for file-based navigation
- **TypeScript** for type safety and better development experience
- Supports iOS, Android, and Web platforms

## Key Dependencies
- **expo-sqlite** - Local database storage
- **expo-image-picker** - Photo capture functionality
- **@react-native-async-storage/async-storage** - Key-value storage
- **expo-file-system** - File system operations
- **React Navigation** - Navigation components and utilities

## Development Tools
- **ESLint** with Expo config for code linting
- **Jest** with React Native Testing Library for unit testing
- **TypeScript** compiler with strict mode enabled
- **Babel** with React Native preset for transpilation

## Common Commands

### Development
```bash
# Start development server
npm start
# or
expo start

# Run on specific platforms
npm run ios
npm run android
npm run web
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Quality
```bash
# Lint code
npm run lint

# Reset project (clean slate)
npm run reset-project
```

## Build Configuration
- Uses Metro bundler for JavaScript bundling
- Supports new React Native architecture (newArchEnabled: true)
- Web builds use static output for deployment
- TypeScript paths configured with `@/*` alias for project root
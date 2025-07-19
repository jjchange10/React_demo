# Wine & Sake Tracker App

A React Native app for recording and managing wine and sake consumption with intelligent recommendations.

## Project Overview

This is a React Native + Expo Router application that allows users to:
- Record wines and sake with detailed information (name, region, rating, photos, etc.)
- View records categorized by type
- Get personalized recommendations based on past ratings
- Edit and delete records
- Add photos to records

## Tech Stack

- **Framework**: React Native 0.79.5 + Expo SDK 53
- **Routing**: Expo Router v5 (file-based routing)
- **State Management**: React Context + useReducer
- **Database**: Expo SQLite for structured data
- **Storage**: AsyncStorage for settings
- **Images**: Expo Image Picker + FileSystem
- **Language**: TypeScript
- **Testing**: Jest + React Native Testing Library

## Development Commands

```bash
# Start development server
npm start

# Run on specific platforms
npm run ios
npm run android
npm run web

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Linting
npm run lint

# Reset project (development utility)
npm run reset-project
```

## Project Structure

```
MyFirstApp/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home (recommendations)
│   │   ├── records.tsx    # Records list
│   │   └── add.tsx        # Add new record
│   ├── sake/              # Sake detail screens
│   ├── wine/              # Wine detail screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── wine/             # Wine-specific components
│   ├── sake/             # Sake-specific components
│   └── common/           # Shared components
├── services/             # Business logic & data access
├── types/                # TypeScript type definitions
├── context/              # React Context providers
└── __tests__/           # Test files
```

## Key Features Implemented

- ✅ Wine and sake recording with photos
- ✅ SQLite database with proper schema
- ✅ Rating system (1-5 stars)
- ✅ Recommendation engine based on user preferences
- ✅ Image picker and storage
- ✅ CRUD operations for all records
- ✅ Tab navigation and detailed screens
- ✅ Form validation and error handling
- ✅ Context-based state management
- ✅ Unit tests for core functionality

## Database Schema

**wines table**: id, name, region, grape, vintage, rating, notes, photo_uri, created_at, updated_at
**sakes table**: id, name, brewery, type, region, rating, notes, photo_uri, created_at, updated_at

## Development Notes

- Uses Expo managed workflow for cross-platform development
- Local-first approach with SQLite for offline functionality
- Designed for future backend API integration
- Japanese text support for sake-specific fields
- Comprehensive test coverage for services and components
- Error handling with user-friendly toast notifications

## Specifications

Detailed requirements, design documents, and implementation tasks are available in `.kiro/specs/wine-sake-tracker/`.


# ルール
あなたが、開発をするときのルールを記載します。
- ユーザからの質問については"日本語"で回答をしてください

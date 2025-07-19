# Project Structure

## Root Directory Layout
```
MyFirstApp/
├── app/                    # Expo Router pages (file-based routing)
├── components/             # Reusable UI components
├── services/              # Business logic and data access
├── types/                 # TypeScript type definitions
├── context/               # React Context providers
├── hooks/                 # Custom React hooks
├── constants/             # App constants and configuration
├── assets/                # Static assets (images, fonts)
├── __tests__/             # Test files
└── scripts/               # Build and utility scripts
```

## Key Directories

### `/app` - File-based Routing
- `(tabs)/` - Tab-based navigation screens
- `sake/` - Sake-related screens with dynamic routes
- `wine/` - Wine-related screens with dynamic routes
- Uses Expo Router conventions for nested layouts and dynamic routes

### `/components` - Component Organization
- `common/` - Shared components (LoadingIndicator, PhotoPicker, etc.)
- `sake/` - Sake-specific components (SakeCard, SakeForm, SakeList)
- `wine/` - Wine-specific components (WineCard, WineForm, WineList)
- `ui/` - Platform-specific UI components

### `/services` - Business Logic Layer
- Database services with platform-specific implementations
- Validation and error handling utilities
- Recommendation engine
- Storage and file system abstractions
- Toast notifications and user feedback

### `/types` - Type Definitions
- Domain models (Wine, Sake) with validation functions
- Common interfaces and base types
- Form data types and CRUD operation interfaces

## Architecture Patterns

### Service Layer Pattern
- All business logic encapsulated in service classes
- Database operations abstracted through service interfaces
- Platform-specific implementations (`.web.ts` files for web platform)

### Context + Reducer Pattern
- `RecordsContext` manages global state for wines and sake
- Reducer pattern for predictable state updates
- Centralized error handling and loading states

### Component Composition
- Atomic design principles with reusable components
- Platform-specific component variants (`.ios.tsx`, `.tsx`)
- Form components with built-in validation

## File Naming Conventions
- React components: PascalCase (e.g., `WineCard.tsx`)
- Services: camelCase (e.g., `wineService.ts`)
- Types: camelCase (e.g., `wine.ts`)
- Tests: `*.test.ts` or `*.test.tsx`
- Platform-specific: `*.ios.tsx`, `*.web.ts`

## Import Patterns
- Use TypeScript path mapping with `@/*` alias
- Relative imports for local files
- Barrel exports from type directories
- Service imports through singleton instances
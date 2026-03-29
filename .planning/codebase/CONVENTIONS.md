# Coding Conventions

**Analysis Date:** 2026-03-28

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` (e.g., `src/components/LessonQuiz.tsx`, `src/design/components/Button.tsx`)
- Hooks: camelCase with `use` prefix `.ts` (e.g., `src/hooks/useProgress.ts`, `src/hooks/useMastery.ts`)
- Engine logic: camelCase `.js` (e.g., `src/engine/mastery.js`, `src/engine/outcome.js`)
- Engine logic (newer): camelCase `.ts` (e.g., `src/engine/progress.ts`, `src/engine/habit.ts`)
- Data files: camelCase `.js` (e.g., `src/data/letters.js`, `src/data/lessons.js`)
- Type files: camelCase `.ts` (e.g., `src/types/quiz.ts`, `src/types/lesson.ts`)
- Test files: camelCase `.test.js` or `.test.ts` (e.g., `src/__tests__/mastery.test.js`)
- Config files: camelCase (e.g., `vitest.config.ts`, `eslint.config.js`, `app.config.ts`)

**Functions:**
- Use camelCase for all functions: `normalizeEntityKey`, `generateRecognitionQs`, `mapQuizResultsToAttempts`
- React components use PascalCase function names: `function Button()`, `function LessonQuiz()`
- Hooks: `useProgress`, `useMastery`, `useHabit`, `useLessonQuiz`, `useColors`, `useTheme`
- Boolean getters/checkers: `isLessonUnlocked`, `isPhase4Unlocked`
- Factory/builder functions: `buildReviewLessonPayload`, `buildFallbackQuestion`, `buildLegacyProgressView`

**Variables:**
- Use camelCase: `lessonId`, `completedLessonIds`, `currentWird`
- Constants: UPPER_SNAKE_CASE for module-level constants: `MASTERY_MIN_ATTEMPTS`, `MASTERY_ACCURACY_THRESHOLD`, `SCHEMA_VERSION`, `ERROR_CATEGORIES`
- Data arrays: UPPER_SNAKE_CASE: `ARABIC_LETTERS`, `LESSONS`, `CONNECTED_FORMS`

**Types:**
- Interfaces: PascalCase with descriptive suffix: `QuizResultItem`, `QuestionAttempt`, `EntityState`, `ButtonProps`
- Type aliases: PascalCase: `ButtonVariant`, `ThemeMode`, `ColorTokens`, `EventName`
- Props interfaces: `{ComponentName}Props` pattern: `ButtonProps`, `LessonQuizProps`, `LessonGridProps`

## Code Style

**Formatting:**
- No Prettier config detected. Formatting is enforced via ESLint only.
- Indentation: 2 spaces
- Semicolons: used consistently
- Quotes: double quotes in imports and JSX, single quotes in some inline strings (inconsistent)
- Trailing commas: used in multi-line constructs

**Linting:**
- ESLint 9 with flat config at `eslint.config.js`
- Uses `eslint-config-expo/flat` as the base config
- Only custom rule: `dist/*` is ignored
- Run via `npx expo lint` or `npm run lint`

**TypeScript:**
- Strict mode enabled in `tsconfig.json`
- Extends `expo/tsconfig.base`
- Path alias: `@/*` maps to project root
- However: `@/` alias is NOT widely used in practice. Most imports use relative paths: `../../src/design/theme`, `../engine/mastery.js`
- Engine files are a mix of `.js` (older, ported from webapp) and `.ts` (newer)

## Import Organization

**Order (observed pattern):**
1. React / React Native core (`react`, `react-native`, `react-native-reanimated`)
2. Expo packages (`expo-router`, `expo-haptics`, `expo-sqlite`)
3. Third-party packages (`posthog-react-native`)
4. Internal design system (`../design/theme`, `../design/tokens`, `../design/components`)
5. Internal data/engine (`../data/letters`, `../engine/mastery`)
6. Internal hooks (`../hooks/useProgress`)
7. Internal components (`./quiz/QuizProgress`)
8. Type-only imports last (`type { Lesson }`)

**Path style:**
- Relative paths with explicit extensions for `.js` engine files: `../engine/mastery.js`
- Relative paths without extensions for `.ts`/`.tsx` files: `../hooks/useProgress`
- App routes import from `src/` using `../../src/` relative paths (no `@/` alias in practice)

**Barrel files:**
- `src/design/components/index.ts` — exports all design components
- `src/engine/index.ts` — empty barrel (placeholder)
- `src/design/index.ts` — empty barrel (placeholder)

## Error Handling

**Patterns:**
- Engine functions accept `null`/`undefined` gracefully and return safe defaults (empty arrays, empty objects, `null`)
- Database operations use try/catch for migrations where columns may already exist (`src/db/client.ts`)
- Analytics init wraps each service in try/catch to prevent crash on init failure (`src/analytics/index.ts`)
- Context hooks throw descriptive errors when used outside providers: `throw new Error("useDatabase must be used within DatabaseProvider")` (`src/db/provider.tsx`)
- No global error boundary detected in the React tree

**Null safety:**
- Heavy use of nullish coalescing (`??`) and optional chaining (`?.`)
- State initialized as `null` with explicit loading states: `useState<ProgressState | null>(null)`

## Logging

**Framework:** `console.warn` for non-fatal issues
- No structured logging framework
- `console.warn` used for analytics init failures: `console.warn('PostHog init failed:', e)` (`src/analytics/index.ts`)

## Comments

**When to comment:**
- JSDoc-style `/** */` comments on exported engine functions explaining purpose and rules (`src/engine/mastery.js`)
- Section headers using `// ── Section Name ──` pattern throughout engine and test files
- File-level doc comments explaining the module's role at the top of files (`src/engine/progress.ts`, `src/db/schema.ts`)
- Inline comments for non-obvious behavior: `// Columns may already exist if DB was created fresh with v2 schema`

**JSDoc usage:**
- Used on engine functions in `.js` files to document parameters and return types informally
- Not used in `.tsx` component files — prop types serve as documentation via TypeScript interfaces

## Function Design

**Size:**
- Hooks are small (20-60 lines), single-purpose: `src/hooks/useMastery.ts` (37 lines), `src/hooks/useProgress.ts` (65 lines)
- Engine functions are pure and focused — one function per concern
- Components are larger (100-300+ lines) — screens like `app/lesson/[id].tsx` contain significant logic

**Parameters:**
- Engine functions accept plain objects, not React-specific types
- Callbacks wrapped in `useCallback` with explicit dependency arrays in hooks
- Props interfaces defined adjacent to component, not in separate type files

**Return values:**
- Hooks return object spread: `return { ...state, loading, completeLesson, updateProfile, refresh }`
- Engine functions return plain objects or arrays
- No Result/Either pattern — errors return `null` or safe defaults

## Module Design

**Exports:**
- Named exports everywhere: `export function`, `export interface`, `export const`
- Default exports ONLY for Expo Router screen components: `export default function LessonScreen()` (`app/lesson/[id].tsx`)
- No default exports in `src/` utility/component files

**Component pattern:**
- Functional components with hooks, no class components
- Design system components: function + StyleSheet.create at bottom of file (`src/design/components/Button.tsx`)
- Feature components: same pattern, props interface defined inline above component

**State management:**
- No Redux/Zustand — all persistent state in SQLite via hooks
- React Context for cross-cutting concerns only: `ThemeContext` (`src/design/theme.ts`), `DatabaseContext` (`src/db/provider.tsx`)
- Local component state via `useState` / `useRef`

## Design System Usage

**Colors:** Always access via `useColors()` hook, never hardcode color values in components
```typescript
const colors = useColors();
// Use colors.primary, colors.accent, colors.bg, etc.
```

**Typography:** Import from tokens, apply via style objects
```typescript
import { typography, spacing } from "../design/tokens";
// Use typography.arabicDisplay, spacing.md, etc.
```

**Shared components:** Import from barrel file
```typescript
import { Button, ArabicText, Card } from "../design/components";
```

## Language Split

- **TypeScript (`.ts`/`.tsx`):** All React components, hooks, types, DB layer, analytics
- **JavaScript (`.js`):** Engine logic (mastery, questions, selectors, engagement, outcome, dateUtils, features) — ported from original webapp, not yet migrated to TS
- When adding new engine logic, prefer `.ts`. When modifying existing `.js` engine files, keep as `.js` unless doing a dedicated migration.

---

*Convention analysis: 2026-03-28*

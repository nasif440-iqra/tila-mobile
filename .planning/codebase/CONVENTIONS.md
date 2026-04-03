# Coding Conventions

**Analysis Date:** 2026-04-03

## Naming Patterns

**Files:**
- React/TSX components use PascalCase: `QuizQuestion.tsx`, `Button.tsx`, `LetterPrompt`
- Utility/service files use camelCase: `useProgress.ts`, `mastery.ts`, `provider.tsx`
- Test files: `*.test.ts`, `*.test.js` (co-located in `src/__tests__/`)
- Hooks use `use` prefix: `useProgress`, `useLessonQuiz`, `useMastery`, `useHabit`
- Directory names: kebab-case or camelCase depending on domain (e.g., `src/engine/questions/`, `src/design/components/`)

**Functions:**
- Exported pure functions: camelCase (e.g., `normalizeEntityKey`, `recordEntityAttempt`)
- React component functions: PascalCase
- Internal/private functions: camelCase prefixed with lowercase or using `handle`/`get` convention (e.g., `handlePressIn`, `getVariantStyles`)
- Event handlers: `handle` prefix (e.g., `handlePress`, `handleSignInWithEmail`)
- Selector functions: `get` prefix (e.g., `getDueEntityKeys`, `getWeakEntityKeys`)

**Variables:**
- Constants: SCREAMING_SNAKE_CASE (e.g., `MASTERY_MIN_ATTEMPTS`, `OPTIONS_MAX_WIDTH`, `ROW_PITCH`)
- State variables: camelCase (e.g., `authState`, `loading`, `selectedId`)
- React state setters: `set` + PascalCase (e.g., `setAuthState`, `setLoading`)
- Animated values: descriptive camelCase (e.g., `opacity`, `translateY`, `scale`)

**Types:**
- TypeScript interfaces/types: PascalCase (e.g., `ButtonProps`, `AuthState`, `EntityState`)
- Type unions/discriminated types: PascalCase (e.g., `ButtonVariant = "primary" | "secondary"`)
- Generic types: uppercase single letters (e.g., `T`, `K`, `V`)
- Entity key format: descriptive lowercase with colon separator (e.g., `letter:2`, `combo:ba-fatha`, `recognition:2->3`)

## Code Style

**Formatting:**
- ESLint with Expo flat config (`eslint-config-expo`) enforces rules
- No dedicated Prettier config; ESLint handles formatting
- Imports organized in groups with spacing (React/dependencies → relative imports)
- 2-space indentation (inferred from component files)

**Linting:**
- Run with: `npm run lint` (invokes `expo lint`)
- Typecheck with: `tsc --noEmit` or `npm run typecheck`
- Validate all: `npm run validate` (runs both lint and typecheck)

**Line width:** No explicit limit observed; pragmatic wrapping in components

## Import Organization

**Order:**
1. React and React Native imports (`import { useState } from "react"`, `import { View, Text } from "react-native"`)
2. Third-party libraries (Reanimated, SVG, Expo modules, external SDKs)
3. Relative project imports (design system, utilities, data, hooks)
4. Local/component-scoped imports

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Used in imports for absolute paths: `import { useDatabase } from "@/src/db/provider"`
- Prefer descriptive relative imports when in same domain (e.g., within `src/engine/`, use relative)

**Import style:**
- Named imports preferred: `import { normalizeEntityKey } from "../engine/mastery"`
- Default imports for components/providers: `import Animated from "react-native-reanimated"`
- Destructured imports from barrels: `import { QuizOption, ArabicText, HearButton } from "../../design/components"`

## Error Handling

**Patterns:**
- Try/catch for async operations returning `{ error: Error | null }` (see `src/auth/provider.tsx`)
- Guard clauses before operations: `if (error) return { error };`
- Error type narrowing: `err instanceof Error ? err : new Error(String(err))`
- Async operations include rejection handling: `.catch()` clauses where needed
- No unhandled promise rejections; all async operations wrapped or caught
- Database operations use transaction guards: `db.withExclusiveTransactionAsync()`
- Error recovery uses explicit state machines (loading → error → ready)

**Exception patterns:**
```typescript
// From src/auth/provider.tsx
try {
  const { error } = await emailSignIn(email, password);
  if (error) return { error };
  track('auth_sign_in', { method: 'email' });
  return { error: null };
} catch (err) {
  return { error: err instanceof Error ? err : new Error(String(err)) };
}
```

## Logging

**Framework:** No dedicated logging library; uses `console` for development

**Patterns:**
- Console used minimally; critical errors passed to Sentry (`@sentry/react-native`)
- Analytics events tracked via PostHog (`posthog-react-native`)
- Sentry configured for error capture: `captureException()`, `captureMessage()`, `addBreadcrumb()`
- No verbose console output in production code

## Comments

**When to Comment:**
- Complex algorithms with multiple branches or state transitions
- "Section dividers" using `// ──` pattern for visual organization (common in components)
- JSDoc for exported public functions and hooks (observe selectively used)

**JSDoc/TSDoc:**
- Not universally applied; used for complex functions and mastery-related logic
- Example from `src/engine/mastery.ts`:
  ```typescript
  /**
   * Derive a stable entity key from a quiz result's targetId and question context.
   * Rules:
   *  - If question.isHarakat and targetId is a string like "ba-fatha" → "combo:ba-fatha"
   */
  export function normalizeEntityKey(targetId: string | number, question?: ...): string
  ```

**Comment style:**
- Single-line comments for explanations: `// Only run entrance on question change, not on answer-state changes`
- Section dividers for readability: `// ── Staggered option wrapper ──`
- Avoid redundant comments; code should be self-explanatory

## Function Design

**Size:** Functions kept under 100 lines; long operations broken into helpers

**Parameters:**
- Prefer object destructuring for multiple parameters (component props)
- Single/double parameters acceptable for utility functions
- Optional parameters marked with `?`: `onRetry?: () => void`
- Callbacks use explicit types: `(id: number) => void`

**Return Values:**
- Async functions return `Promise<T>` with explicit type annotation
- Pure functions return typed values matching signature
- Hooks return tuples or objects: `[state, setState]` or `{ state, actions }`
- Error-handling functions return result objects: `{ error: Error | null, data?: T }`

**Examples:**
```typescript
// Hook return structure
export function useProgress() {
  const [state, setState] = useState<ProgressState | null>(null);
  const [loading, setLoading] = useState(true);
  
  const completeLesson = useCallback(async (...) => {
    // ...
    return { attemptId, updatedMastery };
  }, [dependencies]);
  
  return { state, loading, completeLesson };
}

// Utility function with clear return type
export function recordEntityAttempt(
  entry: EntityStateWithLatency | null,
  result: AttemptResult,
  today: string
): EntityStateWithLatency { ... }
```

## Module Design

**Exports:**
- Named exports preferred for functions and types: `export function normalizeEntityKey(...) { }`
- Default exports used for components: `export default function Button(...) { }`
- Single barrel export per domain: `src/design/components/index.ts` re-exports all design components

**Barrel Files:**
- Used selectively: `src/design/components/index.ts` exports `{ Button, Card, ArabicText, QuizOption, HearButton, WarmGradient }`
- Enables cleaner imports: `import { Button } from "@/src/design/components"`
- Not over-used in engine/questions; imports use relative paths for clarity

**Module cohesion:**
- Each module has single responsibility (mastery logic, audio player, auth provider)
- Pure functions (`engine/*`) have no React or platform dependencies
- Hooks bridge UI and engine: load from DB → call engine logic → save results

## TypeScript-Specific

**Type safety:**
- Strict mode enabled: `"strict": true` in `tsconfig.json`
- Explicit return types on exported functions (not always enforced in components)
- Interfaces for component props: `interface QuizQuestionProps { ... }`
- Type narrowing used for discriminated unions (mastery states, auth events)

**Any avoidance:**
- Props typed with `any` (e.g., `question: any` in components) flagged for improvement
- Gradual typing applied; pure functions fully typed, components more permissive

---

*Convention analysis: 2026-04-03*

# Technology Stack

**Analysis Date:** 2026-03-28

## Languages

**Primary:**
- TypeScript 5.9.2 - All application code (`src/`, `app/`)
- Strict mode enabled via `tsconfig.json` (`"strict": true`)
- Extends `expo/tsconfig.base`

**Secondary:**
- JavaScript - Config files (`metro.config.js`, `eslint.config.js`)

## Runtime

**Environment:**
- React Native 0.83.2 (New Architecture enabled via `newArchEnabled: true` in `app.config.ts`)
- Expo SDK 55 (managed workflow with EAS Build for native compilation)
- React 19.2.0

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Expo ~55.0.8 - Application framework, managed workflow
- React Native 0.83.2 - Mobile runtime
- Expo Router ~55.0.7 - File-based routing (`app/` directory)
- React Navigation 7.1.33 - Navigation primitives (used by Expo Router)

**Testing:**
- Vitest 4.1.2 - Unit test runner
- Config: `vitest.config.ts`
- Test pattern: `src/__tests__/**/*.test.{js,ts}`

**Build/Dev:**
- Metro bundler (configured via `metro.config.js`, wrapped with Sentry)
- EAS Build (cloud builds, config in `eas.json`)
- EAS CLI >= 15.0.0 required

**Linting:**
- ESLint 9 with flat config (`eslint.config.js`)
- Uses `eslint-config-expo/flat`

## Key Dependencies

**Critical (core app functionality):**

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-sqlite` | ~55.0.11 | Local SQLite database - all persistent state |
| `expo-router` | ~55.0.7 | File-based routing |
| `react-native-reanimated` | 4.2.1 | Animations and transitions |
| `react-native-screens` | ~4.23.0 | Native screen management |
| `react-native-safe-area-context` | ~5.6.2 | Safe area insets |

**Analytics & Monitoring:**

| Package | Version | Purpose |
|---------|---------|---------|
| `posthog-react-native` | ^4.39.0 | Product analytics and event tracking |
| `@sentry/react-native` | ~7.11.0 | Error tracking and crash reporting |

**UI & Media:**

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-font` | ~55.0.4 | Custom font loading |
| `@expo-google-fonts/amiri` | ^0.4.1 | Arabic display font |
| `@expo-google-fonts/inter` | ^0.4.2 | Body text font |
| `@expo-google-fonts/lora` | ^0.4.2 | Heading font |
| `expo-audio` | ~55.0.9 | Audio playback (SFX + letter pronunciation) |
| `expo-haptics` | ~55.0.9 | Haptic feedback |
| `react-native-svg` | 15.15.3 | SVG rendering |
| `expo-splash-screen` | ~55.0.12 | Splash screen management |

**Infrastructure:**

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-secure-store` | ~55.0.9 | Secure key-value storage (install date tracking) |
| `expo-constants` | ~55.0.9 | App constants and config |
| `expo-asset` | ~55.0.10 | Static asset management |
| `expo-linking` | ~55.0.8 | Deep linking |
| `expo-status-bar` | ~55.0.4 | Status bar control |
| `expo-symbols` | ~55.0.5 | SF Symbols support |
| `expo-web-browser` | ~55.0.10 | In-app browser |
| `expo-dev-client` | ~55.0.18 | Development builds |
| `react-native-worklets` | 0.7.2 | Worklet threading for Reanimated |

## Configuration

**App Config:**
- `app.config.ts` - Dynamic Expo config (owner: `tila.app`, scheme: `tila`)
- Portrait-only orientation
- Typed routes enabled (`experiments.typedRoutes: true`)
- iOS bundle ID: `com.tilaapp.tila`
- Android package: `com.tila.app`

**TypeScript:**
- `tsconfig.json` - Strict mode, extends `expo/tsconfig.base`
- Path alias: `@/*` maps to project root

**Build:**
- `eas.json` - EAS Build profiles: development, development:simulator, preview, production
- App version source: remote (managed by EAS)
- Production builds: auto-increment enabled
- `metro.config.js` - Metro bundler with Sentry source map integration

**Environment:**
- No `.env` files present - API keys are hardcoded in source (PostHog, Sentry)
- `expo-secure-store` used for runtime key-value persistence

## Platform Targets

**iOS:**
- iPhone only (`supportsTablet: false`)
- No background modes
- Non-exempt encryption declared (`ITSAppUsesNonExemptEncryption: false`)

**Android:**
- Standard Android target
- Adaptive icon configured

**Development:**
- Expo dev client for development builds
- Simulator/emulator profiles in EAS config
- Commands: `npm start`, `npm run android`, `npm run ios`

**Validation:**
- `npm run validate` runs lint + typecheck
- `npm test` runs Vitest

---

*Stack analysis: 2026-03-28*

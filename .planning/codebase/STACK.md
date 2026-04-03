# Technology Stack

**Analysis Date:** 2026-04-03

## Languages

**Primary:**
- TypeScript 5.9.2 - All application code, strict mode enabled
- JavaScript - Configuration files (metro.config.js, eslint.config.js)

## Runtime & Environment

**Runtime:**
- Expo SDK 55.0.9 - Managed React Native platform with built-in CLI and EAS Build integration

**JavaScript Runtime:**
- React Native 0.83.4 - Cross-platform mobile app framework with New Architecture enabled
- Node.js (via npm) - Development environment

**Package Manager:**
- npm - Lockfile: package-lock.json (v3, locked)

## Frameworks & Core Libraries

**UI & Navigation:**
- React 19.2.0 - UI library with Server Components support
- Expo Router 55.0.10 - File-based routing for Expo (similar to Next.js)
- React Navigation 7.1.33 - Navigation primitives (underlying Expo Router)

**State Management:**
- React Context - Theme context (`ThemeContext`) and database context (`DatabaseProvider`)
- Custom Hooks - Business logic bridging (in `src/hooks/`)
- No Redux, Zustand, or other state managers

**Testing:**
- Vitest 4.1.2 - Unit test runner configured in `vitest.config.ts`
- @vitest/coverage-v8 4.1.2 - Code coverage provider (V8-based)
- Test files: `src/__tests__/**/*.test.{js,ts}` with setup in `src/__tests__/setup.ts`

**Build & Development:**
- Metro - React Native bundler (configured via `metro.config.js` with Sentry integration)
- Expo Dev Client 55.0.22 - Development client for EAS Build
- EAS CLI (>= 15.0.0) - Build and submission orchestration

## Key Dependencies

### Database & Storage

**SQLite:**
- expo-sqlite 55.0.13 - Native SQLite database with async API
  - Schema version: 7 (migrations in `src/db/client.ts`)
  - 8 tables: user_profile, mastery_entities, mastery_skills, mastery_confusions, habit, lesson_attempts, question_attempts, premium_lesson_grants
  - PRAGMA foreign_keys enabled at runtime

**Secure Storage:**
- expo-secure-store 55.0.11 - iOS Keychain / Android Keystore wrapper
- @react-native-async-storage/async-storage 2.2.0 - Persistent key-value storage with AES-256 encryption for Supabase sessions

### Backend & Cloud Integrations

**Supabase (Backend-as-a-Service):**
- @supabase/supabase-js 2.101.1 - Client library for PostgreSQL, auth, and real-time
  - Custom encrypted session storage wrapper (`LargeSecureStore` in `src/auth/supabase.ts`)
  - Environment: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
  - Supports cloud sync, authentication, social features, and user data

**Authentication Providers:**
- expo-apple-authentication 55.0.11 - Native Apple Sign-In (iOS/iPad only)
- @react-native-google-signin/google-signin 16.1.2 - Native Google Sign-In
  - Configured in `src/auth/google.ts` with Web OAuth client ID
- Supabase Auth - Email/password, SSO providers (via Supabase)

### Monetization

**RevenueCat:**
- react-native-purchases 9.15.0 - Subscription management SDK
- react-native-purchases-ui 9.15.0 - Pre-built paywall UI
  - Platform-specific API keys: EXPO_PUBLIC_REVENUECAT_IOS_KEY, EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
  - Billing models: $8.99/mo, $49.99/yr, 7-day trial, 6 lessons free

### Analytics & Error Tracking

**PostHog:**
- posthog-react-native 4.39.0 - Product analytics
  - Requires consent flag (in user_profile.analytics_consent)
  - Lazy-initialized, captured events defined in `src/analytics/events.ts`
  - Environment: EXPO_PUBLIC_POSTHOG_KEY, EXPO_PUBLIC_POSTHOG_HOST

**Sentry:**
- @sentry/react-native 7.11.0 - Error tracking and performance monitoring
  - Initialized in `src/analytics/sentry.ts`
  - Traces sampling: 0% (crash reporting only, no performance traces)
  - Metro integration: `metro.config.js` wraps config with Sentry
  - Environment: EXPO_PUBLIC_SENTRY_DSN

### Encryption & Cryptography

**AES Encryption:**
- aes-js 3.1.2 - AES-256 CTR mode for Supabase session encryption
  - Custom implementation in `src/auth/supabase.ts`
  - Key stored in SecureStore, payload in AsyncStorage

**Native Crypto:**
- expo-crypto 55.0.12 - Native cryptographic operations (SHA-256 hashing for Apple Sign-In nonce)

### Fonts & Typography

**Google Fonts (via Expo):**
- @expo-google-fonts/amiri 0.4.1 - Arabic serif font (Quranic text)
- @expo-google-fonts/inter 0.4.2 - English sans-serif (body text)
- @expo-google-fonts/lora 0.4.2 - English serif (headings)
- expo-font 55.0.4 - Font loading and caching

### Audio

**Audio Playback:**
- expo-audio 55.0.11 - Native audio player for pronunciation assets
  - Bundled SFX and per-letter audio files (name + sound for 28 Arabic letters)
  - Used in `src/audio/` for question feedback and letter learning

### UI & Animation

**Animations & Haptics:**
- react-native-reanimated 4.2.1 - Performant gesture-driven animations (New Architecture compatible)
- expo-haptics 55.0.11 - Haptic feedback (vibration, impact)

**SVG & Icons:**
- react-native-svg 15.15.3 - SVG rendering
- expo-symbols 55.0.7 - SF Symbols on iOS, Material Symbols on Android

**Styling:**
- expo-linear-gradient 55.0.11 - Linear gradient backgrounds

**Safe Area Handling:**
- react-native-safe-area-context 5.6.2 - Safe area insets (notch awareness)
- react-native-screens 4.23.0 - Native screen container optimization

### Web Support & Polyfills

- react-native-web 0.21.0 - Web target for development (not production-used)
- react-native-url-polyfill 3.0.0 - URL API for React Native environment

### Error Boundaries

- react-error-boundary 6.1.1 - Component-level crash recovery (v6.1.1 compatible with React 19)

## Configuration Files

**Runtime Configuration:**
- `app.config.ts` - Expo app manifest (plugins, permissions, privacy manifests for iOS)
- `tsconfig.json` - TypeScript compiler options (strict mode, path alias `@/*` → root)
- `vitest.config.ts` - Test runner setup (coverage provider, test glob patterns)
- `metro.config.js` - React Native bundler config with Sentry integration
- `eslint.config.js` - ESLint with Expo flat config
- `eas.json` - EAS Build profiles (development, development:simulator, preview, production) with App Store submission config

**Build Output:**
- `.expo/` - Expo cache directory
- `dist/` - Build artifacts directory

## Environment Configuration

**Public Environment Variables (exposed to client):**
These must be prefixed with `EXPO_PUBLIC_` to be available in the app:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public API key
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` - Google OAuth Web client ID (not iOS/Android)
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` - RevenueCat SDK key for iOS
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` - RevenueCat SDK key for Android
- `EXPO_PUBLIC_POSTHOG_KEY` - PostHog API key
- `EXPO_PUBLIC_POSTHOG_HOST` - PostHog server URL (defaults to `https://us.i.posthog.com`)
- `EXPO_PUBLIC_SENTRY_DSN` - Sentry project DSN

**Secrets (in `.env` files, never committed):**
- `.env` - Local development secrets
- `.env.local` - Machine-specific overrides

## Platform Requirements

**Development:**
- Node.js + npm
- Expo CLI (installed via npm)
- iOS: Xcode 15+ (simulator or device)
- Android: Android SDK 34+ (emulator or device)
- Apple Developer account (for iOS builds via EAS)
- Google Play Developer account (for Android production builds)

**Production:**
- **iOS:** App Store distribution (EAS Submit to App Store)
  - Bundle ID: `com.tilaapp.tila`
  - Supports iPhone (portrait-only, tablet disabled)
  - Privacy manifest configured for NSUserDefaults access
  - Uses Apple Sign-In capability
  
- **Android:** Google Play distribution (EAS Submit to Play Store)
  - Package: `com.tila.app`
  - Adaptive icon configured
  - Min API: Inferred from Expo SDK 55 (typically 24+)

**New Architecture:**
- Enabled in `app.config.ts` (`newArchEnabled: true`)
- Requires React Native 0.83+ (compatible)
- Fabric renderer + TurboModule interop module

## Build & Deployment

**Local Development:**
```bash
npm start              # Expo dev server
npm run android        # Launch Android dev client
npm run ios            # Launch iOS simulator/device
npm run web            # Web target (dev only)
npm test               # Vitest unit tests
npm run coverage       # Coverage report
```

**Cloud Builds & Submission (EAS):**
- Development builds: Internal distribution via EAS Build
- Production: Managed by EAS CLI (>= 15.0.0)
- App versioning: Remote via EAS `appVersionSource: "remote"` (version managed in EAS dashboard)
- Auto-increment: Enabled for production builds

**App Store Submission:**
- iOS: Via EAS Submit with ascAppId `6761349651`
- Android: Via EAS Submit to Play Store

---

*Stack analysis: 2026-04-03*

# EduPlexo Mobile (React Native + Expo)

Production-grade Android wrapper for the EduPlexo school management platform.
Talks to the same Go backend the web app uses (`https://app.eduplexo.com/api`),
using the same JWT auth, the same role matrix, and the same response shapes.

This is **Phase 1**: foundation, auth, and three role-aware dashboards
(Admin, Teacher, Student/Parent). Module deep-screens (Attendance, Exams,
Results, etc.) connect to live APIs in the next iteration.

---

## Stack

- **Expo SDK 51** + **Expo Router** (file-based routing)
- **TypeScript**, strict mode
- **TanStack Query** for server state
- **Zustand** for the auth store
- **Axios** with a shared `ServiceResult` envelope, Bearer JWT and the
  `X-Academic-Year-Id` header — exactly like `service-client.ts` in the web app
- **expo-secure-store** for the JWT (Android Keystore-backed)
- **react-native-reanimated** + **react-native-gesture-handler**
- **react-native-svg** for the icon set (no font/asset bundling)

---

## Folder Layout

```
mobile-rn/
├── app/                      # Expo Router routes
│   ├── _layout.tsx           # Providers + auth gate
│   ├── index.tsx             # Cold-start redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (admin)/              # Admin tab navigator
│   ├── (teacher)/            # Teacher tab navigator
│   └── (student)/            # Student / Parent tab navigator
├── src/
│   ├── api/
│   │   ├── client.ts         # Axios instance, interceptors, ServiceResult
│   │   └── auth.ts
│   ├── components/
│   │   ├── ui/               # Button, Input, Card, Icon, StatTile
│   │   ├── auth/RoleTabs.tsx
│   │   └── layout/           # ScreenContainer, Header, ModuleListScreen
│   ├── config/env.ts         # Reads from app.json -> expo.extra
│   ├── store/auth-store.ts   # Zustand auth slice
│   ├── theme/tokens.ts       # Design tokens (1:1 with the web)
│   ├── types/                # auth, api types
│   └── utils/                # jwt, secure-storage
├── assets/images/            # icon, adaptive-icon, splash placeholders
├── app.json
├── babel.config.js
├── metro.config.js
├── tsconfig.json
└── package.json
```

---

## Setup (one time)

```bash
cd mobile-rn
npm install
```

That installs Expo CLI locally — no global install needed.

---

## Run on your Android phone

You already authorised the device with ADB. Confirm it:

```bash
adb devices
# 220333QAG    device
```

Then start the dev build:

```bash
npx expo run:android
```

The first run will:
1. Generate the `android/` folder (`expo prebuild`).
2. Build a debug APK with Gradle.
3. Install it onto the device and start Metro for hot reload.

Subsequent runs just rebuild the changed JavaScript over Metro — no full
APK rebuild needed.

If the device is over Wi-Fi (not USB), `adb tcpip 5555` then
`adb connect <ip>:5555` first. Then run `expo run:android` as normal.

---

## Build a release APK

Standard Android Gradle build:

```bash
npx expo prebuild --platform android   # idempotent — only when native config changes
npm run build:apk                       # release APK -> android/app/build/outputs/apk/release/
```

Or for a debug APK that doesn't need signing:

```bash
npm run build:apk:debug
```

For Play Store distribution use an AAB:

```bash
cd android && ./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Signing the release build

Generate an upload keystore once:

```bash
keytool -genkey -v -keystore ~/eduplexo-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias eduplexo
```

Then add to `android/gradle.properties` (after `expo prebuild`):

```properties
ESCAPE_KEYSTORE_PATH=/Users/you/eduplexo-upload.jks
ESCAPE_KEYSTORE_PASSWORD=...
ESCAPE_KEY_ALIAS=eduplexo
ESCAPE_KEY_PASSWORD=...
```

…and reference them in `android/app/build.gradle`'s `signingConfigs` block.
(Expo's default release config uses `upload-keystore.jks` if present.)

---

## Environment

The API base URL lives in `app.json` -> `expo.extra.apiBaseUrl`. Defaults to
`https://app.eduplexo.com/api`. Override per build with EAS env vars or by
editing `app.json` before `expo prebuild`.

---

## Auth flow

1. `POST /api/auth/login` with `{ email, password, role }` (role tabs map to
   `admin` | `teacher` | `student`).
2. The response token is stored in `expo-secure-store`. Non-sensitive bits
   (profile id, class id, academic year) go in AsyncStorage so they survive
   keystore key rotations.
3. On every request, `axios` injects `Authorization: Bearer <token>` and
   `X-Academic-Year-Id`.
4. On 401, the HTTP client clears the token and the auth store routes the
   user back to `/login`.
5. The cross-tenant guard wipes per-school caches if `school_id` changes
   between sessions on the same device — same behaviour as the web app.

---

## What's next

Phase 2 lands the deep module screens (Attendance, Homework, Exams, Results,
Fees, Live Classes, Events, Behavior, Leave, etc.) wired to the same Go
endpoints the web app uses. Each screen will follow the same pattern:

```ts
const result = await api.get<PaginatedResponse<...>>('/...');
if (!result.ok) showError(result.message);
```

Pagination, search, filters, skeleton loaders, empty states, pull-to-refresh,
and toast notifications all sit in `src/components` and `src/hooks` ready to
use across modules.

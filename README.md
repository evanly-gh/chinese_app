# OpenChinese

A full-featured, offline-first mobile app for learning Mandarin Chinese through spaced repetition, interactive exercises, level tests, and an AI conversation tutor. Built with React Native (Expo) and TypeScript, backed by Supabase for auth and cross-device sync.

> **Try it:** Android APK — https://expo.dev/artifacts/eas/w2fUBbzWw4CWPjjS2saFJx.apk

---

## Overview

OpenChinese is a personal Chinese-learning app built to combine the study techniques that actually move the needle for a self-learner: an SRS (spaced-repetition system) flashcard engine, varied drill exercises, timed level tests, and free-form conversation with an AI tutor that is *aware of what you are currently studying*.

It ships with the full HSK (Hanyu Shuiping Kaoshi) vocabulary curriculum for levels 1–5 (~2,400 words with example sentences) plus 71 grammar rules for HSK 1–5. All study state lives locally on the device first (via AsyncStorage) so the app works fully offline; when signed in, progress is mirrored to Supabase so it survives reinstalls and follows you across devices.

---

## Features

- **SM-2 spaced repetition** — a real SuperMemo-2 scheduler with ease factors, intervals, lapses, and mastery graduation.
- **Swipe-deck flashcards** — gesture-driven review (swipe left = known, right = unknown) with a pre-flip/post-flip flow and a "Mistaken" downgrade button, plus configurable session size, level pooling, and sort mode (due-first / difficulty / familiarity / random / sequential).
- **8 exercise types** — Chinese→English MCQ, English→Chinese MCQ, fill-in-the-blank, sentence-translation MCQ, Chinese character reorder, English word reorder, listen-to-word, and listen-to-sentence.
- **Grammar module** — 71 grammar rules (HSK 1–5) with fill-blank and pick-the-correct-sentence exercise types, mixable with vocabulary in a single session.
- **Level tests** — configurable 10/20/30/40-question assessments per HSK level, with scoring and a review of missed words.
- **AI conversation tutor** — chat with a Gemini-backed tutor that adapts to your current working set and *weakest* words, replying in Chinese with pinyin plus an expandable English "Teacher Notes" analysis.
- **Text-to-speech** — native TTS for words and sentences (Simplified `zh-CN` / Traditional `zh-TW`).
- **Progress & gamification** — daily streaks, a 28-day activity calendar, working-set/mastered counters, per-level stats, and a weak-cards list.
- **Theming** — Light / Dark / Custom themes with a hex color picker, applied across all screens.
- **Simplified & Traditional** — toggle character set app-wide; exercises, TTS, and AI chat all respect it.
- **Offline-first with cloud sync** — full local persistence; Supabase is the source of truth once you sign in.

---

## Architecture / How It Works

### App shell & routing
The app uses **Expo Router** (file-based routing). `src/app/_layout.tsx` is the root: it loads fonts, runs storage migrations, checks the Supabase session, and gates the app behind `AuthScreen` if the user is signed out. On login it kicks off a full cloud pull. `src/app/(tabs)/_layout.tsx` defines the four bottom tabs — **Home**, **Study**, **Progress**, **Settings**.

The **Study** tab (`src/app/(tabs)/study.tsx`) is a mode picker that routes into five sub-experiences: Flashcards (inline), and the `Exercises`, `Test`, and `Chat` screens under `src/screens/`.

### Spaced repetition (SM-2)
`src/algorithms/sm2.ts` implements the SuperMemo-2 algorithm:
- Each card carries an `SRSState` (`interval`, `repetition`, `efactor`, `dueDate`, `lapses`, `firstSeenDate`, `lastReviewDate`).
- The app's 3-tier UI rating (`unknown` / `in_progress` / `known`) maps to SM-2 grades (0 / 2 / 5).
- Intervals grow `1 → 6 → round(interval × efactor)`; a lapse resets repetition and interval to 1 and increments the lapse count.
- The ease factor is updated with the standard SM-2 formula and floored at 1.3.
- A card graduates to **mastered** at `interval ≥ 21` days; a first-ever "known" instantly masters the card.

The review scheduling and queue construction live in `src/utils/cardUtils.ts` — `buildSessionQueue` (due-oldest-then-weakest ordering), `buildConfiguredQueue` (level filter + sort mode), plus the **working-set** window (`getWorkingSet` keeps unseen/low-interval cards active until they reach the weekly schedule), weak-card selection, and per-level stats.

`src/hooks/useStudySession.ts` orchestrates a session: loads the queue, tracks per-card response time, applies SM-2 on each rating, persists state locally, appends a review event, and pushes touched SRS states + the daily log to Supabase when the session finishes.

### Exercises & tests
`src/utils/exerciseUtils.ts` builds all vocabulary exercises (MCQ distractor selection, sentence blanking, bubble shuffling). `src/utils/grammarUtils.ts` builds grammar exercises. `src/components/exercise/ExerciseHost.tsx` is a dispatcher that renders the right component per exercise `type`. `src/screens/TestScreen.tsx` assembles a mixed MCQ test, scores it, and records the result.

### Backend (Supabase)
`src/lib/supabase.ts` configures the Supabase JS client with AsyncStorage-backed, auto-refreshing, persisted sessions. Auth is email/password (`AuthScreen.tsx`).

`src/storage/cloudSync.ts` is the sync layer:
- **Pull (cloud → local)** on login: `srs_states`, `review_logs` (last 14 days), `user_settings`, `test_results` → written into AsyncStorage.
- **Push (local → cloud)**: SRS states and daily logs after each session (`upsert` on `user_id,card_id` / `user_id,date`), settings on every change (`useSettings` context), and test results on completion.

The strategy is **last-write-wins upsert** keyed by user + entity id, with AsyncStorage as the local cache and Supabase as the source of truth.

### AI chat (Gemini via Edge Function)
`supabase/functions/gemini-chat/index.ts` is a **Deno edge function** that keeps the Gemini API key server-side (`Deno.env.get('GEMINI_API_KEY')`). It requires a Supabase JWT (`Authorization` header), forwards the conversation to **Gemini 2.0 Flash** with a JSON response schema, and returns a `{ reply, teacher }` pair.

The client side (`src/utils/chatUtils.ts`) builds a personalized system prompt from the learner's actual progress: it pulls the current working set, the 8–10 weakest words (lowest ease factor), and the active grammar patterns, and instructs the tutor to weave weak vocabulary into the conversation. It attaches the user's access token and calls the edge function — the API key never touches the device.

### Offline-first persistence
All app state is stored under namespaced AsyncStorage keys (`src/storage/keys.ts`, e.g. `@cl:srs:<cardId>`, `@cl:log:<date>`, `@cl:streak`, `@cl:settings`). `src/storage/migrations.ts` runs a version-gated migration on startup. Storage modules: `cardStateStorage`, `reviewHistoryStorage`, `grammarStateStorage`, `settingsStorage`, `testResultStorage`.

### TTS
`src/hooks/useTTS.ts` wraps `expo-speech`, selecting `zh-CN`/`zh-TW` based on the Simplified/Traditional setting.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81, React 19.1, Expo SDK ~54 |
| Language | TypeScript ~5.3 |
| Navigation | Expo Router ~6 (file-based, typed routes) |
| Animation / gestures | react-native-reanimated ~4.1, react-native-gesture-handler ~2.28, react-native-worklets |
| Local storage | @react-native-async-storage/async-storage 2.2 |
| Backend | Supabase (`@supabase/supabase-js` ~2.100) — Auth, Postgres, Edge Functions |
| AI | Google Gemini 2.0 Flash (proxied via a Deno Supabase Edge Function) |
| Speech | expo-speech |
| Fonts | @expo-google-fonts/noto-sans-sc |
| Testing | Jest + jest-expo + ts-jest |
| Build / OTA | EAS Build (APK preview / AAB production), expo-updates |

---

## Data Model

### Local (AsyncStorage) — keys from `src/storage/keys.ts`
- `@cl:settings` — the `AppSettings` object.
- `@cl:srs:<cardId>` — one `SRSState` per vocab card.
- `@cl:log:<date>` — a `DailyLog` (new cards, reviewed cards, review events) per day.
- `@cl:streak` — current streak + last active date.
- `@cl:test_results` — array of test results.
- `@cl:schema_version` — migration version.

### Cloud (Supabase Postgres) — inferred from `cloudSync.ts`
- **`srs_states`** — `user_id`, `card_id`, `interval`, `repetition`, `efactor`, `due_date`, `first_seen_date`, `last_review_date`, `lapses` (PK `user_id,card_id`).
- **`review_logs`** — `user_id`, `date`, `new_cards`, `reviewed_cards`, `events` (PK `user_id,date`).
- **`user_settings`** — `user_id`, `settings` (JSON) (PK `user_id`).
- **`test_results`** — `user_id`, `level`, `score`, `total`, `incorrect`, `taken_at`.

### Content data (bundled JSON)
- `src/data/hsk/hsk1.json` … `hsk9.json` — vocabulary cards (simplified, traditional, pinyin, English, part of speech, up to two example sentences). Levels 1–5 are populated (~2,400 cards total); 6–9 are placeholders.
- `src/data/grammar/hsk1-grammar.json` … `hsk5-grammar.json` — 71 grammar rules with explanations, examples, and generated fill-blank / MCQ exercises.

---

## Setup

### Prerequisites
- Node.js and npm
- Expo CLI (`npx expo`)
- (Optional) A Supabase project for auth/sync and a Gemini API key for AI chat

### Install & run
```bash
npm install
npm start            # start the Expo dev server
npm run android      # build & run on Android
npm run ios          # build & run on iOS
npm test             # run the Jest test suite
```

### Configuration
- **Supabase client:** URL and anon (publishable) key are set in `src/lib/supabase.ts`. Swap these for your own project. The anon key is a public, RLS-gated key (safe to ship); protect your tables with Row-Level Security keyed on `user_id`.
- **Gemini AI chat:** deploy the edge function and set the secret so the key stays server-side:
  ```bash
  supabase functions deploy gemini-chat
  supabase secrets set GEMINI_API_KEY=your_key_here
  ```
- **Database:** create the `srs_states`, `review_logs`, `user_settings`, and `test_results` tables described above (with RLS policies) in your Supabase project.

### Building (EAS)
`eas.json` defines a `preview` profile (Android APK) and a `production` profile (Android app bundle). OTA updates are configured via `expo-updates` in `app.json`.

---

## Usage

1. **Sign up / sign in** with email and password. Progress syncs to your account.
2. **Study → Flashcards** — configure the session (levels, size, sort), then swipe or use the rating buttons; the SM-2 scheduler decides when each card comes back.
3. **Study → Exercises** — mixed vocabulary and/or grammar drills across 8 exercise types.
4. **Study → Test** — take a scored level assessment and review your mistakes.
5. **Study → AI Chat** — converse with a tutor that targets your weak words and current grammar; expand "Teacher Notes" for corrections and explanations.
6. **Progress** — track streaks, the 28-day activity calendar, mastery, and weak cards.
7. **Settings** — active levels, daily goal, new-cards-per-session, working-set size, Simplified/Traditional, TTS, theme, and more.

---

## Project Structure

```
src/
  app/                    # Expo Router routes
    _layout.tsx           #   root: fonts, migrations, auth gate, cloud pull
    (tabs)/               #   Home / Study / Progress / Settings tabs
  algorithms/
    sm2.ts                # SuperMemo-2 spaced-repetition implementation
  components/
    common/               # ThemedText/View, ProgressBar, StreakBadge/Calendar, popovers
    exercise/             # 8 exercise components + ExerciseHost dispatcher
    study/                # FlashCard, SwipeDeck, DifficultyButtons, session UI
  data/
    hsk/                  # HSK 1-9 vocabulary JSON (1-5 populated)
    grammar/              # HSK 1-5 grammar rules JSON + types/index
  hooks/                  # useStudySession, useProgress, useStreak, useTTS,
                          # useSettings (context), useTheme, useSettings
  lib/
    supabase.ts           # Supabase client
  screens/                # AuthScreen, ChatScreen, ExercisesScreen, TestScreen
  storage/                # AsyncStorage modules + cloudSync + migrations + keys
  theme/                  # colors + typography
  types/                  # vocab, review, settings type definitions
  utils/                  # card/exercise/grammar/chat/date/pinyin helpers
supabase/
  functions/gemini-chat/  # Deno edge function proxying Gemini 2.0 Flash
  config.toml
__tests__/
  sm2.test.ts             # SM-2 unit tests
```

---

## Notes

- The bundled Supabase URL and **anon/publishable** key in `src/lib/supabase.ts` are public by design (client keys); server secrets like `GEMINI_API_KEY` are never bundled — they live only in the edge function's environment.
- HSK levels 6–9 vocabulary files are present but currently empty placeholders.

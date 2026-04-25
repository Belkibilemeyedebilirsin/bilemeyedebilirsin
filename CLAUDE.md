# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bilebilirsin** — a social prediction/betting mobile app (React Native + Expo Router). Users predict outcomes (EVET/HAYIR) using TP (seasonal currency), build coupons, compete in arenas, and trade cosmetics. Currently in **mock/client-only phase**; backend (Supabase) integration is planned.

## Commands

```bash
npm install          # Install dependencies
npx expo start       # Start dev server (Expo Go / emulator)
npx expo lint        # Lint
npx tsc --noEmit     # TypeScript check (no test framework configured yet)
```

## Architecture

### Routing

Expo Router file-based routing via `src/app/`. Drawer navigator in `_layout.tsx`. Auth guard in `AppNavigator` redirects unauthenticated users to `/(auth)/giris`.

### Provider Stack (order matters — `_layout.tsx`)

```
GestureHandlerRootView
  AuthProvider          — phone OTP auth, mock user pre-authenticated
    CouponProvider      — coupon builder (selections, panel state)
      AppSettingsProvider
        UIFeedbackProvider
          EconomyProvider   — TP/KP wallet, transactions, daily login, season lifecycle
            PredictionProvider — parimutuel pool engine (odds, stakes, resolution)
              AppDataProvider  — aggregates mock data, XP/level, store, friends, notifications
```

Inner providers can consume outer ones (e.g., `AppDataProvider` uses `useEconomy()`). Never reorder without checking dependencies.

### Dual Currency Economy

- **TP** (Tahmin Puani): seasonal, reset each season, used for predictions/auctions
- **KP** (Kalici Puan): permanent, earned from lost TP conversions and season-end, used for cosmetics/room creation

All rates, limits, cooldowns, and costs live in `src/config/gameConfig.ts` — never hardcode these values.

### Prediction System (Parimutuel)

Core engine in `PredictionContext.tsx`. Types in `src/types/prediction.ts`. Odds are computed from pool ratios with system cut (`parimutuelSystemCut`). Lifecycle: `open → closed → resolved | cancelled`.

### Key Directories

- `src/context/` — all state management (React Context, no Redux/Zustand)
- `src/types/` — shared type definitions; `index.ts` re-exports from domain files
- `src/config/gameConfig.ts` — single source of truth for all game constants
- `src/data/mock*.ts` — seed data for mock phase
- `src/components/` — UI components (`layout/`, `cards/`, `chat/`, `common/`)

## Development Rules

- Config-driven: all numeric limits, rates, costs, cooldowns must come from `gameConfig.ts`
- No unnecessary refactors — change only what's needed
- Don't break working code
- Leave no TS/build errors
- Keep responses short: brief summary, concise test descriptions
- Turkish UI strings throughout the app
- Path aliases: `@/*` → `./src/*`, `@/assets/*` → `./assets/*`
- Do not rescan the whole repo unless necessary; focus only on directly relevant files first

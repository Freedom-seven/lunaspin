# LunaSpin Documentation

This document gives a deep dive into the app’s architecture, data model, and key components, plus guidance on theming and extensibility.

## 1. Architecture overview
- Frontend: React 18 + Vite + TypeScript
- Styling: TailwindCSS with a small shadcn-inspired UI kit
- Animations: Framer Motion (wheel spin)
- State: Zustand (persisted in localStorage)
- Dev server: Express middleware mounted in Vite dev (no production backend required)

Directory map:
- client/
  - components/
    - LunaWheel.tsx — the spinner SVG, motion controls, confetti, and buttons
    - DailyHuddle.tsx — curated conversation prompts and micro‑advice
    - HistoryTable.tsx — history list with topics (editable paths provided by store actions)
    - Layout.tsx — header/nav/footer shell
    - Logo.tsx — loads `/logo.png` if present, falls back to vector mark
  - pages/Index.tsx — home experience with team creation, wheel, and huddle
  - pages/History.tsx — past winners and topics
  - store/store.ts — the app’s single source of truth
- server/index.ts — small API for ping/demo (used only in dev)
- index.html — metadata and icons

## 2. Data model (store/store.ts)
- Member: { id, name, spinsWon, topics[] }
- HistoryEntry: { date, winner, topic? }
- LunaState: { teamName, members[], history[], lastWinnerId }

Actions:
- setTeamName, addMember, removeMember, renameMember, resetAll
- recordWin(memberId)
- setTopicForWinner(topic)
- updateHistoryTopic(index, topic)
- deleteHistoryEntry(index)
- exportJSON(), exportCSV()

Persistence:
- Zustand `persist` stores teamName, members, history under key `lunaspin-store`.

## 3. Spinner logic (LunaWheel.tsx)
- Segments computed from members; each wedge is an SVG arc from center.
- Fairness: chooses a winner among those with the fewest `spinsWon`.
- Spin: 20 seconds with many revolutions, decelerating; winner announced 1s later (21s mark).
- Visuals: golden rim with studs, colorful wedges, red pointer, wooden base.
- Confetti: full‑screen for 20 seconds after winner announcement.

Key parameters to tweak:
- `size`, `r` — geometry of the wheel
- `fullTurns` and `transition.duration` — spin feel
- studs count/radius, colors, gradients

## 4. Daily Huddle
- Non‑technical prompts curated to spark short, meaningful conversations.
- Deterministic daily prompt via a seeded hash of today’s date.

## 5. Theming
- Tailwind tokens live in `tailwind.config.ts`.
- You can swap brand colors or add a theme switch using `next-themes` (already included).

## 6. Assets & icons
- Place your provided wheel image at `public/logo.png` to power favicon, Apple touch icon, and in‑app logo.
- An SVG fallback remains (`public/favicon.svg`) to ensure a logo is shown even without the PNG.

## 7. Accessibility & performance
- Labels for interactive elements, keyboard focus via native buttons.
- SVG wheel avoids raster blurring and scales crisply.
- Confetti only renders when active and for a limited duration.

## 8. Extensibility ideas
- Timer for presenter with automatic history write when done.
- Slack/Teams webhook to announce the winner.
- Weighted spins based on prior absences or voluntary opt‑in.
- Teams/workspaces support with shareable links.

## 9. Testing
- Vitest is configured; add unit tests in `client/**/*.test.ts(x)`.
- For wheel logic, test `pickFairIndex` with synthetic member arrays.

## 10. Deployment
- `pnpm build` creates SPA under `dist/spa/`.
- Host on any static host; add appropriate headers/redirects as needed.

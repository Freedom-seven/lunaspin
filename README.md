# LunaSpin

Playful team rituals for real work conversations. Spin a beautiful wheel to pick a presenter fairly and spark a short daily huddle with non‑technical prompts.

## Highlights
- Elegant wheel with gold rim, studs, and red pointer; wooden base aesthetic
- Fair selection that balances winners by counts
- 20s spin, winner announced at 21s with full‑screen confetti for 20s
- Daily Huddle prompts focused on genuine team conversations
- Local persistence using Zustand (no backend required)

## Quick start
1. Install deps
   - pnpm i
2. Run dev server
   - pnpm dev
3. Build
   - pnpm build
4. Start server build
   - pnpm start

## Project structure
- client/ — React app (Vite)
  - components/
    - LunaWheel.tsx — spinner UI/logic
    - DailyHuddle.tsx — QOTD module
    - Layout.tsx — app shell
    - ui/ — shadcn-inspired components
  - pages/ — routes
  - store/store.ts — Zustand state (members, history, actions)
- server/ — Express API used during dev (ping/demo)
- public/ — static assets
- index.html — HTML entry, icons and SEO

## Configuration
- PING_MESSAGE in .env controls the /api/ping message displayed by the dev server.
- Icons/logo: place your brand image at `public/logo.png`. We also ship a vector fallback and an SVG favicon.

## Usage
- Add at least two members to enable the spin button.
- Click Spin Wheel (20s). After the spin completes, the winner is recorded and confetti fires.
- Assign topics to the latest winner on the home page. History records each session date + winner + topic.

## Accessibility
- Semantic labels for the wheel and controls
- High‑contrast colors; keyboard operable buttons

## Customization
- Edit colors, sizes, and behavior in `client/components/LunaWheel.tsx`.
- Daily prompts live in `client/components/DailyHuddle.tsx`.
- Tailwind theme is configured in `tailwind.config.ts`.

## Deployment
- Vite SPA output lives in `dist/spa/` after build.
- Any static host (Netlify, Vercel, S3, etc.) works; server folder is only used in development.

## Credits
- Built with React, Vite, Tailwind, Framer Motion, and Zustand.

# XP Gazette — Project Brief for AI Agents

> **Last updated:** 2026-04-18
> This document is the single source of truth for any AI agent picking up work on this project. Read it fully before touching code.

---

## 1. What This Is

**XP Gazette** is a gamified financial literacy platform built for the **ETH Silesia 2026 hackathon**, competing in the **PKO Bank Polski "PKO XP: Gaming"** sponsor track.

The pitch: *a game-inspired world where users onboard through a campaign, learn via short daily rounds, and develop financial competency by making simulated decisions.* It deliberately combines all three track ideas:

- **Idea 1 — Knowledge in Short Rounds** → `/quiz` Quick Rounds page + lesson mini-games in `/path`
- **Idea 2 — Financial Decisions as Gameplay** → `/decision` Decision Room branching scenario game
- **Idea 3 — First Days in a New World** → `/onboarding` multi-step signup flow

The entire product is wrapped in a **1930s rubber hose / Fleischer Studios cartoon aesthetic** — think Cuphead meets Duolingo, presented as a satirical cartoon newspaper called "XP Gazette."

---

## 2. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Routing | React Router v7 |
| Styling | Tailwind v4 + custom CSS design system |
| UI primitives | shadcn/ui (used sparingly) |
| Fonts | Fredoka Variable (body/headings) + Fredoka One (remapped via `@font-face` override to Fredoka Variable) |
| Animations | CSS `@keyframes` in `rubber-hose.css`, SVG `<animate>` / `<animateTransform>` |
| No backend | All state is local React state — no API calls, no auth |

**Key packages:** `react-router-dom`, `sonner` (toasts, installed but not yet wired), `next-themes` (dark mode), `lucide-react`, `tailwind-merge`.

---

## 3. Repository Layout

```
src/
├── components/
│   ├── Nav.tsx            # Sticky top nav with org switcher + page links
│   ├── OrgSwitcher.tsx    # Organization space switcher (dropdown + join modal)
│   ├── ThemeToggle.tsx    # Dark/light mode toggle
│   └── ui/                # shadcn generated primitives (rarely used)
├── pages/
│   ├── Home.tsx           # Cartoon newspaper front page — 3-spread page flip
│   ├── News.tsx           # News feed page
│   ├── Quiz.tsx           # Quick Rounds quiz game
│   ├── Design.tsx         # Design system showcase (dev reference)
│   ├── Profile.tsx        # User profile (tabs: Overview/Badges/History/Settings)
│   ├── Leaderboard.tsx    # Leaderboard with podium + full table
│   ├── Decision.tsx       # Decision Room — branching financial scenario game
│   ├── Path.tsx           # Visual learning path + interactive lesson modals
│   └── Onboarding.tsx     # 5-step first-time user onboarding flow
├── styles/
│   └── rubber-hose.css    # Entire design system: tokens, keyframes, base styles
├── main.tsx               # Route definitions
└── index.css              # Tailwind imports + shadcn theme tokens
```

---

## 4. Design System

**Everything lives in `src/styles/rubber-hose.css`.** Do not use Tailwind utility classes for rubber-hose-specific styling — use inline styles with CSS custom properties.

### CSS Custom Properties (semantic tokens)

```css
/* Light mode (default) */
--rh-ink:     #1A0800   /* All outlines, text, borders */
--rh-paper:   #FEF9EE   /* Page/card backgrounds */
--rh-surface: #E8D5A3   /* Subtle surface fills */
--rh-card:    #FFFDF5   /* Card backgrounds */
```

Dark mode flips these automatically.

### Brand palette (Tailwind tokens)

```
--color-rh-yellow:  #FFCD00  (gold — primary accent, XP, completion)
--color-rh-red:     #E63946  (danger, excitement)
--color-rh-green:   #2D9A4E  (success, correct)
--color-rh-blue:    #1565C0  (info, trust)
--color-rh-orange:  #FF7B25  (warning, energy)
--color-rh-purple:  #7B2D8B  (mastery, mystery)
```

### Rubber Hose visual rules

Every UI element must follow these rules:
- **Borders:** `border: 2-4px solid var(--rh-ink)` — always visible, never subtle
- **Shadows:** `box-shadow: Xpx Xpx 0 var(--rh-ink)` — flat cartoon shadow, never blurred
- **Radius:** Very round — minimum `border-radius: 9999px` for pills, `12-20px` for cards
- **Fonts:** `fontFamily: "'Fredoka One', cursive"` for all headings/labels/buttons. `fontFamily: "'Fredoka Variable', sans-serif"` for body text. (Fredoka One is remapped via `@font-face` to Fredoka Variable so font-weight is respected.)
- **Hover state:** `transform: translate(-2px, -2px)` + increase box-shadow offset — "lift" effect
- **Lift helper pattern** (used in multiple files):
  ```tsx
  function lift(e, shadow = '4px 4px 0') { el.style.transform = 'translate(-2px,-2px)'; el.style.boxShadow = `${shadow} ${ink}` }
  function unlift(e, shadow = '3px 3px 0') { el.style.transform = ''; el.style.boxShadow = `${shadow} ${ink}` }
  ```

### Available CSS keyframe animations

Defined in `rubber-hose.css` — use via `animation:` in inline styles:

| Name | Description |
|------|-------------|
| `float` | Gentle up/down bob (decorations, mascots) |
| `heartbeat` | Scale pulse (active nodes, selected states) |
| `bounce-in` | Scale from 0 + spring overshoot (modals, buttons appearing) |
| `slam` | Drop from above (titles, stamps) |
| `shake` | Horizontal jitter (wrong answers, errors) |
| `fly-in-left` | Slide in from left + fade |
| `fly-in-right` | Slide in from right + fade |
| `xp-count-pop` | Scale pop for XP number reveals |
| `coin-fall` | Fall downward (confetti particles) |
| `briefing-in` | Slight rise + fade (slide transitions) |
| `wobble` | Rotation wobble |
| `pop` | Quick scale pop |
| `wiggle` | Gentle side-to-side |
| `spin-wobble` | Continuous rotation with wobble |

### Chapter colors (used in Path + modal theming)

```
Chapter 1 — Finance Basics:    #FFCD00
Chapter 2 — Budgeting:         #2D9A4E
Chapter 3 — Smart Saving:      #1565C0
Chapter 4 — Investing:         #FF7B25
Chapter 5 — Financial Mastery: #7B2D8B
```

---

## 5. Pages — Full Feature List

### `/` — Home (Home.tsx)

Cartoon newspaper front page. Three spreads accessible via a **3D page-flip animation** (700ms, perspective-based CSS transform). Each spread is a full newspaper layout with headline, subhead, 4-column article grid, and pull quotes.

**Key implementation detail:** `paperRef` measures the newspaper's full height after `document.fonts.ready` resolves and locks all spreads to the same height via inline style. The body section uses `flex: 1` to fill remaining space, preventing layout jumps between spreads.

Cards on spread 2 link to: Decision Room, Quick Rounds, My Path, Leaderboard.

---

### `/news` — News (News.tsx)

News feed page. Standard layout.

---

### `/quiz` — Quick Rounds (Quiz.tsx)

Fast-paced quiz game with timer, score, and XP payout.

---

### `/design` — Design System (Design.tsx)

Developer reference page showcasing all components, colors, typography, animations, and patterns. The `h1 className="text-4xl font-bold"` style on this page is the **reference style** for large headings across the app.

---

### `/profile` — Profile (Profile.tsx)

User profile with 4 tabs:
- **Overview:** XP ring, streak counter with fire animation, weekly activity dots, trophy shelf, learning path progress bars
- **Badges:** 8-badge grid (earned/locked states)
- **History:** Recent activity feed
- **Settings:** Placeholder

Key SVGs defined inline: `CoinMascotSVG` (floating coin with top hat), `XPRingSVG` (circular progress), `TrophyShelfSVG`, `FireSVG`.

---

### `/leaderboard` — Leaderboard (Leaderboard.tsx)

- `PodiumSVG`: 3 animated rubber hose characters on gold/silver/bronze platforms with confetti
- Full rankings table with rank circles, XP, streak, badge count, rank-change arrows
- Category filter tabs: All Time / This Week / This Month
- Current user row highlighted in yellow tint (`isYou: true`)

---

### `/decision` — Decision Room (Decision.tsx)

**The flagship feature.** A branching financial scenario game.

**5 phases:** `intro` → `briefing` → `choosing` → `consequence` → `verdict`

**2 scenarios:**
1. "The Inheritance" — 15,000 PLN windfall, 4 choices
2. "The Crypto Oracle" — Ponzi scheme, 4 choices

Each choice has: outcome tier (`brilliant | smart | neutral | poor | disaster`), XP reward, headline, lesson, snap story, 3-entry timeline.

**Key component:** `ChoiceCard` uses `getBoundingClientRect` + live mouse tracking for real-time 3D card tilt:
```tsx
transform: `perspective(700px) rotateX(${-y * 16}deg) rotateY(${x * 16}deg) translateZ(14px) scale(1.02)`
```

**Key SVGs:** `OracleSVG` (villain mascot), `BrilliantSVG`, `SmartSVG`, `NeutralSVG`, `PoorSVG`, `DisasterSVG`, `CoinShower` (22 particle confetti).

---

### `/path` — Learning Path (Path.tsx)

**Snake-layout visual learning path** + interactive lesson modals. ~1,600 lines.

**Map layout:**
- 640×840px SVG container
- 15 nodes across 5 chapters in snake pattern (L→R, R→L alternating rows)
- Coordinate system: `CX = { A:95, B:320, C:545 }`, `RY = [120,270,420,570,720]`
- `POSITIONS[15]` maps each node index to `[x, y]`
- `FULL_PATH` + `PROGRESS_PATH` are pre-computed SVG path strings with cubic bezier turns
- Decorations: 5× `TreeSVG`, 2× `CoinPileSVG`, scattered ✦ stars, chapter bridge markers

**Node states:**
- `completed` (1–4): gold circle + checkmark + XP badge below
- `active` (5): pulsing heartbeat + `ActivePointerSVG` "YOU" tag above
- `locked` (6–15): gray + 🔒, 40% opacity, not clickable for modal

**Lesson Modal** — 4 phases per node:
1. **Intro:** Chapter-color background, animated mascot (`ProfessorSVG` / `PiggySVG` / `WizardSVG`), speech bubble with hook quote, "Let's Begin!" CTA
2. **Lesson:** 2 illustrated slides (emoji circle + headline + body text), slide transitions via `briefing-in`
3. **Game:** 3 multiple-choice questions, 2×2 colored button grid (A=#1565C0, B=#FF7B25, C=#2D9A4E, D=#7B2D8B), correct=green bounce, wrong=red shake, explanation fly-in, progress dots
4. **Victory:** Grade (BRILLIANT / SMART / KEEP AT IT), XP count-up, 16 confetti particles, Replay / Back buttons

**Lesson content defined for nodes 1–5** (playable). Nodes 6–15 show locked teaser.

**Mascots:** `ProfessorSVG` (gold coin, monocle, mortarboard — chapters 1–2), `PiggySVG` (pink piggy bank — chapters 3–4), `WizardSVG` (purple wizard with wand — chapter 5).

---

### `/onboarding` — Onboarding (Onboarding.tsx)

**5-step first-time user flow. No Nav wrapper — full screen.**

1. **Welcome:** Animated `ProfessorSVG` mascot, 3D gold text shadow title, "Get Started" CTA
2. **Who Are You?:** Name + username inputs, 12-avatar emoji grid
3. **Join Your Organization:** 4 org cards (ETH Silesia, PKO Bank, Warsaw University, FinTech Hub) + collapsible invite code input
4. **Financial Mission:** 6 goal cards multi-select (Save big / Get out of debt / Start investing / Understand paycheck / Emergency fund / Financial freedom)
5. **You're In!:** Confetti rain, avatar display, summary card (org + XP + goals count), navigates to `/`

Transitions: slide right (forward) / slide left (back) using `fly-in-right` / `fly-in-left` + `animKey` to force re-mount.

---

## 6. Components

### Nav.tsx

Sticky top nav (`position: sticky; top: 0; z-index: 100`).

Layout (left → right):
1. **Logo** — "★ XP Gazette" link to `/`
2. **OrgSwitcher** — colored org pill
3. **Nav links** — Home, News, Quick Rounds, Design, My Path, Decision Room (pill active state)
4. **Right pills** — 🏆 Leaderboard (#FFCD00), 🎩 Profile (#FF7B25)
5. **ThemeToggle**

---

### OrgSwitcher.tsx

Organization space switcher — self-contained with all state local.

**State:**
- `joined: Org[]` — starts with ETH Silesia
- `currentId: string` — active space
- `open: boolean` — dropdown visible
- `modal: boolean` — join modal visible
- `tab: 'public' | 'code'`

**Data:**
- `PUBLIC_ORGS` — 6 public spaces (ETH Silesia, PKO Bank, Warsaw Uni, FinTech Hub, Krakow Uni, DeFi Poland)
- `PRIVATE_CODES` — `GENESIS` → Genesis DAO, `ALPHA23` → Alpha Club (any other code also resolves)

**Dropdown:** Lists joined spaces, switch on click. "Join a new space" dashed button opens modal.

**Join modal:** Public tab (browse grid) + Code tab (enter invite code → 1s simulated lookup → found org card). Joining adds to `joined` array and switches active space.

---

## 7. Routing (main.tsx)

```tsx
/              → Layout + Home
/news          → Layout + News
/quiz          → Layout + Quiz
/design        → Layout + Design
/profile       → Layout + Profile
/leaderboard   → Layout + Leaderboard
/decision      → Layout + Decision
/path          → Layout + Path
/onboarding    → Onboarding  (NO Nav — full screen)
```

`Layout` = `<Nav /> + {children}`. Onboarding intentionally has no Nav.

---

## 8. State Management

**No global state.** All state is component-local `useState`. No Redux, Zustand, Context API (except React Router).

This means:
- User data (name, org, XP) entered in onboarding is **not persisted** — it resets on navigation
- Org switcher state lives only in `OrgSwitcher` — other components don't know the current org
- Quiz scores, lesson completions etc. are all ephemeral

For a post-hackathon version, a React Context at the app root (or Zustand) would be the right move to share: `{ user, currentOrg, joinedOrgs, completedLessons, xp, streak }`.

---

## 9. What's Not Built Yet (Known Gaps)

| Feature | Priority | Notes |
|---------|----------|-------|
| Article reader `/article/:id` | High | "Read Full Story →" buttons on Home go nowhere |
| Achievement toast notifications | High | `sonner` is installed but never called — would fire on XP gain, lesson complete, badge unlock |
| Daily Challenge `/daily` | Medium | Streak counter on Profile is decorative |
| Shared user state | Medium | Onboarding data not persisted anywhere |
| Real org switching effect | Medium | Switching org doesn't actually change any content |
| Interactive financial calculator | Low | Compound interest slider toy — very demo-able |
| Lesson content for nodes 6–15 | Low | Only nodes 1–5 have full lesson data |
| Mobile nav | Low | Nav overflows on small screens — fine for hackathon demo |

---

## 10. Hackathon Context

**Event:** ETH Silesia 2026
**Track:** PKO Bank Polski — "PKO XP: Gaming"
**Deliverable:** Concept description + demo/mockup/video
**Evaluation:** Idea 30% · Originality 30% · Relevance 20% · Completeness 10% · Potential 10%
**Mentors:** Jakub Kaszuba, Michał Łopaciński, Kuba Kuśmierz

The brief explicitly says: *"full freedom to experiment and encourage solutions that go beyond the proposed scope."* The three ideas are inspiration, not constraints.

**Our angle:** A single unified platform that hits all 3 ideas — onboarding campaign (Idea 3) feeds into daily short rounds (Idea 1) which build toward financial decision competency (Idea 2). Rubber hose 1930s cartoon aesthetic is the differentiating creative hook.

---

## 11. Running the Project

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build to /dist
npx tsc --noEmit  # type check (expect one TS5101 deprecation warning — pre-existing, harmless)
```

**Git remote:** `github.com:JustAnotherDevv/eth-silesia-game.git` (master branch)

# Hackathon Bounties — ETH Silesia 2026

---

## 1. PKO XP: Gaming
**Sponsor:** PKO Bank Polski
**Prize:** Not specified (main track)
**Status: ✅ PRIMARY TARGET — already built for this**

### Brief summary
Design gamified educational experiences inspired by game mechanics: short rounds, financial decision simulations, and onboarding campaigns. Three ideas, all open-ended — full freedom to go beyond the suggested scope.

- **Idea 1:** Knowledge in Short Rounds — Duolingo-style learning, habit-forming engagement
- **Idea 2:** Financial Decisions as Gameplay — branching choices with consequences, XP, progress
- **Idea 3:** First Days in a New World — onboarding as a game campaign

**Evaluation:** Idea 30% · Originality 30% · Relevance 20% · Completeness 10% · Potential 10%
**Deliverable:** Concept description + demo/mockup/video
**Mentors:** Jakub Kaszuba, Michał Łopaciński, Kuba Kuśmierz

### How Knowly covers it
| Idea | Feature in our app |
|------|--------------------|
| Idea 1 — Short Rounds | `/quiz` Quick Rounds + lesson mini-games in `/path` modal (3-question quiz per lesson) |
| Idea 2 — Financial Decisions | `/decision` Decision Room — full branching scenario game with outcomes, consequences, XP |
| Idea 3 — Onboarding Campaign | `/onboarding` 5-step signup flow with org joining, goal setting, avatar |

We literally combined all 3 into one platform. This is our strongest submission.

---

## 2. ETHWarsaw x Kolektyw3 — Blockchain Challenge
**Sponsor:** ETHWarsaw & Kolektyw3
**Prize:** 1st: 2,000 PLN · 2nd: 1,000 PLN + Kolektyw3 memberships
**Status: 🟡 VIABLE WITH ADDITIONS — significant overlap, needs blockchain layer**

### Brief summary
Build tools for a real-world coworking + community hub (Kolektyw3, Warsaw) that meaningfully use blockchain. Not forced crypto — use it where it makes sense.

Problem areas:
- **Space & Resource Management** — room/desk booking, onchain payments, dynamic pricing
- **Access & Membership** — token-based access, subscription memberships, soulbound vs transferable tokens, expiry/renewal
- **Events & Community** — token-gated events, attendance tracking with real utility, participation incentives
- **Coordination & Governance** — lightweight member governance, contribution tracking, reward systems
- **Payments & Finance** — cost splitting, community treasury, microgrants

**What they care about:** Real-world usability, good use of blockchain (not "just mint an NFT"), thoughtful identity/ownership design, simplicity over complexity, great UX for non-crypto users.

### How Knowly overlaps
Our **org switcher and spaces system** is literally the core of what they're describing:

| Their problem | Our existing feature |
|---------------|---------------------|
| Membership spaces with joining | OrgSwitcher — join public spaces or via invite code, switch between spaces |
| Onboarding as campaign | `/onboarding` — join org, set goals, gradual discovery |
| Contribution tracking & XP | XP system, leaderboard, badges, streak |
| Community events / engagement | Decision Room scenarios, quiz rounds |
| Knowledge & learning for members | `/path` learning path, lesson modals |

### What we'd need to add to apply
1. **Token-gated space access** — wrap org membership in a simple token (ERC-721 or ERC-1155). Join = mint. Leave = burn or transfer. This could be a thin mock/demo layer.
2. **Onchain membership record** — when a user joins a space via invite code, record it onchain (could be a simple smart contract mapping `address → spaceId`).
3. **Soulbound vs transferable design decision** — personal XP/badges = soulbound (non-transferable); space membership = transferable (can gift to someone else). This is exactly the "thoughtful design" they want to see.
4. **Simple payment demo** — show that a "desk booking" or event ticket could be paid in ETH/stablecoin via the space's treasury.

### Pitch angle
> "Knowly started as a financial literacy platform, but the organization space system we built — join spaces via token or code, build reputation through XP and badges, participate in community events — is exactly the programmable, community-owned coworking infrastructure Kolektyw3 wants. We're applying the same mechanics to physical-space membership."

This is honest and compelling. Our UX is already there. We need a thin blockchain integration to make it real.

### Honest assessment
**Time needed to make a credible submission:** ~4–6 hours of focused work.
- Add a mock wallet connect button (RainbowKit or just a fake address input for demo)
- Sketch a simple smart contract (Solidity, ~30 lines) for space membership
- Show the "join via token" flow in the existing OrgSwitcher modal
- Write the concept doc framing it as "onchain coworking stack"

**Risk:** Judges may want actual deployed contracts, not just a mock. Strongest play is deploying to a testnet.

---

## 3. AI Challenge powered by Tauron
**Sponsor:** Tauron (energy company)
**Prize:** 1st: 5,000 PLN · 2nd: 3,000 PLN · 3rd: 2,000 PLN
**Status: 🔴 POOR FIT — wrong domain, not worth pursuing**

### Brief summary
AI-powered solutions for Tauron's business: electricity consumption analysis, customer service tools, energy optimization, mobile app features, chatbots (bonus: Silesian dialect chatbot).

Focus areas: energy consumption data, electricity usage patterns, customer behavior, smart tariff guidance, household usage profiling.

### Why Knowly doesn't fit
- Tauron is an **energy company** — the judging will heavily weight relevance to energy/electricity
- Our platform is about **financial literacy** — different domain, different customer, different data
- No AI features in the current build (all game logic is hardcoded/static)
- We'd need to build an entirely different product or do a very forced stretch (e.g. "energy bills are a financial decision" — judges would see through it)
- The prize is large (5K PLN) but competition will be strong and domain-specific

### Verdict
Not worth the distraction. Focus energy on PKO (primary) and Kolektyw3 (secondary, if time permits).

---

## Priority Order

| # | Track | Effort | Prize | Verdict |
|---|-------|--------|-------|---------|
| 1 | PKO XP Gaming | Already built | Main track | ✅ Submit as-is |
| 2 | ETHWarsaw x Kolektyw3 | 4–6h additions | 2,000 PLN | 🟡 Worth attempting if time |
| 3 | Tauron AI | Full rebuild | 5,000 PLN | 🔴 Skip |

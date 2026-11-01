# Frontend Engineer Battles — CCG Game Design Spec

**Version**: 0.1 — Initial Design
**Date**: 2026-07-16
**Designer**: Game Designer Agent

---

## Goal / Player Fantasy

Two frontend engineers duel using the tools, frameworks, and war stories of modern web development — summon React components, deploy CSS Curses, and crush your opponent's stack before they ship first.

---

## Core Loop

```
Draw Phase → Play Phase → Battle Phase → Resolution Phase → End of Turn
```

Each turn takes **~15–25 seconds**. A full match targets **90–120 seconds** (2 minutes max).

1. **Draw** — Draw 1 card at the start of your turn.
2. **Play** — Spend Bandwidth (mana equivalent) to play Creatures, Spells, or Instants.
3. **Battle** — Declare attackers; opponent declares blockers.
4. **Resolution** — Combat damage resolves; Spells/Instants on the stack resolve.
5. **End of Turn** — Discard to hand limit (6 cards); turn passes.

---

## Mechanics & Rules

### 1. Resources — Bandwidth

- Each player has a **Bandwidth** track (0–10).
- At the start of your turn, your Bandwidth **resets to current max** (like MTG lands, but automatic).
- Max Bandwidth increases by **+1 per turn**, capped at **10**.
  - Turn 1 = 1 Bandwidth, Turn 2 = 2 Bandwidth, …, Turn 10+ = 10 Bandwidth.
- No land cards. This keeps the game fast and eliminates mana-screw.

**Rationale**: Automatic ramp removes a major source of slow/dead turns, keeping 2-minute games viable.

---

### 2. Card Types

#### A. Creatures — "Components"
Persistent units that exist on the battlefield.

| Property | Description |
|---|---|
| **Cost** | Bandwidth cost to play (1–8) |
| **Power** | Damage dealt in combat |
| **Toughness** | Damage required to destroy it |
| **Summoning Lag** | Enters tapped (cannot attack/block turn it is played). Exception: cards with **"No SSR"** keyword. |

**Examples:**
- `<Button />` — Cost 1, Power 1, Toughness 1. Vanilla.
- `React.memo` — Cost 2, Power 2, Toughness 2. **Cached**: When blocked, deal 1 damage to attacker before combat damage.
- `Redux Store` — Cost 3, Power 1, Toughness 4. **Global State**: While in play, your other Creatures get +1 Power.
- `Legacy jQuery` — Cost 2, Power 3, Toughness 2. **Tech Debt**: At end of each turn, it deals 1 damage to you.
- `Web Worker` — Cost 4, Power 3, Toughness 3. **Non-blocking**: Can attack on the turn it is played (has "No SSR").
- `Next.js SSR` — Cost 5, Power 4, Toughness 5. **Hydration**: When it enters play, draw 1 card.
- `TypeScript Compiler` — Cost 6, Power 5, Toughness 6. **Strict Mode**: Opposing Spells cost +1 Bandwidth to play while this is in play.

---

#### B. Spells — "Deployments"
One-time effects that resolve immediately. Played during your Play Phase only.

**Examples:**
- `npm install` — Cost 2. Draw 2 cards.
- `git revert` — Cost 3. Return target Creature to its owner's hand.
- `CSS Override !important` — Cost 1. Target Creature gets +2 Power until end of turn.
- `404 Not Found` — Cost 2. Destroy target Creature with Power 2 or less.
- `Bundle Split` — Cost 3. Search your deck for any 1 card; add it to your hand.
- `Hotfix Deploy` — Cost 4. Deal 4 damage directly to opponent's HP.
- `Dependency Hell` — Cost 5. Opponent discards 2 cards.

---

#### C. Instants — "Hotfixes"
Can be played **at any time**, including during the opponent's turn or during Battle Phase, before combat damage resolves. This is the main source of decision tension.

**Examples:**
- `console.error` — Cost 1. Target Creature gets -2 Power until end of turn.
- `Try/Catch` — Cost 2. Prevent all damage to target Creature this turn.
- `CORS Block` — Cost 2. Counter target Spell (it has no effect and is discarded).
- `Infinite Loop` — Cost 3. Target Creature cannot attack or block this turn.
- `Race Condition` — Cost 2. Before combat damage, swap target attacker and blocker's Power/Toughness until end of combat.

---

### 3. Player Stats

| Stat | Starting Value | Description |
|---|---|---|
| **HP** (Health Points) | 20 | Reach 0 = lose |
| **Hand Size** | 4 starting cards | Max 6 at end of turn; discard excess |
| **Deck Size** | 30 cards | Min 20, max 30 per deck construction rule |

---

### 4. Win / Loss Conditions

- **Win**: Reduce opponent's HP to 0.
- **Win by deck-out**: If a player must draw but has no cards, they lose.
- **Draw**: If both players reach 0 HP simultaneously on the same turn, the game is a draw.
- **Time limit**: If the 2-minute timer expires, the player with higher HP wins. If tied on HP, the player with more Creatures in play wins. If still tied, the game is a draw.

---

### 5. Combat Rules

1. **Declare Attackers**: Active player taps any untapped Creatures and declares them as attackers.
2. **Declare Blockers**: Defending player assigns any of their untapped Creatures to block individual attackers. One blocker per attacker (no multi-blocking for simplicity).
3. **Instant Window**: Both players may play Instants now (in priority order: active player first, then defending player, alternating until both pass).
4. **Combat Damage**:
   - Each attacking Creature unblocked → deals its Power as damage directly to opponent's HP.
   - Blocked pairs → deal damage simultaneously to each other.
   - A Creature with damage ≥ its Toughness is destroyed and sent to the **Graveyard** (discard pile).
5. **Creatures do not tap when attacking** — they can still be relevant for blocking next turn (unlike MTG). This speeds up the game.

---

### 6. Turn Structure (Detailed)

```
START OF TURN
  1. Bandwidth resets to current max
  2. Untap all your Creatures
  3. Draw 1 card

PLAY PHASE
  - Play any number of cards while you have Bandwidth
  - Instants can be played by either player during this phase (active player has priority)

BATTLE PHASE
  4. Declare attackers (optional)
  5. Opponent declares blockers
  6. Instant window (both players)
  7. Combat damage resolves
  8. Destroyed Creatures go to Graveyard

END OF TURN
  9. Discard to hand limit (6)
  10. Pass turn
```

---

### 7. Stack (Simplified)

To keep games under 2 minutes, the stack is **simplified**:
- Only **Instants** and **Spells** go on the stack, not Creature abilities.
- Instants played in response resolve in **LIFO order** (last in, first out) — standard MTG stack.
- Maximum **2 Instants** can be chained per window to prevent slow loops.
- Creature triggered abilities resolve immediately without a stack window.

---

### 8. Keywords

| Keyword | Effect |
|---|---|
| **No SSR** | Can attack or block the turn it enters play (no Summoning Lag) |
| **Cached** | First time this Creature would take damage, prevent it (once per game per card) |
| **Global State** | While in play, provides a passive bonus to all your Creatures |
| **Tech Debt** | Deals damage to its controller at end of each turn |
| **Non-blocking** | Same as No SSR |
| **Strict Mode** | Increases cost of a specific card type for the opponent |

---

## Systems

### Deck Construction

- Deck: 30 cards (minimum 20, maximum 30)
- Max **3 copies** of any single card per deck
- Minimum card distribution suggestion (to avoid boring hands):
  - At least 8 Creatures
  - At least 4 Instants
  - Remaining: Spells / more Creatures

### Starting Hand & Mulligan

- Draw **4 cards** at game start.
- **One free mulligan**: Shuffle hand back, draw 4 new cards. No penalty.
- No further mulligans (keeps game fast).

### Graveyard

- Destroyed Creatures and used Spells/Instants go to the Graveyard (visible discard pile).
- No graveyard recursion in v1.0 (keeps complexity low).

---

## Balance Notes

| Parameter | Value | Rationale |
|---|---|---|
| Starting HP | 20 | Low enough that 4–6 unblocked swings can end the game, but high enough for counterplay |
| Starting hand | 4 cards | Enough to have a play on Turn 1 but not overwhelming to new players |
| Max Bandwidth | 10 | Caps big-spell power; high-cost cards (7–8) require commitment but not impossible |
| Auto-ramp | +1/turn | Ensures game reaches mid-game even in 2-minute sessions (~Turn 5–6 typically decides) |
| Hand limit | 6 | Prevents hand-hoarding value engines; forces tempo decisions |
| Deck size | 30 | Small enough for consistency, large enough for deck identity |
| Stack chain limit | 2 | Prevents "counter-war" turns that consume >20 seconds |
| No tapping attackers | — | Speeds up back-and-forth board presence; both players always have blockers |
| Summoning Lag | 1 turn | Prevents turn-1 kills; forces the opponent to play around known threats |

**Degenerate Cases to Watch:**
- **Infinite direct damage combo**: Hotfix Deploy (4 damage) + any damage doubler could one-shot from high HP. Monitor direct damage sources.
- **Lock strategies**: `TypeScript Compiler` + `CORS Block` could create near-unbreakable denial. Limit "counter-counter" interactions in v1.
- **Legacy jQuery self-damage**: Aggro players may abuse high-power Tech Debt cards before they become liabilities. Watch if 3x copies creates a dominant aggro archetype.
- **Auto-ramp late game**: At Turn 9–10, playing a 10-cost card is possible but the game should have ended by then. If it hasn't, late-game swingy cards are a design risk.

---

## Open Questions / Risks

1. **2-minute enforcement**: Is the timer per match or a soft expectation? Needs a clear UI timer with visual warning at 30 seconds.
2. **Instants on opponent's turn**: This is the most complex rule. For v1, consider restricting Instants to the Battle Phase only (removes full stack priority) if playtesting shows it's too slow.
3. **Deck building UX**: Do players pre-build decks or draft? Draft would slow onboarding. Recommend pre-built starter decks for v1.
4. **Tie-breaking**: HP tie-break by Creature count is simple but may favor specific archetypes. Consider total Power of Creatures in play instead.
5. **Card art / flavour text**: Frontend theme is strong for flavour — CSS Curses, npm install, console.error — but needs visual execution to land. (UX Designer's concern.)
6. **Card set size**: How many cards in the base set? Recommend 60 cards for v1 (enough for 2–3 viable archetypes).

---

## Handoff

### For Architect
- **Card data model**: Each card needs `id`, `name`, `type` (Creature/Spell/Instant), `cost`, `power?`, `toughness?`, `keywords[]`, `effect_text`, `flavour_text`.
- **Game state machine**: States are `draw`, `play`, `battle_declare_attackers`, `battle_declare_blockers`, `battle_instant_window`, `combat_damage`, `end_of_turn`.
- **Player state**: `hp`, `bandwidth_current`, `bandwidth_max`, `hand[]`, `deck[]`, `battlefield[]`, `graveyard[]`.
- **Stack**: ordered list of `{card, controller, targets[]}` entries; resolved LIFO.
- **Timer**: match-level timer (120s); pause during animations only, not during opponent decision time.

### For Developer
- Game is turn-based; no real-time mechanics except the top-level match timer.
- All Creature abilities are text-parsed in v1 (no scripted ability system needed); complex abilities can be hardcoded per card ID.
- Client-server: game state lives server-side; players send **actions** (play card, declare attacker, declare blocker, play instant, pass priority). Server validates and broadcasts new state.
- **Priority passing**: simplify with "active player acts, then defending player acts" rather than full MTG priority. Cap at 2 Instant responses per window.
- 1v1 only in v1.0.

### For UX Designer
- The most critical screen is the **battlefield view**: both players' HP, Bandwidth track, hand, and battlefield must be legible at a glance.
- Summoning Lag must be visually obvious (tapped / dimmed state on entry).
- Timer must be prominent and provide a "low time" warning state.
- Card types (Creature / Spell / Instant) must be instantly distinguishable by shape or color system.
- Figma deliverable needed: main battlefield screen, card component (front + back + tapped states), and turn phase indicator.

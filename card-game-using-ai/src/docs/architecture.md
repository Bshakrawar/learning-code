# Frontend Engineer Battles — Technical Architecture Spec

**Version**: 0.1 — MVP  
**Date**: 2026-07-16  
**Architect**: Architect Agent  
**Stack**: Phaser.js 3 · Vite · TypeScript

---

## Problem / Goal

Design a minimal, runnable MVP architecture for a 1v1 CCG using Phaser.js and Vite that can execute a full match loop (draw → play → battle → resolution → end of turn) within a 2-minute timer, with local hot-reload development.

---

## Scope Boundaries (MVP)

| In scope | Out of scope |
|---|---|
| Local 1v1 (same machine, shared keyboard/mouse) | Networked multiplayer |
| Pre-built starter decks | Deck builder UI |
| Hardcoded card effects | Scripted ability DSL |
| Single Phaser scene stack | Lobby / matchmaking |
| In-memory game state | Persistence / save system |

---

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Vite Dev Server)         │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │               Phaser 3 Game                  │   │
│  │                                              │   │
│  │  ┌────────────┐   ┌────────────────────────┐ │   │
│  │  │  Scene     │   │     Game State          │ │   │
│  │  │  Manager   │──▶│     (Plain TS objects)  │ │   │
│  │  └─────┬──────┘   └────────────────────────┘ │   │
│  │        │                    ▲                 │   │
│  │  ┌─────▼──────────────────┐ │                 │   │
│  │  │       Scenes           │ │                 │   │
│  │  │  BootScene             │ │                 │   │
│  │  │  PreloadScene          │ │                 │   │
│  │  │  MenuScene             │ │                 │   │
│  │  │  BattleScene ◀─────────┘ │                 │   │
│  │  │  GameOverScene          │                 │   │
│  │  └────────────────────────┘                  │   │
│  │                                              │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │           Systems (logic)              │  │   │
│  │  │  GameEngine  CardSystem  CombatSystem  │  │   │
│  │  │  TimerSystem TurnSystem  StackSystem   │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  │                                              │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │           UI Components (Phaser GO)    │  │   │
│  │  │  CardObject  HandZone  BattlefieldZone  │  │   │
│  │  │  HPBar  BandwidthBar  PhaseIndicator   │  │   │
│  │  │  TimerDisplay  StackDisplay            │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
card-game-using-ai/
├── src/
│   ├── main.ts                  # Phaser game bootstrap
│   ├── config.ts                # Phaser game config + constants
│   │
│   ├── scenes/
│   │   ├── BootScene.ts         # Asset registration
│   │   ├── PreloadScene.ts      # Asset loading + progress bar
│   │   ├── MenuScene.ts         # Title screen, "Start Game" button
│   │   ├── BattleScene.ts       # Main game loop scene
│   │   └── GameOverScene.ts     # Win/loss/draw display
│   │
│   ├── game/
│   │   ├── GameEngine.ts        # Orchestrates all systems; owns GameState
│   │   ├── TurnSystem.ts        # Turn order, phase transitions, priority
│   │   ├── CombatSystem.ts      # Attacker/blocker declaration, damage calc
│   │   ├── CardSystem.ts        # Play card, validate cost, apply effect
│   │   ├── StackSystem.ts       # Simplified LIFO instant/spell stack
│   │   └── TimerSystem.ts       # Match-level 120s countdown
│   │
│   ├── state/
│   │   ├── GameState.ts         # Central state shape (interfaces + factories)
│   │   ├── PlayerState.ts       # Per-player state shape
│   │   └── PhaseEnum.ts         # Enum: DRAW | PLAY | BATTLE_ATTACKERS |
│   │                            #       BATTLE_BLOCKERS | INSTANT_WINDOW |
│   │                            #       COMBAT_DAMAGE | END_OF_TURN
│   │
│   ├── data/
│   │   ├── cards.ts             # Card definitions (all 60 base-set cards)
│   │   ├── decks.ts             # Two starter decks (Player 1 & Player 2)
│   │   └── CardDefinition.ts    # Card type interfaces
│   │
│   ├── ui/
│   │   ├── CardObject.ts        # Phaser GameObject: card visual + interaction
│   │   ├── HandZone.ts          # Lays out cards in hand
│   │   ├── BattlefieldZone.ts   # Manages creature placement on board
│   │   ├── HPBar.ts             # HP display for a player
│   │   ├── BandwidthBar.ts      # Bandwidth track (current / max pips)
│   │   ├── PhaseIndicator.ts    # Shows current phase label
│   │   ├── TimerDisplay.ts      # Countdown clock; pulses red < 30s
│   │   └── TargetSelector.ts    # Highlights valid targets for a card effect
│   │
│   └── docs/
│       ├── game-design.md
│       └── architecture.md      ← this file
│
├── public/
│   └── assets/
│       ├── cards/               # Card face images (PNG per card ID)
│       ├── ui/                  # HP bars, backgrounds, buttons
│       └── audio/               # SFX (optional in MVP)
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Core Data Models

### CardDefinition
```
CardDefinition {
  id: string                  // e.g. "react-memo"
  name: string                // Display name
  type: "Creature" | "Spell" | "Instant"
  cost: number                // Bandwidth cost (1–10)
  power?: number              // Creatures only
  toughness?: number          // Creatures only
  keywords: Keyword[]         // "NoSSR" | "Cached" | "TechDebt" | ...
  effectId: string | null     // Key into a hardcoded effect handler map
  flavourText: string
}
```

### GameState
```
GameState {
  phase: PhaseEnum
  activePlayer: 0 | 1
  turnNumber: number
  matchTimer: number          // seconds remaining (120 → 0)
  stack: StackEntry[]         // max 2 entries
  winner: null | 0 | 1 | "draw"
  players: [PlayerState, PlayerState]
}
```

### PlayerState
```
PlayerState {
  id: 0 | 1
  hp: number                  // 0–20
  bandwidthCurrent: number
  bandwidthMax: number        // 1–10, increases each turn
  hand: CardInstance[]        // max 6
  deck: CardInstance[]        // draw pile
  battlefield: CardInstance[] // in-play creatures
  graveyard: CardInstance[]
}
```

### CardInstance
```
CardInstance {
  instanceId: string          // UUID — unique per copy in play
  definitionId: string        // References CardDefinition
  damageTaken: number
  isTapped: boolean           // True when summoning lag active
  canAttack: boolean
}
```

---

## Scene Flow

```
BootScene
  └─▶ PreloadScene (load assets)
        └─▶ MenuScene
              └─▶ BattleScene (main loop)
                    ├─▶ GameOverScene (win/loss)
                    │     └─▶ MenuScene (rematch)
                    └─▶ (restart) BattleScene
```

---

## Game Engine — Phase State Machine

`GameEngine` owns the `GameState` and drives phase transitions. `BattleScene` calls `GameEngine` methods and reacts to emitted events to update the UI.

```
DRAW
  │  GameEngine.drawPhase()
  │  - Increment bandwidthMax (+1, cap 10)
  │  - Reset bandwidthCurrent = bandwidthMax
  │  - Untap all Creatures
  │  - Draw 1 card (deck → hand)
  │  - If deck empty → opponent wins
  ▼
PLAY
  │  Player plays cards by clicking hand cards
  │  GameEngine.playCard(cardInstanceId, targets?)
  │  - Validate: bandwidthCurrent >= cost
  │  - Deduct bandwidth
  │  - Apply effect or place creature
  │  - Spells/Instants go to graveyard after resolving
  │  Player clicks "Attack" button to proceed
  ▼
BATTLE_ATTACKERS
  │  Active player clicks creatures to toggle as attackers
  │  Player clicks "Confirm Attackers"
  ▼
BATTLE_BLOCKERS
  │  Defending player drags their creatures onto attackers
  │  Player clicks "Confirm Blockers"
  ▼
INSTANT_WINDOW
  │  Both players may play Instant cards (max 2 total)
  │  Each player has a "Pass Priority" button
  │  Both pass → proceed
  ▼
COMBAT_DAMAGE
  │  CombatSystem.resolve()
  │  - Unblocked attackers → damage to opponent HP
  │  - Blocked pairs → simultaneous damage
  │  - Creatures with damage >= toughness → graveyard
  │  - Check win condition
  ▼
END_OF_TURN
  │  Discard to hand limit (6); active player chooses
  │  Pass turn → activePlayer flips (0↔1)
  └─▶ DRAW (next player)
```

---

## Key System Responsibilities

### `GameEngine.ts`
- Single source of truth: owns and mutates `GameState`
- Exposes one method per legal action: `drawPhase()`, `playCard()`, `declareAttacker()`, `declareBlocker()`, `playInstant()`, `passPriority()`, `confirmBlockers()`, `endTurn()`
- Validates all actions before applying; throws descriptive errors on illegal moves
- Emits typed events (`stateChanged`, `cardPlayed`, `creatureDestroyed`, `gameOver`) that `BattleScene` listens to for rendering updates
- Does **not** know about Phaser — pure logic only

### `BattleScene.ts`
- Owns all Phaser GameObjects
- Listens to `GameEngine` events and re-renders affected UI components
- Translates player input (clicks, drags) into `GameEngine` action calls
- Runs the Phaser game loop; `TimerDisplay` reads from `GameState.matchTimer`

### `CardSystem.ts`
- Resolves card effects via a **hardcoded handler map**: `{ [effectId: string]: (state, actor, targets) => void }`
- MVP: each unique card effect is one handler function
- No scripting engine; effect IDs are string keys defined in `cards.ts`

### `CombatSystem.ts`
- Stateless helper: takes attackers/blockers lists and returns damage events
- `BattleScene` applies the events to `GameState` via `GameEngine`

### `StackSystem.ts`
- Manages the simplified stack (max 2 entries)
- LIFO resolution: pops and calls `CardSystem.resolve()` on each entry
- Exposes `canPushToStack(state)` guard (returns false if stack already has 2 entries)

---

## Communication Pattern (No Framework)

`GameEngine` is a plain TypeScript `EventEmitter` (Node-style, or a lightweight custom one). `BattleScene` subscribes:

```
engine.on('stateChanged', (patch) => scene.syncUI(patch))
engine.on('gameOver', (result) => scene.showGameOver(result))
```

This keeps game logic completely decoupled from Phaser rendering. Unit-testable without a browser.

---

## Vite Config (Key Points)

- **Entry**: `src/main.ts`
- **Aliases**: `@game → src/game`, `@ui → src/ui`, `@data → src/data`, `@state → src/state`
- **Assets**: served from `public/assets/`; Phaser loads via `this.load.image(key, 'assets/...')`
- **Dev server**: port 3000; HMR enabled — scene code hot-reloads without full page refresh
- **Build**: `dist/` with code splitting disabled (single bundle for MVP simplicity)

---

## Phaser Config (Key Points)

```
{
  type: Phaser.AUTO,           // WebGL with Canvas fallback
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, PreloadScene, MenuScene, BattleScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
}
```

- Fixed 1280×720 logical canvas; scales to window.
- No physics system needed (card game; positional logic only).
- Input: Pointer (mouse/touch). No keyboard bindings in MVP.

---

## Card Effect Handler Map (MVP subset)

All effects are resolved synchronously. The handler map lives in `CardSystem.ts`:

```
"draw-2"           → draw 2 cards for actor
"return-creature"  → return target creature to owner's hand
"power-boost"      → target creature +2 Power until end of turn
"destroy-weak"     → destroy target creature with Power ≤ 2
"tutor"            → search deck for 1 card, add to hand, shuffle deck
"direct-damage-4"  → deal 4 damage to opponent HP
"discard-2"        → opponent discards 2 cards
"power-minus-2"    → target creature -2 Power until end of turn
"prevent-damage"   → prevent all damage to target creature this turn
"counter-spell"    → remove top stack entry (counter a Spell/Instant)
"stun-creature"    → target creature cannot attack or block this turn
"swap-stats"       → swap attacker/blocker Power and Toughness until end of combat
```

---

## Trade-offs

| Decision | Alternative | Why chosen |
|---|---|---|
| Local 1v1 (no server) | WebSocket multiplayer | Removes entire networking layer for MVP; fastest to playable |
| Plain TS EventEmitter | Redux / Zustand | No extra dependencies; engine is test-friendly; can swap later |
| Hardcoded effect handlers | Scripted DSL | DSL adds a parser/runtime; 12 effects don't justify it yet |
| Single Phaser bundle | Code splitting | One less config concern; bundle is small at MVP card count |
| Fixed 1280×720 + FIT scale | Fully responsive layout | Phaser FIT handles most screen sizes; saves layout complexity |
| In-memory state only | LocalStorage save | Turn duration is 15–25s; no meaningful save points exist in MVP |

---

## Risks

1. **Phase transition bugs**: The state machine has 7 phases with multiple legal exit conditions (pass, confirm, play instant). Incorrect phase guards will cause unresponsive UI. Mitigation: write a state transition unit test for each phase before UI work begins.

2. **Card effect side-effects on shared state**: Handlers mutate `GameState` directly. Without immutable state snapshots, debugging "what changed" is hard. Mitigation: log a shallow diff in dev mode on every `stateChanged` event.

3. **Instant window UX**: Two players sharing one screen during the Instant Window creates input confusion. Mitigation: freeze the active player's inputs and show a clear "Opponent's Priority" overlay; limit the window to 10 seconds with auto-pass.

4. **Phaser HMR + scene state**: Vite HMR can reload scene modules without resetting Phaser's scene manager, leaving stale scene instances. Mitigation: on HMR, force `game.destroy(true)` and re-mount.

5. **Card count for MVP**: 60 card definitions is a lot of data entry before gameplay is testable. Mitigation: implement with 12–15 cards first (the examples from the game design spec), wire all systems, then expand the card set.

---

## Implementation Order (Developer Handoff)

Follow this order to have something runnable at each stage:

1. **Project scaffold** — Vite + TypeScript + Phaser 3 install; `BootScene → PreloadScene → MenuScene` shell.
2. **Data layer** — `CardDefinition`, `GameState`, `PlayerState`, `PhaseEnum` interfaces + 15 starter cards in `cards.ts` + 2 starter decks in `decks.ts`.
3. **GameEngine core** — `TurnSystem` (draw phase, end of turn) + basic `PLAY` phase with bandwidth deduction. No combat yet.
4. **BattleScene UI** — `HandZone`, `BattlefieldZone`, `HPBar`, `BandwidthBar`, `PhaseIndicator`. Wire to `stateChanged` events.
5. **CardSystem** — Implement the 12 effect handlers. Creatures enter battlefield; Spells/Instants resolve and discard.
6. **Combat** — `CombatSystem`, `BATTLE_ATTACKERS`, `BATTLE_BLOCKERS`, `COMBAT_DAMAGE` phases + `CardObject` tapped/untapped visuals.
7. **StackSystem + Instant Window** — `StackSystem`, `INSTANT_WINDOW` phase, `TargetSelector` UI.
8. **TimerSystem + GameOverScene** — Match timer, win/loss/draw detection, `GameOverScene`.
9. **Polish** — `TimerDisplay` pulse, card animations (slide to battlefield, flip to graveyard), SFX.

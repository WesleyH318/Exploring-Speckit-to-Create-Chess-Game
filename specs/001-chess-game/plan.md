# Implementation Plan: Chess Game

**Branch**: `001-chess-game` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-chess-game/spec.md`

## Summary

Build a browser-based chess game for local hot-seat play (two
players on the same device). The core deliverable is a pure
TypeScript chess engine that enforces all standard chess rules,
paired with a React UI that renders the board, handles player
interaction, displays move history in algebraic notation, and
persists game state across page refreshes. No backend server
is needed.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, Vite 6
**Storage**: localStorage (browser-side, JSON serialization)
**Testing**: Vitest + React Testing Library
**Target Platform**: Modern web browsers (Chrome, Firefox,
Safari, Edge — latest 2 major versions)
**Project Type**: Single project (client-side web application)
**Performance Goals**: First move within 5 seconds of page load;
move validation imperceptible to user (<50ms)
**Constraints**: No server required; game state <5 KB in
localStorage; works offline after initial load
**Scale/Scope**: Single game at a time, 2 local players, ~15
source files, ~2000-3000 lines of TypeScript

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after
Phase 1 design.*

### Pre-Research Gate (Phase 0)

| # | Principle | Gate | Status |
|---|-----------|------|--------|
| I | Quality & Testing | Test plan defined for engine and UI | PASS |
| II | Simplicity | No unnecessary abstractions; single project, no server | PASS |
| III | Separation of Concerns | Engine module has zero UI dependencies | PASS |
| IV | Correctness | All standard chess rules in scope (FR-002 through FR-010, FR-015, FR-016) | PASS |
| V | Maintainability | Domain-specific naming convention established | PASS |

### Post-Design Gate (Phase 1)

| # | Principle | Gate | Status |
|---|-----------|------|--------|
| I | Quality & Testing | Unit tests for engine, component tests for UI, integration tests for flows | PASS |
| II | Simplicity | useReducer (no external state lib); 8x8 array (no bitboard); pseudo-legal + filter (no complex generation) | PASS |
| III | Separation of Concerns | `src/engine/` imports nothing from `src/components/`; data flows UI → engine only | PASS |
| IV | Correctness | All rules covered in engine API contract; deterministic pure functions | PASS |
| V | Maintainability | Functions named `isKingInCheck`, `getValidMoves`, `toAlgebraicNotation` per constitution examples | PASS |

### Technical Standards Check

| Standard | Status | Notes |
|----------|--------|-------|
| Frontend/backend separation | PASS (with deviation) | `src/engine/` and `src/components/` instead of `frontend/`/`backend/` dirs. See Complexity Tracking. |
| Dependencies pinned | PASS | package-lock.json with exact versions |
| Server-side validation | N/A | No server; all validation in engine module |
| Graceful error handling | PASS | Engine returns typed errors, UI displays feedback |
| Environment config via env vars | PASS | Vite env vars for any config needed |

**All gates PASS. No blockers.**

## Project Structure

### Documentation (this feature)

```text
specs/001-chess-game/
├── plan.md              # This file
├── research.md          # Phase 0: tech decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: setup & usage guide
├── contracts/
│   └── engine-api.md    # Phase 1: engine module API
├── checklists/
│   └── requirements.md  # Spec quality validation
└── tasks.md             # Phase 2: task list (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── engine/              # Pure chess logic (no UI deps)
│   ├── types.ts         # Shared types: Piece, Square, Game, etc.
│   ├── board.ts         # Board creation, piece queries, attack detection
│   ├── moves.ts         # Move generation, validation, legality check
│   ├── game.ts          # Game state: makeMove, resign, draw claims
│   └── notation.ts      # Algebraic notation, position hashing
├── components/          # React UI components
│   ├── Board.tsx        # 8x8 grid container
│   ├── Square.tsx       # Single square (piece + highlight)
│   ├── Piece.tsx        # Piece icon/symbol rendering
│   ├── MoveHistory.tsx  # Scrollable notation panel
│   ├── GameControls.tsx # New Game, Resign, Offer Draw buttons
│   ├── PromotionDialog.tsx # Piece picker for pawn promotion
│   └── GameStatus.tsx   # Turn indicator, check/mate/draw display
├── hooks/
│   └── useChessGame.ts  # useReducer-based game state hook
├── App.tsx              # Root layout: board + sidebar
├── App.css              # Application styles
└── main.tsx             # Vite entry point

tests/
├── unit/                # Engine-only tests (no React)
│   ├── board.test.ts    # Starting position, piece queries, attacks
│   ├── moves.test.ts    # Move generation for all piece types
│   ├── game.test.ts     # makeMove, resign, draw claims, status
│   └── notation.test.ts # SAN output, position hashing
├── integration/         # React + engine combined
│   ├── gameplay.test.tsx     # Full game to checkmate
│   ├── specialMoves.test.tsx # Castling, en passant, promotion UI
│   └── drawDetection.test.tsx # Repetition, fifty-move via UI
└── setup.ts             # Vitest config, test utilities
```

**Structure Decision**: Single project with `src/engine/` and
`src/components/` directories. The engine module is the
"backend" (pure game logic), and components are the "frontend"
(React UI). No HTTP server or separate backend directory since
the application is entirely client-side. This satisfies
Separation of Concerns while respecting Simplicity.

## Complexity Tracking

> **Deviation from constitution Technical Standards documented**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| No `frontend/` and `backend/` directories | Application is entirely client-side; there is no server process. Using `src/engine/` (logic) and `src/components/` (UI) achieves the same separation within a single project. | Creating a `backend/` directory with an Express/Fastify server would add an unnecessary process, HTTP serialization overhead, and deployment complexity for zero benefit in a local-only game. This would violate Principle II (Simplicity). |

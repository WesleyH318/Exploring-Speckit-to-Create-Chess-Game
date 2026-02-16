# Research: Chess Game

**Branch**: `001-chess-game` | **Date**: 2026-02-16

## R1: Language & Framework

**Decision**: TypeScript 5.x + React 19 + Vite 6

**Rationale**: TypeScript provides type safety critical for
modeling complex chess state (piece types, board positions,
move validation). React's component model maps naturally to
a chess board (Board → Square → Piece). Vite provides fast
HMR for iterative UI development.

**Alternatives considered**:
- Vanilla TypeScript: Lower bundle size but requires manual
  DOM management; component model too valuable for board UI.
- Vue 3: Comparable capabilities but React has broader
  ecosystem for chess-related libraries if needed.
- Plain JavaScript: Loses type safety which is essential for
  modeling chess rules correctly (discriminated unions for
  piece types, move types).

## R2: Board Representation

**Decision**: 8x8 two-dimensional array with `Piece | null`
per square.

**Rationale**: Simplest representation that maps directly to
the visual board. For a browser-based game without AI search,
performance of move generation is not a bottleneck. An 8x8
array is easy to reason about, debug, and serialize.

**Alternatives considered**:
- 0x88 board: Uses a 128-element array for fast off-board
  detection. Useful for engines with deep search but
  unnecessary complexity for this use case.
- Bitboards: 64-bit integers per piece type. Extremely fast
  for engine computation but unreadable, hard to debug, and
  overkill for a UI-focused game without AI.
- 1D array (64 elements): Slightly less readable than 2D
  but functionally equivalent. 2D array chosen for clarity.

## R3: Move Generation Approach

**Decision**: Pseudo-legal generation followed by legality
filtering.

**Rationale**: Generate all candidate moves for a piece based
on its movement rules, then filter out moves that would leave
the own King in check. This two-step approach is simpler to
implement and reason about than directly generating only legal
moves.

**Steps**:
1. For each piece, generate all squares it could move to
   based on its type's movement pattern.
2. For each candidate move, simulate the move on a copy of
   the board.
3. Check if the own King is attacked in the resulting position.
4. If not attacked, the move is legal.

**Alternatives considered**:
- Direct legal move generation: Tracks pins and check rays
  to only generate legal moves. More efficient but
  significantly more complex to implement. Not needed when
  there is no AI search.

## R4: State Management

**Decision**: React `useReducer` with a game state reducer.

**Rationale**: Chess game state transitions map perfectly to
a reducer pattern: each action (move, resign, new game) produces
a new state deterministically. `useReducer` is built into React,
requires no additional dependencies, and makes state transitions
explicit and testable.

**Alternatives considered**:
- Zustand: External state library. Adds a dependency for
  minimal benefit since game state is contained within a
  single component tree.
- Redux: Heavy for this use case. Game state does not require
  middleware, time-travel debugging, or complex selectors.
- useState: Works but becomes unwieldy with the number of
  state fields (board, turn, move history, castling rights,
  en passant, game status).

## R5: Persistence Strategy

**Decision**: `localStorage` with JSON serialization of game
state.

**Rationale**: The spec requires surviving page refresh only.
localStorage is synchronous, universally supported, and
sufficient for persisting a single game state object (~2-5 KB).

**Implementation**: Serialize the game state to JSON on every
move. On app load, check localStorage for a saved game and
restore it if present.

**Alternatives considered**:
- IndexedDB: Asynchronous, more complex API. Overkill for
  storing a single small JSON object.
- sessionStorage: Cleared when the tab closes; spec says
  "persist in browser" which implies surviving tab closure.
- No persistence: Violates FR-018.

## R6: Testing Strategy

**Decision**: Vitest for unit/integration tests, React Testing
Library for component tests.

**Rationale**: Vitest is fast, TypeScript-native, and
compatible with the Vite build tool. React Testing Library
tests components from the user's perspective (clicking squares,
seeing pieces) rather than testing implementation details.

**Test layers**:
- **Unit tests**: Chess engine module (move validation,
  check detection, special moves, notation). These are the
  most critical tests.
- **Component tests**: React components render correct board
  state, respond to clicks, show move history.
- **Integration tests**: Full game flows (play to checkmate,
  castling sequence, pawn promotion dialog).

**Alternatives considered**:
- Jest: Slower startup, requires more configuration for
  TypeScript + ESM. Vitest is a drop-in replacement with
  better Vite integration.
- Cypress/Playwright for e2e: Could be added later but not
  needed for MVP. Component tests with React Testing Library
  cover the critical UI interactions.

## R7: Algebraic Notation

**Decision**: Implement Standard Algebraic Notation (SAN)
as defined by FIDE.

**Format**: Piece letter + destination square, with modifiers
for capture (x), check (+), checkmate (#), castling (O-O,
O-O-O), and disambiguation (file or rank prefix when ambiguous).

**Examples**: `e4`, `Nf3`, `Bxe5`, `O-O`, `Qd1+`, `R1a3`,
`e8=Q`.

**Rationale**: SAN is the universal standard for recording
chess moves. Using it ensures the notation is recognizable
to any chess player.

## R8: Architecture (Constitution Compliance)

**Decision**: Single-project structure with clear module
boundaries instead of separate `frontend/` and `backend/`
directories.

**Rationale**: The constitution's Technical Standards require
"frontend and backend MUST be clearly separated." For a purely
client-side application with no server, this is satisfied by
separating the chess engine module (`src/engine/`) from the
React UI (`src/components/`, `src/hooks/`). The engine module
has zero UI dependencies and is independently testable. A
separate backend directory with an HTTP server would violate
Principle II (Simplicity) since there is no server-side
functionality needed for local hot-seat play.

**Constitution gates satisfied**:
- **Separation of Concerns**: `src/engine/` is independent
  of React; imports flow one direction (UI → engine, never
  engine → UI).
- **Simplicity**: No unnecessary server process or HTTP layer.
- **Correctness**: Engine module is the single source of truth
  for all game rules.
- **Quality & Testing**: Engine tested with unit tests
  independent of React; UI tested with React Testing Library.
- **Maintainability**: Domain-specific naming throughout.

**Deviation documented**: The constitution says `frontend/`
and `backend/` directories. This plan uses `src/engine/` and
`src/components/` within a single project because there is no
backend server. This is recorded in the Complexity Tracking
section of plan.md.

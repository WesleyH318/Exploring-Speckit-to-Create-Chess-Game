# Tasks: Chess Game

**Input**: Design documents from `/specs/001-chess-game/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/engine-api.md

**Tests**: Included per constitution Principle I (Quality & Testing) which mandates TDD. Tests are written first in each phase, verified to fail, then implementation follows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization and tooling configuration

- [x] T001 Initialize Vite + React + TypeScript project with `npm create vite@latest` and install dependencies (react, react-dom) in project root
- [x] T002 [P] Configure Vitest and React Testing Library: install vitest, @testing-library/react, @testing-library/jest-dom, jsdom; create vitest.config.ts and tests/setup.ts
- [x] T003 [P] Configure ESLint for TypeScript + React: install eslint, typescript-eslint, eslint-plugin-react-hooks; create eslint.config.js
- [x] T004 Create directory structure: src/engine/, src/components/, src/hooks/, tests/unit/, tests/integration/

**Checkpoint**: `npm run dev` starts dev server, `npm run test` runs (0 tests), `npm run lint` passes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and board infrastructure that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Define all shared types and enums in src/engine/types.ts: PieceType, PieceColor, GameStatus, MoveType, Square, Piece, Move, CastlingRights, BoardPosition, Game, MoveError, DrawClaimError per data-model.md
- [x] T006 Write unit tests for board module in tests/unit/board.test.ts: createStartingPosition returns correct 32-piece layout, getPieceAt returns correct pieces and null for empty squares, isSquareAttacked detects attacks by all piece types
- [x] T007 Implement createStartingPosition and getPieceAt in src/engine/board.ts: 8x8 array initialization with standard piece placement per data-model.md
- [x] T008 Implement isSquareAttacked in src/engine/board.ts: check if any piece of a given color attacks a target square by testing all attack patterns (sliding pieces along diagonals/ranks/files, knight jumps, pawn captures, king adjacency)
- [x] T009 Write unit tests for createGame in tests/unit/game.test.ts: verify createGame returns Game with starting position, InProgress status, White to move, empty history, all castling rights
- [x] T010 Implement createGame in src/engine/game.ts: create Game object using createStartingPosition, set initial status and metadata per engine-api.md contract

**Checkpoint**: `npm run test` passes all board and createGame tests. Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Play a Local Chess Game (Priority: P1) MVP

**Goal**: Two players can play a complete chess game with full rule enforcement on the same device

**Independent Test**: Start a new game, play through normal moves, castling, en passant, pawn promotion, and play to checkmate/stalemate. Verify resign works.

### Tests for User Story 1 (TDD - write first, verify they fail)

- [x] T011 [P] [US1] Write unit tests for move generation in tests/unit/moves.test.ts: test getValidMoves for each piece type (pawn forward/capture/double-push, knight L-shape, bishop diagonal, rook rank/file, queen combined, king single-step), test moves blocked by own pieces, test captures of enemy pieces
- [x] T012 [P] [US1] Write unit tests for special moves in tests/unit/moves.test.ts: castling kingside/queenside (valid and invalid conditions), en passant capture, pawn promotion destinations, pinned pieces cannot move, moves that resolve check
- [x] T013 [P] [US1] Write unit tests for makeMove and game status in tests/unit/game.test.ts: makeMove applies move correctly, turn switches, castling rights update on king/rook move, en passant target set/cleared, checkmate detected, stalemate detected, resign changes status
- [x] T014 [P] [US1] Write unit tests for move error handling in tests/unit/game.test.ts: NO_PIECE error, NOT_YOUR_TURN error, ILLEGAL_MOVE error, GAME_OVER error, PROMOTION_REQUIRED error, INVALID_PROMOTION error

### Implementation for User Story 1

- [x] T015 [US1] Implement pseudo-legal move generation per piece type in src/engine/moves.ts: generatePawnMoves, generateKnightMoves, generateBishopMoves, generateRookMoves, generateQueenMoves, generateKingMoves (including castling candidates)
- [x] T016 [US1] Implement legal move filtering in src/engine/moves.ts: getValidMoves (filter pseudo-legal by simulating move and checking isSquareAttacked on own king), isInCheck, isCheckmate, isStalemate per engine-api.md contract
- [x] T017 [US1] Implement makeMove in src/engine/game.ts: validate move legality, apply move to board, handle captures, update castling rights, set/clear en passant target, update half-move clock, increment full-move number, detect checkmate/stalemate, return new Game or MoveError
- [x] T018 [US1] Implement special move execution in src/engine/game.ts: castling (move both king and rook), en passant (capture pawn on adjacent square), pawn promotion (replace pawn with chosen piece)
- [x] T019 [US1] Implement resign in src/engine/game.ts: set status to Resigned per engine-api.md contract
- [x] T020 [P] [US1] Create Piece component in src/components/Piece.tsx: render Unicode chess symbols (♔♕♖♗♘♙♚♛♜♝♞♟) based on piece type and color
- [x] T021 [P] [US1] Create Square component in src/components/Square.tsx: render light/dark square colors, show piece if present, highlight when selected, highlight valid move destinations, highlight check on king
- [x] T022 [US1] Create Board component in src/components/Board.tsx: render 8x8 grid of Square components, handle piece selection on click, handle move execution on destination click, show valid moves for selected piece via getValidMoves
- [x] T023 [US1] Create PromotionDialog component in src/components/PromotionDialog.tsx: modal overlay with Queen/Rook/Bishop/Knight choices, blocks game until selection made
- [x] T024 [US1] Create GameStatus component in src/components/GameStatus.tsx: display whose turn it is, show check indicator, show game result on checkmate/stalemate/resign
- [x] T025 [US1] Create GameControls component in src/components/GameControls.tsx: New Game button (with confirmation if game in progress), Resign button (with confirmation)
- [x] T026 [US1] Implement useChessGame hook in src/hooks/useChessGame.ts: useReducer with actions (SELECT_SQUARE, NEW_GAME, RESIGN), track selectedSquare and validMoves state, delegate to engine functions
- [x] T027 [US1] Wire up App.tsx with Board, GameStatus, GameControls, PromotionDialog, and useChessGame hook in src/App.tsx and src/App.css
- [x] T028 [US1] Add localStorage persistence to useChessGame hook in src/hooks/useChessGame.ts: serialize game state to localStorage on every state change, restore on initial load

### Integration Tests for User Story 1

- [x] T029 [P] [US1] Write integration test for full gameplay flow in tests/integration/gameplay.test.tsx: render App, click New Game, play Scholar's Mate (1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#), verify checkmate displayed
- [x] T030 [P] [US1] Write integration test for special moves UI in tests/integration/specialMoves.test.tsx: test castling via clicks, en passant via clicks, pawn promotion dialog appears and selection works

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently. Players can play a complete chess game with all standard rules.

---

## Phase 4: User Story 2 - Move History & Game Notation (Priority: P2)

**Goal**: Players see move history in algebraic notation and can review past positions

**Independent Test**: Play several moves, verify notation panel shows correct SAN, click a previous move to see that board position, use forward/back buttons to navigate

### Tests for User Story 2 (TDD)

- [x] T031 [P] [US2] Write unit tests for algebraic notation in tests/unit/notation.test.ts: pawn moves (e4), piece moves (Nf3), captures (Bxe5), castling (O-O, O-O-O), check (+), checkmate (#), disambiguation (Rae1, R1a3), promotion (e8=Q), en passant notation
- [x] T032 [P] [US2] Write unit tests for game result formatting in tests/unit/notation.test.ts: format result as 1-0 (white wins), 0-1 (black wins), 1/2-1/2 (draw)

### Implementation for User Story 2

- [x] T033 [US2] Implement toAlgebraicNotation in src/engine/notation.ts: convert Move to SAN string with piece letter, disambiguation, capture marker, destination, promotion, check/checkmate suffix per engine-api.md contract
- [x] T034 [US2] Update makeMove in src/engine/game.ts to generate and store notation string for each move using toAlgebraicNotation
- [x] T035 [US2] Create MoveHistory component in src/components/MoveHistory.tsx: scrollable panel displaying moves in numbered pairs (1. e4 e5), clickable moves to select a position for review, highlight current move, show game result
- [x] T036 [US2] Add position review mode to useChessGame hook in src/hooks/useChessGame.ts: add REVIEW_MOVE, STEP_FORWARD, STEP_BACK actions, track reviewIndex state, compute displayed position from move history, exit review mode on new move
- [x] T037 [US2] Integrate MoveHistory into App.tsx sidebar and connect review mode to Board display in src/App.tsx

**Checkpoint**: User Stories 1 AND 2 both work independently. Move notation displays correctly and position review navigates through game history.

---

## Phase 5: User Story 3 - Detect Draws by Rule (Priority: P3)

**Goal**: System detects threefold repetition and fifty-move rule, players can offer/accept draws

**Independent Test**: Play specific move sequences to trigger threefold repetition and fifty-move rule, verify draw claim UI appears and works, test draw offer/accept flow

### Tests for User Story 3 (TDD)

- [x] T038 [P] [US3] Write unit tests for position hashing in tests/unit/notation.test.ts: same position produces same hash, different active color produces different hash, different castling rights produces different hash, different en passant target produces different hash
- [x] T039 [P] [US3] Write unit tests for draw detection in tests/unit/game.test.ts: threefold repetition detected after 3 identical positions, fifty-move rule detected after 50 moves without pawn move or capture, invalid draw claims rejected, offerDraw/acceptDraw flow, draw declined continues game

### Implementation for User Story 3

- [x] T040 [US3] Implement toPositionHash in src/engine/notation.ts: serialize board pieces, active color, castling rights, and en passant target into unique string key per engine-api.md contract
- [x] T041 [US3] Update makeMove in src/engine/game.ts to record position hash in positionHistory array after each move
- [x] T042 [US3] Implement claimDraw in src/engine/game.ts: validate threefold repetition (count position hash occurrences >= 3) and fifty-move rule (halfMoveClock >= 100) per engine-api.md contract
- [x] T043 [US3] Implement offerDraw and acceptDraw in src/engine/game.ts: add pendingDrawOffer flag to Game, offerDraw sets flag, acceptDraw sets status to DrawByAgreement per engine-api.md contract
- [x] T044 [US3] Add draw UI to GameControls in src/components/GameControls.tsx: Offer Draw button, draw claim notification when repetition/fifty-move detected, accept/decline draw offer prompt
- [x] T045 [US3] Update useChessGame hook with draw actions in src/hooks/useChessGame.ts: add OFFER_DRAW, ACCEPT_DRAW, DECLINE_DRAW, CLAIM_DRAW actions, delegate to engine functions
- [x] T046 [US3] Write integration test for draw detection in tests/integration/drawDetection.test.tsx: play moves triggering threefold repetition, claim draw, verify game ends; test draw offer/accept via UI clicks

**Checkpoint**: All user stories are independently functional. Full chess rule set is implemented.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality, responsiveness, and production readiness

- [x] T047 [P] Refine App.css for responsive layout and mobile-friendly board sizing in src/App.css
- [x] T048 [P] Run full test suite and fix any failures across tests/unit/ and tests/integration/
- [x] T049 Validate quickstart.md scenarios against working application per specs/001-chess-game/quickstart.md
- [x] T050 Verify production build succeeds with `npm run build` and preview with `npm run preview`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion. Can run in parallel with US1 but notation integration (T034) touches game.ts shared with US1
- **User Story 3 (Phase 5)**: Depends on Foundational phase completion. Position hashing is independent but draw tracking in game.ts integrates with US1's makeMove
- **Polish (Phase 6)**: Depends on all user stories being complete

### Recommended Execution Order

For a single developer, sequential priority order is safest:

```text
Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6
```

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — no dependencies on other stories. This is the MVP.
- **User Story 2 (P2)**: Can start after Phase 2 — notation module is independent. T034 adds notation to makeMove (builds on US1's makeMove implementation).
- **User Story 3 (P3)**: Can start after Phase 2 — position hashing is independent. T041-T043 add draw tracking to game.ts (builds on US1's makeMove implementation).

### Within Each User Story

1. Tests MUST be written FIRST and verified to FAIL
2. Engine logic before UI components
3. Components before hooks integration
4. Hooks before App.tsx wiring
5. Integration tests after all story tasks complete

### Parallel Opportunities

**Phase 1**: T002 and T003 can run in parallel after T001.

**Phase 2**: T006 (board tests) can be written while T005 (types) is being implemented.

**Phase 3 (US1)**: T011, T012, T013, T014 (all test files) can run in parallel. T020 and T021 (Piece, Square components) can run in parallel. T029 and T030 (integration tests) can run in parallel.

**Phase 4 (US2)**: T031 and T032 (notation tests) can run in parallel.

**Phase 5 (US3)**: T038 and T039 (hash and draw tests) can run in parallel.

**Phase 6**: T047 and T048 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Play a full game, test all special moves
5. Deploy/demo if ready — this is a complete, playable chess game

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → full chess game playable (MVP!)
3. Add User Story 2 → move history and notation visible
4. Add User Story 3 → complete FIDE rule compliance
5. Polish → production-ready
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- TDD is mandatory per constitution: write tests → verify failure → implement → verify pass
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Engine module (src/engine/) MUST have zero imports from src/components/ or src/hooks/

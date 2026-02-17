# Engine API Contract: Chess Game

**Branch**: `001-chess-game` | **Date**: 2026-02-16

This document defines the public API of the chess engine module
(`src/engine/`). The engine is a pure TypeScript module with no
UI dependencies. All functions are synchronous and side-effect
free (pure functions operating on immutable state).

## Module: `engine/game`

### `createGame(): Game`

Creates a new game with the standard starting position.

**Returns**: A `Game` object with:
- All 32 pieces in standard starting positions
- White to move
- All castling rights available
- No en passant target
- Half-move clock at 0, full-move number at 1
- Status: `InProgress`
- Empty move history

---

### `makeMove(game: Game, from: Square, to: Square, promotion?: PieceType): Game | MoveError`

Attempts to make a move in the current game.

**Parameters**:
- `game` — Current game state (not mutated)
- `from` — Source square
- `to` — Destination square
- `promotion` — Required when a pawn reaches the last rank;
  must be Queen, Rook, Bishop, or Knight

**Returns**: New `Game` state with the move applied, or a
`MoveError` if the move is illegal.

**Errors**:
- `NOT_YOUR_TURN` — Piece at `from` is not the active color
- `NO_PIECE` — No piece at `from` square
- `ILLEGAL_MOVE` — Move violates chess rules
- `GAME_OVER` — Game is not in progress
- `PROMOTION_REQUIRED` — Pawn reached last rank but no
  promotion piece specified
- `INVALID_PROMOTION` — Cannot promote to King or Pawn

**Side effects on game state**:
- Updates board position
- Switches active color
- Updates castling rights if King or Rook moved
- Sets or clears en passant target
- Updates half-move clock (resets on pawn move or capture)
- Increments full-move number after Black's move
- Appends move to history with algebraic notation
- Appends position hash to position history
- Updates game status (checkmate, stalemate if applicable)

---

### `resign(game: Game): Game`

Current player resigns. Game ends in favor of the opponent.

**Returns**: New `Game` with status `Resigned`.

**Errors**: Returns unchanged game if status is not `InProgress`.

---

### `offerDraw(game: Game): Game`

Records a draw offer from the active player. The opponent
must accept or decline on their next action.

**Returns**: New `Game` with a pending draw offer flag.

---

### `acceptDraw(game: Game): Game`

Accepts a pending draw offer. Game ends as `DrawByAgreement`.

**Returns**: New `Game` with status `DrawByAgreement`.

**Errors**: Returns unchanged game if no draw offer is pending.

---

### `claimDraw(game: Game, reason: "repetition" | "fifty-move"): Game | DrawClaimError`

Claims a draw by rule. The engine verifies the claim is valid.

**Returns**: New `Game` with appropriate draw status, or error.

**Errors**:
- `INVALID_CLAIM` — The draw condition is not met

---

## Module: `engine/moves`

### `getValidMoves(position: BoardPosition, square: Square): Square[]`

Returns all legal destination squares for the piece at the
given square.

**Parameters**:
- `position` — Current board position
- `square` — Square containing the piece to query

**Returns**: Array of squares the piece can legally move to.
Empty array if no piece at square, wrong color, or no legal
moves.

**Used by UI**: To highlight valid move destinations when a
player clicks a piece.

---

### `isInCheck(position: BoardPosition, color: PieceColor): boolean`

Determines if the given color's King is currently in check.

**Parameters**:
- `position` — Board position to evaluate
- `color` — Which side to check

**Returns**: `true` if the King of the given color is attacked.

---

### `isCheckmate(position: BoardPosition): boolean`

Determines if the active color is in checkmate.

**Returns**: `true` if the active color has no legal moves and
their King is in check.

---

### `isStalemate(position: BoardPosition): boolean`

Determines if the active color is in stalemate.

**Returns**: `true` if the active color has no legal moves and
their King is NOT in check.

---

## Module: `engine/notation`

### `toAlgebraicNotation(position: BoardPosition, move: Move): string`

Converts a move to Standard Algebraic Notation.

**Parameters**:
- `position` — Board position BEFORE the move
- `move` — The move to notate

**Returns**: SAN string (e.g., `e4`, `Nf3`, `Bxe5+`, `O-O`,
`e8=Q#`).

**Rules**:
- Pawn moves: destination only (`e4`), file prefix on capture
  (`exd5`)
- Piece moves: piece letter + destination (`Nf3`)
- Disambiguation: add file (`Rae1`), rank (`R1a3`), or both
  if needed
- Capture: `x` before destination (`Bxe5`)
- Check: `+` suffix
- Checkmate: `#` suffix
- Castling: `O-O` (kingside), `O-O-O` (queenside)
- Promotion: `=` + piece letter (`e8=Q`)

---

### `toPositionHash(position: BoardPosition): string`

Generates a unique string key for a board position, used for
threefold repetition detection.

**Includes**: piece placement, active color, castling rights,
en passant target.

**Excludes**: half-move clock, full-move number.

---

## Module: `engine/board`

### `createStartingPosition(): BoardPosition`

Returns the standard chess starting position.

---

### `getPieceAt(position: BoardPosition, square: Square): Piece | null`

Returns the piece at the given square, or null if empty.

---

### `isSquareAttacked(position: BoardPosition, square: Square, byColor: PieceColor): boolean`

Determines if a square is attacked by any piece of the
given color. Used internally for check detection and
castling validation.

---

## Error Types

### MoveError

| Code                | Description                          |
|---------------------|--------------------------------------|
| NOT_YOUR_TURN       | Selected piece is opponent's color   |
| NO_PIECE            | No piece on the source square        |
| ILLEGAL_MOVE        | Move violates chess rules            |
| GAME_OVER           | Game has already ended               |
| PROMOTION_REQUIRED  | Pawn promotion needs piece choice    |
| INVALID_PROMOTION   | Cannot promote to King or Pawn       |

### DrawClaimError

| Code          | Description                                 |
|---------------|---------------------------------------------|
| INVALID_CLAIM | The claimed draw condition is not satisfied  |

# Data Model: Chess Game

**Branch**: `001-chess-game` | **Date**: 2026-02-16

## Enumerations

### PieceType

Represents the six chess piece types.

Values: `King`, `Queen`, `Rook`, `Bishop`, `Knight`, `Pawn`

### PieceColor

Represents the two sides.

Values: `White`, `Black`

### GameStatus

Represents the current state of the game.

Values:
- `InProgress` — game is actively being played
- `Checkmate` — game over, current player is checkmated
- `Stalemate` — game over, draw by stalemate
- `DrawByRepetition` — game over, draw by threefold repetition
- `DrawByFiftyMoveRule` — game over, draw by fifty-move rule
- `DrawByAgreement` — game over, draw by mutual agreement
- `Resigned` — game over, current player resigned

### MoveType

Classifies special move types.

Values: `Normal`, `Capture`, `EnPassant`, `CastleKingside`,
`CastleQueenside`, `Promotion`, `PromotionCapture`

## Entities

### Square

A single position on the chess board.

| Field  | Type   | Description                          |
|--------|--------|--------------------------------------|
| rank   | number | Row index, 0 (rank 1) to 7 (rank 8) |
| file   | number | Column index, 0 (a-file) to 7 (h-file) |

**Validation**: Both rank and file MUST be integers in range
0-7 inclusive.

**Display**: File maps to letters a-h, rank maps to numbers
1-8. Square `{file: 4, rank: 1}` displays as `e2`.

### Piece

A chess piece with its type and color.

| Field | Type       | Description            |
|-------|------------|------------------------|
| type  | PieceType  | King, Queen, Rook, etc |
| color | PieceColor | White or Black         |

### Move

A recorded move in the game.

| Field          | Type           | Description                              |
|----------------|----------------|------------------------------------------|
| piece          | Piece          | The piece that moved                     |
| from           | Square         | Origin square                            |
| to             | Square         | Destination square                       |
| captured       | Piece or null  | Piece captured, if any                   |
| moveType       | MoveType       | Normal, capture, castling, etc           |
| promotionPiece | PieceType or null | Chosen piece for pawn promotion       |
| notation       | string         | Standard algebraic notation (e.g., Nf3)  |

### CastlingRights

Tracks whether castling is still available for each side.

| Field          | Type    | Description                          |
|----------------|---------|--------------------------------------|
| whiteKingside  | boolean | White can castle kingside (O-O)      |
| whiteQueenside | boolean | White can castle queenside (O-O-O)   |
| blackKingside  | boolean | Black can castle kingside            |
| blackQueenside | boolean | Black can castle queenside           |

**State transitions**: A castling right is permanently revoked
when:
- The relevant King moves (revokes both sides for that color)
- The relevant Rook moves or is captured (revokes that side)

### BoardPosition

The complete state of the board at a given point.

| Field          | Type                        | Description                         |
|----------------|-----------------------------|-------------------------------------|
| squares        | (Piece or null)\[8\]\[8\]   | 8x8 grid, squares\[rank\]\[file\]  |
| activeColor    | PieceColor                  | Which side moves next               |
| castlingRights | CastlingRights              | Available castling options          |
| enPassantTarget| Square or null              | Target square for en passant        |
| halfMoveClock  | number                      | Moves since last pawn move/capture  |
| fullMoveNumber | number                      | Incremented after Black's move      |

**Validation**:
- Exactly one White King and one Black King MUST exist.
- halfMoveClock MUST be non-negative.
- fullMoveNumber MUST be >= 1.
- enPassantTarget MUST be on rank 2 (if Black just moved)
  or rank 5 (if White just moved), or null.

### Game

The top-level entity representing a chess match.

| Field           | Type           | Description                          |
|-----------------|----------------|--------------------------------------|
| id              | string         | Unique game identifier               |
| position        | BoardPosition  | Current board state                  |
| status          | GameStatus     | Current game status                  |
| moveHistory     | Move\[\]       | Ordered list of all moves played     |
| positionHistory | string\[\]     | Position hashes for repetition check |
| createdAt       | timestamp      | When the game was started            |

**State transitions**:

```text
         ┌──────────────┐
         │  InProgress   │
         └──────┬───────┘
                │
    ┌───────────┼───────────┬──────────────┐
    │           │           │              │
    ▼           ▼           ▼              ▼
Checkmate  Stalemate  DrawByRepetition  Resigned
                       DrawByFiftyMove
                       DrawByAgreement
```

All terminal states are irreversible. Once a game leaves
`InProgress`, no further moves can be made.

## Relationships

```text
Game ──────── 1:1 ──────── BoardPosition (current)
Game ──────── 1:N ──────── Move (history)
BoardPosition  1:N ──────── Piece (up to 32)
Move ────────  1:1 ──────── Piece (moved)
Move ────────  0:1 ──────── Piece (captured)
```

## Position Hashing (for Threefold Repetition)

To detect threefold repetition, each position MUST be
convertible to a unique string hash that includes:
- Piece placement on all 64 squares
- Active color (whose turn it is)
- Castling rights
- En passant target square

The hash does NOT include half-move clock or full-move number,
as two positions are "the same" regardless of when they occur.

A simple approach: serialize the board as a string of piece
codes per square, appended with active color, castling flags,
and en passant target. No cryptographic hash needed; the
string itself serves as the key.

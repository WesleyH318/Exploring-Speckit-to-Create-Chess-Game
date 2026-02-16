// T007, T008: Board creation, piece queries, attack detection

import {
  type BoardPosition,
  type CastlingRights,
  type Piece,
  PieceColor,
  PieceType,
  type Square,
} from './types'

export function createStartingPosition(): BoardPosition {
  const squares: (Piece | null)[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null),
  )

  const backRank = [
    PieceType.Rook,
    PieceType.Knight,
    PieceType.Bishop,
    PieceType.Queen,
    PieceType.King,
    PieceType.Bishop,
    PieceType.Knight,
    PieceType.Rook,
  ]

  // White pieces on ranks 0-1
  for (let file = 0; file < 8; file++) {
    squares[0]![file] = { type: backRank[file]!, color: PieceColor.White }
    squares[1]![file] = { type: PieceType.Pawn, color: PieceColor.White }
  }

  // Black pieces on ranks 6-7
  for (let file = 0; file < 8; file++) {
    squares[7]![file] = { type: backRank[file]!, color: PieceColor.Black }
    squares[6]![file] = { type: PieceType.Pawn, color: PieceColor.Black }
  }

  const castlingRights: CastlingRights = {
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  }

  return {
    squares,
    activeColor: PieceColor.White,
    castlingRights,
    enPassantTarget: null,
    halfMoveClock: 0,
    fullMoveNumber: 1,
  }
}

export function getPieceAt(
  position: BoardPosition,
  square: Square,
): Piece | null {
  return position.squares[square.rank]?.[square.file] ?? null
}

export function findKing(
  position: BoardPosition,
  color: PieceColor,
): Square | null {
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = position.squares[rank]![file]
      if (piece?.type === PieceType.King && piece.color === color) {
        return { rank, file }
      }
    }
  }
  return null
}

function isInBounds(rank: number, file: number): boolean {
  return rank >= 0 && rank < 8 && file >= 0 && file < 8
}

// Check if a square is attacked by any piece of the given color
export function isSquareAttacked(
  position: BoardPosition,
  square: Square,
  byColor: PieceColor,
): boolean {
  const { rank, file } = square

  // Knight attacks
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ]
  for (const [dr, df] of knightOffsets) {
    const r = rank + dr!
    const f = file + df!
    if (isInBounds(r, f)) {
      const piece = position.squares[r]![f]
      if (piece?.type === PieceType.Knight && piece.color === byColor) {
        return true
      }
    }
  }

  // King attacks (single step in all directions)
  const kingOffsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
  ]
  for (const [dr, df] of kingOffsets) {
    const r = rank + dr!
    const f = file + df!
    if (isInBounds(r, f)) {
      const piece = position.squares[r]![f]
      if (piece?.type === PieceType.King && piece.color === byColor) {
        return true
      }
    }
  }

  // Pawn attacks
  const pawnDir = byColor === PieceColor.White ? 1 : -1
  // Pawns attack diagonally forward from their perspective
  for (const df of [-1, 1]) {
    const r = rank - pawnDir // square attacked by pawn at (rank-pawnDir, file+df)
    const f = file + df
    if (isInBounds(r, f)) {
      const piece = position.squares[r]![f]
      if (piece?.type === PieceType.Pawn && piece.color === byColor) {
        return true
      }
    }
  }

  // Sliding piece attacks: diagonals (Bishop/Queen) and straights (Rook/Queen)
  const slidingDirs = [
    { dr: -1, df: 0, types: [PieceType.Rook, PieceType.Queen] },
    { dr: 1, df: 0, types: [PieceType.Rook, PieceType.Queen] },
    { dr: 0, df: -1, types: [PieceType.Rook, PieceType.Queen] },
    { dr: 0, df: 1, types: [PieceType.Rook, PieceType.Queen] },
    { dr: -1, df: -1, types: [PieceType.Bishop, PieceType.Queen] },
    { dr: -1, df: 1, types: [PieceType.Bishop, PieceType.Queen] },
    { dr: 1, df: -1, types: [PieceType.Bishop, PieceType.Queen] },
    { dr: 1, df: 1, types: [PieceType.Bishop, PieceType.Queen] },
  ]

  for (const { dr, df, types } of slidingDirs) {
    let r = rank + dr
    let f = file + df
    while (isInBounds(r, f)) {
      const piece = position.squares[r]![f]
      if (piece) {
        if (piece.color === byColor && types.includes(piece.type)) {
          return true
        }
        break // blocked by any piece
      }
      r += dr
      f += df
    }
  }

  return false
}

// Deep clone a board position for simulation
export function clonePosition(position: BoardPosition): BoardPosition {
  return {
    squares: position.squares.map((row) => row.map((p) => (p ? { ...p } : null))),
    activeColor: position.activeColor,
    castlingRights: { ...position.castlingRights },
    enPassantTarget: position.enPassantTarget
      ? { ...position.enPassantTarget }
      : null,
    halfMoveClock: position.halfMoveClock,
    fullMoveNumber: position.fullMoveNumber,
  }
}

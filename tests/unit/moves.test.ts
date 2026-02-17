import { describe, it, expect } from 'vitest'
import { getValidMoves, isInCheck, isCheckmate, isStalemate } from '../../src/engine/moves'
import { PieceColor, PieceType, type BoardPosition } from '../../src/engine/types'

function emptyPosition(): BoardPosition {
  return {
    squares: Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => null),
    ),
    activeColor: PieceColor.White,
    castlingRights: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false,
    },
    enPassantTarget: null,
    halfMoveClock: 0,
    fullMoveNumber: 1,
  }
}

function place(
  pos: BoardPosition,
  rank: number,
  file: number,
  type: PieceType,
  color: PieceColor,
): void {
  pos.squares[rank]![file] = { type, color }
}

describe('Pawn moves', () => {
  it('can move forward one square', () => {
    const pos = emptyPosition()
    place(pos, 1, 4, PieceType.Pawn, PieceColor.White)
    place(pos, 0, 4, PieceType.King, PieceColor.White)
    place(pos, 7, 4, PieceType.King, PieceColor.Black)
    const moves = getValidMoves(pos, { rank: 1, file: 4 })
    expect(moves).toContainEqual({ rank: 2, file: 4 })
  })

  it('can move forward two from starting rank', () => {
    const pos = emptyPosition()
    place(pos, 1, 4, PieceType.Pawn, PieceColor.White)
    place(pos, 0, 4, PieceType.King, PieceColor.White)
    place(pos, 7, 4, PieceType.King, PieceColor.Black)
    const moves = getValidMoves(pos, { rank: 1, file: 4 })
    expect(moves).toContainEqual({ rank: 3, file: 4 })
  })

  it('cannot move forward through a piece', () => {
    const pos = emptyPosition()
    place(pos, 1, 4, PieceType.Pawn, PieceColor.White)
    place(pos, 2, 4, PieceType.Pawn, PieceColor.Black)
    place(pos, 0, 4, PieceType.King, PieceColor.White)
    place(pos, 7, 4, PieceType.King, PieceColor.Black)
    const moves = getValidMoves(pos, { rank: 1, file: 4 })
    expect(moves).not.toContainEqual({ rank: 2, file: 4 })
  })

  it('captures diagonally', () => {
    const pos = emptyPosition()
    place(pos, 3, 3, PieceType.Pawn, PieceColor.White)
    place(pos, 4, 4, PieceType.Pawn, PieceColor.Black)
    place(pos, 0, 0, PieceType.King, PieceColor.White)
    place(pos, 7, 7, PieceType.King, PieceColor.Black)
    const moves = getValidMoves(pos, { rank: 3, file: 3 })
    expect(moves).toContainEqual({ rank: 4, file: 4 })
  })
})

describe('Knight moves', () => {
  it('moves in L-shape', () => {
    const pos = emptyPosition()
    place(pos, 3, 3, PieceType.Knight, PieceColor.White)
    place(pos, 0, 0, PieceType.King, PieceColor.White)
    place(pos, 7, 7, PieceType.King, PieceColor.Black)
    const moves = getValidMoves(pos, { rank: 3, file: 3 })
    expect(moves.length).toBe(8) // center knight has 8 moves
    expect(moves).toContainEqual({ rank: 5, file: 4 })
    expect(moves).toContainEqual({ rank: 1, file: 2 })
  })

  it('cannot land on own piece', () => {
    const pos = emptyPosition()
    place(pos, 3, 3, PieceType.Knight, PieceColor.White)
    place(pos, 5, 4, PieceType.Pawn, PieceColor.White)
    place(pos, 0, 0, PieceType.King, PieceColor.White)
    place(pos, 7, 7, PieceType.King, PieceColor.Black)
    const moves = getValidMoves(pos, { rank: 3, file: 3 })
    expect(moves).not.toContainEqual({ rank: 5, file: 4 })
  })
})

describe('Bishop moves', () => {
  it('slides along diagonals', () => {
    const pos = emptyPosition()
    place(pos, 3, 3, PieceType.Bishop, PieceColor.White)
    place(pos, 0, 0, PieceType.King, PieceColor.White)
    place(pos, 7, 7, PieceType.King, PieceColor.Black)
    const moves = getValidMoves(pos, { rank: 3, file: 3 })
    expect(moves).toContainEqual({ rank: 0, file: 6 })
    expect(moves).toContainEqual({ rank: 6, file: 0 })
  })
})

describe('Rook moves', () => {
  it('slides along ranks and files', () => {
    const pos = emptyPosition()
    place(pos, 3, 3, PieceType.Rook, PieceColor.White)
    place(pos, 0, 0, PieceType.King, PieceColor.White)
    place(pos, 7, 7, PieceType.King, PieceColor.Black)
    const moves = getValidMoves(pos, { rank: 3, file: 3 })
    expect(moves).toContainEqual({ rank: 3, file: 0 })
    expect(moves).toContainEqual({ rank: 3, file: 7 })
    expect(moves).toContainEqual({ rank: 0, file: 3 })
    expect(moves).toContainEqual({ rank: 7, file: 3 })
  })
})

describe('King moves', () => {
  it('moves one square in each direction', () => {
    const pos = emptyPosition()
    place(pos, 4, 4, PieceType.King, PieceColor.White)
    place(pos, 0, 0, PieceType.King, PieceColor.Black)
    const moves = getValidMoves(pos, { rank: 4, file: 4 })
    expect(moves.length).toBe(8)
  })

  it('cannot move into check', () => {
    const pos = emptyPosition()
    place(pos, 4, 4, PieceType.King, PieceColor.White)
    place(pos, 6, 5, PieceType.Rook, PieceColor.Black)
    place(pos, 7, 7, PieceType.King, PieceColor.Black)
    const moves = getValidMoves(pos, { rank: 4, file: 4 })
    // f5 is attacked by black rook on f7
    expect(moves).not.toContainEqual({ rank: 5, file: 5 })
  })
})

describe('Castling', () => {
  it('allows kingside castling when conditions met', () => {
    const pos = emptyPosition()
    place(pos, 0, 4, PieceType.King, PieceColor.White)
    place(pos, 0, 7, PieceType.Rook, PieceColor.White)
    place(pos, 7, 4, PieceType.King, PieceColor.Black)
    pos.castlingRights.whiteKingside = true
    const moves = getValidMoves(pos, { rank: 0, file: 4 })
    expect(moves).toContainEqual({ rank: 0, file: 6 })
  })

  it('disallows castling through occupied squares', () => {
    const pos = emptyPosition()
    place(pos, 0, 4, PieceType.King, PieceColor.White)
    place(pos, 0, 5, PieceType.Bishop, PieceColor.White)
    place(pos, 0, 7, PieceType.Rook, PieceColor.White)
    place(pos, 7, 4, PieceType.King, PieceColor.Black)
    pos.castlingRights.whiteKingside = true
    const moves = getValidMoves(pos, { rank: 0, file: 4 })
    expect(moves).not.toContainEqual({ rank: 0, file: 6 })
  })

  it('disallows castling while in check', () => {
    const pos = emptyPosition()
    place(pos, 0, 4, PieceType.King, PieceColor.White)
    place(pos, 0, 7, PieceType.Rook, PieceColor.White)
    place(pos, 7, 4, PieceType.Rook, PieceColor.Black) // attacks e1
    place(pos, 7, 0, PieceType.King, PieceColor.Black)
    pos.castlingRights.whiteKingside = true
    const moves = getValidMoves(pos, { rank: 0, file: 4 })
    expect(moves).not.toContainEqual({ rank: 0, file: 6 })
  })

  it('allows queenside castling', () => {
    const pos = emptyPosition()
    place(pos, 0, 4, PieceType.King, PieceColor.White)
    place(pos, 0, 0, PieceType.Rook, PieceColor.White)
    place(pos, 7, 4, PieceType.King, PieceColor.Black)
    pos.castlingRights.whiteQueenside = true
    const moves = getValidMoves(pos, { rank: 0, file: 4 })
    expect(moves).toContainEqual({ rank: 0, file: 2 })
  })
})

describe('En passant', () => {
  it('allows en passant capture', () => {
    const pos = emptyPosition()
    place(pos, 4, 3, PieceType.Pawn, PieceColor.White)
    place(pos, 4, 4, PieceType.Pawn, PieceColor.Black)
    place(pos, 0, 0, PieceType.King, PieceColor.White)
    place(pos, 7, 7, PieceType.King, PieceColor.Black)
    pos.enPassantTarget = { rank: 5, file: 4 }
    const moves = getValidMoves(pos, { rank: 4, file: 3 })
    expect(moves).toContainEqual({ rank: 5, file: 4 })
  })
})

describe('Pinned pieces', () => {
  it('pinned piece cannot move away from pin line', () => {
    const pos = emptyPosition()
    place(pos, 0, 4, PieceType.King, PieceColor.White)
    place(pos, 0, 5, PieceType.Bishop, PieceColor.White) // pinned by rook on h1
    place(pos, 0, 7, PieceType.Rook, PieceColor.Black)
    place(pos, 7, 4, PieceType.King, PieceColor.Black)
    const moves = getValidMoves(pos, { rank: 0, file: 5 })
    // Bishop is pinned along rank 0 - it can't move diagonally
    expect(moves.length).toBe(0)
  })
})

describe('isInCheck', () => {
  it('returns true when king is attacked', () => {
    const pos = emptyPosition()
    place(pos, 0, 4, PieceType.King, PieceColor.White)
    place(pos, 7, 4, PieceType.Rook, PieceColor.Black)
    place(pos, 7, 0, PieceType.King, PieceColor.Black)
    expect(isInCheck(pos, PieceColor.White)).toBe(true)
  })

  it('returns false when king is not attacked', () => {
    const pos = emptyPosition()
    place(pos, 0, 4, PieceType.King, PieceColor.White)
    place(pos, 7, 0, PieceType.King, PieceColor.Black)
    expect(isInCheck(pos, PieceColor.White)).toBe(false)
  })
})

describe('isCheckmate', () => {
  it('detects back-rank checkmate', () => {
    const pos = emptyPosition()
    pos.activeColor = PieceColor.White
    place(pos, 0, 7, PieceType.King, PieceColor.White)
    place(pos, 1, 5, PieceType.Pawn, PieceColor.White)
    place(pos, 1, 6, PieceType.Pawn, PieceColor.White)
    place(pos, 1, 7, PieceType.Pawn, PieceColor.White)
    place(pos, 0, 0, PieceType.Rook, PieceColor.Black) // delivers mate
    place(pos, 7, 4, PieceType.King, PieceColor.Black)
    expect(isCheckmate(pos)).toBe(true)
  })
})

describe('isStalemate', () => {
  it('detects stalemate', () => {
    const pos = emptyPosition()
    pos.activeColor = PieceColor.White
    place(pos, 0, 0, PieceType.King, PieceColor.White)
    place(pos, 2, 1, PieceType.Queen, PieceColor.Black) // covers a2, b1
    place(pos, 1, 2, PieceType.King, PieceColor.Black)  // covers a2, b1, b2
    expect(isStalemate(pos)).toBe(true)
  })
})

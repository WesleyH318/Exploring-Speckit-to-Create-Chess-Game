import { describe, it, expect } from 'vitest'
import {
  createStartingPosition,
  getPieceAt,
  isSquareAttacked,
} from '../../src/engine/board'
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

describe('createStartingPosition', () => {
  const pos = createStartingPosition()

  it('returns white rooks on a1 and h1', () => {
    expect(getPieceAt(pos, { rank: 0, file: 0 })).toEqual({
      type: PieceType.Rook,
      color: PieceColor.White,
    })
    expect(getPieceAt(pos, { rank: 0, file: 7 })).toEqual({
      type: PieceType.Rook,
      color: PieceColor.White,
    })
  })

  it('returns white knights on b1 and g1', () => {
    expect(getPieceAt(pos, { rank: 0, file: 1 })).toEqual({
      type: PieceType.Knight,
      color: PieceColor.White,
    })
    expect(getPieceAt(pos, { rank: 0, file: 6 })).toEqual({
      type: PieceType.Knight,
      color: PieceColor.White,
    })
  })

  it('returns white pawns on rank 1', () => {
    for (let file = 0; file < 8; file++) {
      expect(getPieceAt(pos, { rank: 1, file })).toEqual({
        type: PieceType.Pawn,
        color: PieceColor.White,
      })
    }
  })

  it('returns black pieces on ranks 6-7', () => {
    expect(getPieceAt(pos, { rank: 7, file: 4 })).toEqual({
      type: PieceType.King,
      color: PieceColor.Black,
    })
    for (let file = 0; file < 8; file++) {
      expect(getPieceAt(pos, { rank: 6, file })).toEqual({
        type: PieceType.Pawn,
        color: PieceColor.Black,
      })
    }
  })

  it('has empty squares in the middle', () => {
    for (let rank = 2; rank <= 5; rank++) {
      for (let file = 0; file < 8; file++) {
        expect(getPieceAt(pos, { rank, file })).toBeNull()
      }
    }
  })

  it('has 32 total pieces', () => {
    let count = 0
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++)
        if (pos.squares[r]![f]) count++
    expect(count).toBe(32)
  })

  it('has white to move', () => {
    expect(pos.activeColor).toBe(PieceColor.White)
  })

  it('has all castling rights', () => {
    expect(pos.castlingRights).toEqual({
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    })
  })

  it('has halfMoveClock 0 and fullMoveNumber 1', () => {
    expect(pos.halfMoveClock).toBe(0)
    expect(pos.fullMoveNumber).toBe(1)
  })
})

describe('getPieceAt', () => {
  it('returns null for empty squares', () => {
    const pos = createStartingPosition()
    expect(getPieceAt(pos, { rank: 4, file: 4 })).toBeNull()
  })

  it('returns null for out-of-bounds', () => {
    const pos = createStartingPosition()
    expect(getPieceAt(pos, { rank: 8, file: 0 })).toBeNull()
  })
})

describe('isSquareAttacked', () => {
  it('detects knight attack', () => {
    const pos = emptyPosition()
    place(pos, 3, 3, PieceType.Knight, PieceColor.White)
    expect(isSquareAttacked(pos, { rank: 5, file: 4 }, PieceColor.White)).toBe(true)
    expect(isSquareAttacked(pos, { rank: 4, file: 4 }, PieceColor.White)).toBe(false)
  })

  it('detects bishop attack along diagonal', () => {
    const pos = emptyPosition()
    place(pos, 0, 0, PieceType.Bishop, PieceColor.White)
    expect(isSquareAttacked(pos, { rank: 3, file: 3 }, PieceColor.White)).toBe(true)
    expect(isSquareAttacked(pos, { rank: 1, file: 0 }, PieceColor.White)).toBe(false)
  })

  it('detects rook attack along rank', () => {
    const pos = emptyPosition()
    place(pos, 3, 0, PieceType.Rook, PieceColor.Black)
    expect(isSquareAttacked(pos, { rank: 3, file: 7 }, PieceColor.Black)).toBe(true)
  })

  it('bishop blocked by piece', () => {
    const pos = emptyPosition()
    place(pos, 0, 0, PieceType.Bishop, PieceColor.White)
    place(pos, 1, 1, PieceType.Rook, PieceColor.White) // rook blocks, doesn't attack diagonally
    expect(isSquareAttacked(pos, { rank: 2, file: 2 }, PieceColor.White)).toBe(false)
  })

  it('detects pawn attack', () => {
    const pos = emptyPosition()
    place(pos, 3, 3, PieceType.Pawn, PieceColor.White)
    // White pawn attacks diagonally forward (rank+1)
    expect(isSquareAttacked(pos, { rank: 4, file: 2 }, PieceColor.White)).toBe(true)
    expect(isSquareAttacked(pos, { rank: 4, file: 4 }, PieceColor.White)).toBe(true)
    expect(isSquareAttacked(pos, { rank: 4, file: 3 }, PieceColor.White)).toBe(false)
  })

  it('detects king attack', () => {
    const pos = emptyPosition()
    place(pos, 4, 4, PieceType.King, PieceColor.White)
    expect(isSquareAttacked(pos, { rank: 5, file: 5 }, PieceColor.White)).toBe(true)
    expect(isSquareAttacked(pos, { rank: 6, file: 6 }, PieceColor.White)).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { toPositionHash, formatResult } from '../../src/engine/notation'
import { createStartingPosition } from '../../src/engine/board'
import { PieceColor, type BoardPosition } from '../../src/engine/types'

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

describe('toPositionHash', () => {
  it('produces same hash for same position', () => {
    const pos1 = createStartingPosition()
    const pos2 = createStartingPosition()
    expect(toPositionHash(pos1)).toBe(toPositionHash(pos2))
  })

  it('produces different hash for different active color', () => {
    const pos1 = createStartingPosition()
    const pos2 = createStartingPosition()
    pos2.activeColor = PieceColor.Black
    expect(toPositionHash(pos1)).not.toBe(toPositionHash(pos2))
  })

  it('produces different hash for different castling rights', () => {
    const pos1 = createStartingPosition()
    const pos2 = createStartingPosition()
    pos2.castlingRights.whiteKingside = false
    expect(toPositionHash(pos1)).not.toBe(toPositionHash(pos2))
  })

  it('produces different hash for different en passant target', () => {
    const pos1 = emptyPosition()
    const pos2 = emptyPosition()
    pos2.enPassantTarget = { rank: 2, file: 4 }
    expect(toPositionHash(pos1)).not.toBe(toPositionHash(pos2))
  })
})

describe('formatResult', () => {
  it('returns 1-0 for white wins', () => {
    expect(formatResult(PieceColor.White, false)).toBe('1-0')
  })

  it('returns 0-1 for black wins', () => {
    expect(formatResult(PieceColor.Black, false)).toBe('0-1')
  })

  it('returns 1/2-1/2 for draw', () => {
    expect(formatResult(null, true)).toBe('1/2-1/2')
  })
})

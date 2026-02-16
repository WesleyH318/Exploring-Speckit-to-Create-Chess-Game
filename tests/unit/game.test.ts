import { describe, it, expect } from 'vitest'
import {
  createGame,
  makeMove,
  resign,
  offerDraw,
  acceptDraw,
  claimDraw,
} from '../../src/engine/game'
import {
  GameStatus,
  MoveErrorCode,
  PieceColor,
  PieceType,
  isMoveError,
  isDrawClaimError,
} from '../../src/engine/types'

describe('createGame', () => {
  it('returns a game with starting position', () => {
    const game = createGame()
    expect(game.position.activeColor).toBe(PieceColor.White)
    expect(game.status).toBe(GameStatus.InProgress)
    expect(game.moveHistory).toHaveLength(0)
    expect(game.positionHistory.length).toBeGreaterThan(0)
  })

  it('has all castling rights', () => {
    const game = createGame()
    expect(game.position.castlingRights).toEqual({
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    })
  })

  it('has pendingDrawOffer false', () => {
    const game = createGame()
    expect(game.pendingDrawOffer).toBe(false)
  })
})

describe('makeMove', () => {
  it('applies e2-e4 correctly', () => {
    const game = createGame()
    const result = makeMove(game, { rank: 1, file: 4 }, { rank: 3, file: 4 })
    expect(isMoveError(result)).toBe(false)
    if (!isMoveError(result)) {
      expect(result.position.activeColor).toBe(PieceColor.Black)
      expect(result.position.squares[3]![4]?.type).toBe(PieceType.Pawn)
      expect(result.position.squares[1]![4]).toBeNull()
      expect(result.moveHistory).toHaveLength(1)
    }
  })

  it('sets en passant target on double pawn push', () => {
    const game = createGame()
    const result = makeMove(game, { rank: 1, file: 4 }, { rank: 3, file: 4 })
    if (!isMoveError(result)) {
      expect(result.position.enPassantTarget).toEqual({ rank: 2, file: 4 })
    }
  })

  it('clears en passant target on non-double push', () => {
    let game = createGame()
    let result = makeMove(game, { rank: 1, file: 4 }, { rank: 3, file: 4 })
    if (!isMoveError(result)) {
      game = result
      // Black plays Nc6
      result = makeMove(game, { rank: 7, file: 1 }, { rank: 5, file: 2 })
      if (!isMoveError(result)) {
        expect(result.position.enPassantTarget).toBeNull()
      }
    }
  })

  it('increments full move number after black moves', () => {
    let game = createGame()
    let result = makeMove(game, { rank: 1, file: 4 }, { rank: 3, file: 4 })
    if (!isMoveError(result)) {
      expect(result.position.fullMoveNumber).toBe(1)
      game = result
      result = makeMove(game, { rank: 6, file: 4 }, { rank: 4, file: 4 })
      if (!isMoveError(result)) {
        expect(result.position.fullMoveNumber).toBe(2)
      }
    }
  })

  it('resets half-move clock on pawn move', () => {
    const game = createGame()
    const result = makeMove(game, { rank: 1, file: 4 }, { rank: 3, file: 4 })
    if (!isMoveError(result)) {
      expect(result.position.halfMoveClock).toBe(0)
    }
  })
})

describe('makeMove errors', () => {
  it('returns NO_PIECE for empty square', () => {
    const game = createGame()
    const result = makeMove(game, { rank: 4, file: 4 }, { rank: 5, file: 4 })
    expect(isMoveError(result)).toBe(true)
    if (isMoveError(result)) {
      expect(result.code).toBe(MoveErrorCode.NO_PIECE)
    }
  })

  it('returns NOT_YOUR_TURN for wrong color', () => {
    const game = createGame()
    const result = makeMove(game, { rank: 6, file: 4 }, { rank: 5, file: 4 })
    expect(isMoveError(result)).toBe(true)
    if (isMoveError(result)) {
      expect(result.code).toBe(MoveErrorCode.NOT_YOUR_TURN)
    }
  })

  it('returns ILLEGAL_MOVE for invalid move', () => {
    const game = createGame()
    const result = makeMove(game, { rank: 1, file: 4 }, { rank: 5, file: 4 })
    expect(isMoveError(result)).toBe(true)
    if (isMoveError(result)) {
      expect(result.code).toBe(MoveErrorCode.ILLEGAL_MOVE)
    }
  })

  it('returns GAME_OVER if game finished', () => {
    let game = createGame()
    game = { ...game, status: GameStatus.Checkmate }
    const result = makeMove(game, { rank: 1, file: 4 }, { rank: 3, file: 4 })
    expect(isMoveError(result)).toBe(true)
    if (isMoveError(result)) {
      expect(result.code).toBe(MoveErrorCode.GAME_OVER)
    }
  })

  it('returns PROMOTION_REQUIRED for pawn on last rank', () => {
    const game = createGame()
    // Set up a position where white pawn is on rank 6
    game.position.squares[6]![0] = { type: PieceType.Pawn, color: PieceColor.White }
    game.position.squares[7]![0] = null
    game.position.squares[7]![1] = null
    const result = makeMove(game, { rank: 6, file: 0 }, { rank: 7, file: 0 })
    expect(isMoveError(result)).toBe(true)
    if (isMoveError(result)) {
      expect(result.code).toBe(MoveErrorCode.PROMOTION_REQUIRED)
    }
  })

  it('returns INVALID_PROMOTION for promoting to king', () => {
    const game = createGame()
    game.position.squares[6]![0] = { type: PieceType.Pawn, color: PieceColor.White }
    game.position.squares[7]![0] = null
    game.position.squares[7]![1] = null
    const result = makeMove(
      game,
      { rank: 6, file: 0 },
      { rank: 7, file: 0 },
      PieceType.King,
    )
    expect(isMoveError(result)).toBe(true)
    if (isMoveError(result)) {
      expect(result.code).toBe(MoveErrorCode.INVALID_PROMOTION)
    }
  })
})

describe('resign', () => {
  it('sets status to Resigned', () => {
    const game = createGame()
    const result = resign(game)
    expect(result.status).toBe(GameStatus.Resigned)
  })

  it('does nothing if game already over', () => {
    let game = createGame()
    game = { ...game, status: GameStatus.Checkmate }
    const result = resign(game)
    expect(result.status).toBe(GameStatus.Checkmate)
  })
})

describe('draw mechanics', () => {
  it('offerDraw sets pendingDrawOffer', () => {
    const game = createGame()
    const result = offerDraw(game)
    expect(result.pendingDrawOffer).toBe(true)
  })

  it('acceptDraw ends game as DrawByAgreement', () => {
    let game = createGame()
    game = offerDraw(game)
    const result = acceptDraw(game)
    expect(result.status).toBe(GameStatus.DrawByAgreement)
    expect(result.pendingDrawOffer).toBe(false)
  })

  it('acceptDraw does nothing without pending offer', () => {
    const game = createGame()
    const result = acceptDraw(game)
    expect(result.status).toBe(GameStatus.InProgress)
  })

  it('claimDraw repetition fails without 3 repetitions', () => {
    const game = createGame()
    const result = claimDraw(game, 'repetition')
    expect(isDrawClaimError(result)).toBe(true)
  })

  it('claimDraw fifty-move fails without 100 half-moves', () => {
    const game = createGame()
    const result = claimDraw(game, 'fifty-move')
    expect(isDrawClaimError(result)).toBe(true)
  })
})

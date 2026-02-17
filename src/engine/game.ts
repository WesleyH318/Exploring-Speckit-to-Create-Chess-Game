// T010, T017, T018, T019, T034, T041, T042, T043: Game state management

import {
  type DrawClaimError,
  DrawClaimErrorCode,
  type Game,
  GameStatus,
  type Move,
  type MoveError,
  MoveErrorCode,
  MoveType,
  PieceColor,
  PieceType,
  type Square,
  squaresEqual,
} from './types'
import { clonePosition, createStartingPosition, getPieceAt } from './board'
import { getValidMoves, isCheckmate, isStalemate } from './moves'
import { toAlgebraicNotation, toPositionHash } from './notation'

let nextId = 1

export function createGame(): Game {
  const position = createStartingPosition()
  return {
    id: String(nextId++),
    position,
    status: GameStatus.InProgress,
    moveHistory: [],
    positionHistory: [toPositionHash(position)],
    createdAt: Date.now(),
    pendingDrawOffer: false,
  }
}

function oppositeColor(color: PieceColor): PieceColor {
  return color === PieceColor.White ? PieceColor.Black : PieceColor.White
}

export function makeMove(
  game: Game,
  from: Square,
  to: Square,
  promotionPiece?: PieceType,
): Game | MoveError {
  if (game.status !== GameStatus.InProgress) {
    return { code: MoveErrorCode.GAME_OVER, message: 'Game is already over' }
  }

  const piece = getPieceAt(game.position, from)
  if (!piece) {
    return { code: MoveErrorCode.NO_PIECE, message: 'No piece at source square' }
  }

  if (piece.color !== game.position.activeColor) {
    return {
      code: MoveErrorCode.NOT_YOUR_TURN,
      message: 'That piece belongs to the opponent',
    }
  }

  const validMoves = getValidMoves(game.position, from)
  const isValid = validMoves.some((m) => squaresEqual(m, to))
  if (!isValid) {
    return { code: MoveErrorCode.ILLEGAL_MOVE, message: 'Illegal move' }
  }

  // Check pawn promotion
  const isPromotion =
    piece.type === PieceType.Pawn &&
    (to.rank === 7 || to.rank === 0)
  if (isPromotion && !promotionPiece) {
    return {
      code: MoveErrorCode.PROMOTION_REQUIRED,
      message: 'Pawn promotion requires a piece choice',
    }
  }
  if (isPromotion && promotionPiece) {
    if (
      promotionPiece === PieceType.King ||
      promotionPiece === PieceType.Pawn
    ) {
      return {
        code: MoveErrorCode.INVALID_PROMOTION,
        message: 'Cannot promote to King or Pawn',
      }
    }
  }

  // Determine move type
  const captured = getPieceAt(game.position, to)
  const isEnPassant =
    piece.type === PieceType.Pawn &&
    game.position.enPassantTarget !== null &&
    squaresEqual(to, game.position.enPassantTarget)
  const isCastleKingside =
    piece.type === PieceType.King && to.file - from.file === 2
  const isCastleQueenside =
    piece.type === PieceType.King && from.file - to.file === 2

  let moveType: MoveType
  if (isCastleKingside) {
    moveType = MoveType.CastleKingside
  } else if (isCastleQueenside) {
    moveType = MoveType.CastleQueenside
  } else if (isEnPassant) {
    moveType = MoveType.EnPassant
  } else if (isPromotion) {
    moveType = captured ? MoveType.PromotionCapture : MoveType.Promotion
  } else if (captured) {
    moveType = MoveType.Capture
  } else {
    moveType = MoveType.Normal
  }

  // Build the captured piece for en passant
  const capturedPiece = isEnPassant
    ? getPieceAt(game.position, { rank: from.rank, file: to.file })
    : captured

  // Apply the move
  const newPosition = clonePosition(game.position)

  // Move the piece
  newPosition.squares[to.rank]![to.file] = isPromotion
    ? { type: promotionPiece!, color: piece.color }
    : { ...piece }
  newPosition.squares[from.rank]![from.file] = null

  // Handle en passant capture
  if (isEnPassant) {
    newPosition.squares[from.rank]![to.file] = null
  }

  // Handle castling rook movement
  if (isCastleKingside) {
    newPosition.squares[from.rank]![5] = newPosition.squares[from.rank]![7]!
    newPosition.squares[from.rank]![7] = null
  } else if (isCastleQueenside) {
    newPosition.squares[from.rank]![3] = newPosition.squares[from.rank]![0]!
    newPosition.squares[from.rank]![0] = null
  }

  // Update castling rights
  const cr = { ...newPosition.castlingRights }
  if (piece.type === PieceType.King) {
    if (piece.color === PieceColor.White) {
      cr.whiteKingside = false
      cr.whiteQueenside = false
    } else {
      cr.blackKingside = false
      cr.blackQueenside = false
    }
  }
  if (piece.type === PieceType.Rook) {
    if (from.rank === 0 && from.file === 0) cr.whiteQueenside = false
    if (from.rank === 0 && from.file === 7) cr.whiteKingside = false
    if (from.rank === 7 && from.file === 0) cr.blackQueenside = false
    if (from.rank === 7 && from.file === 7) cr.blackKingside = false
  }
  // If a rook is captured, revoke its castling right
  if (captured?.type === PieceType.Rook) {
    if (to.rank === 0 && to.file === 0) cr.whiteQueenside = false
    if (to.rank === 0 && to.file === 7) cr.whiteKingside = false
    if (to.rank === 7 && to.file === 0) cr.blackQueenside = false
    if (to.rank === 7 && to.file === 7) cr.blackKingside = false
  }
  newPosition.castlingRights = cr

  // Update en passant target
  if (
    piece.type === PieceType.Pawn &&
    Math.abs(to.rank - from.rank) === 2
  ) {
    newPosition.enPassantTarget = {
      rank: (from.rank + to.rank) / 2,
      file: from.file,
    }
  } else {
    newPosition.enPassantTarget = null
  }

  // Update half-move clock
  if (piece.type === PieceType.Pawn || captured || isEnPassant) {
    newPosition.halfMoveClock = 0
  } else {
    newPosition.halfMoveClock = game.position.halfMoveClock + 1
  }

  // Update full move number
  if (piece.color === PieceColor.Black) {
    newPosition.fullMoveNumber = game.position.fullMoveNumber + 1
  } else {
    newPosition.fullMoveNumber = game.position.fullMoveNumber
  }

  // Switch active color
  newPosition.activeColor = oppositeColor(piece.color)

  // Build the Move record (notation computed after position update)
  const move: Move = {
    piece: { ...piece },
    from,
    to,
    captured: capturedPiece ? { ...capturedPiece } : null,
    moveType,
    promotionPiece: isPromotion ? promotionPiece! : null,
    notation: '', // filled below
  }

  // Generate algebraic notation
  move.notation = toAlgebraicNotation(game.position, move, newPosition)

  // Compute position hash for repetition tracking
  const posHash = toPositionHash(newPosition)

  // Determine game status
  let status = GameStatus.InProgress
  if (isCheckmate(newPosition)) {
    status = GameStatus.Checkmate
  } else if (isStalemate(newPosition)) {
    status = GameStatus.Stalemate
  }

  return {
    ...game,
    position: newPosition,
    status,
    moveHistory: [...game.moveHistory, move],
    positionHistory: [...game.positionHistory, posHash],
    pendingDrawOffer: false,
  }
}

export function resign(game: Game): Game {
  if (game.status !== GameStatus.InProgress) return game
  return { ...game, status: GameStatus.Resigned }
}

export function offerDraw(game: Game): Game {
  if (game.status !== GameStatus.InProgress) return game
  return { ...game, pendingDrawOffer: true }
}

export function acceptDraw(game: Game): Game {
  if (!game.pendingDrawOffer) return game
  return { ...game, status: GameStatus.DrawByAgreement, pendingDrawOffer: false }
}

export function claimDraw(
  game: Game,
  reason: 'repetition' | 'fifty-move',
): Game | DrawClaimError {
  if (game.status !== GameStatus.InProgress) {
    return { code: DrawClaimErrorCode.INVALID_CLAIM, message: 'Game is not in progress' }
  }

  if (reason === 'repetition') {
    const currentHash = game.positionHistory[game.positionHistory.length - 1]
    const count = game.positionHistory.filter((h) => h === currentHash).length
    if (count >= 3) {
      return { ...game, status: GameStatus.DrawByRepetition, pendingDrawOffer: false }
    }
    return {
      code: DrawClaimErrorCode.INVALID_CLAIM,
      message: 'Position has not occurred three times',
    }
  }

  if (reason === 'fifty-move') {
    if (game.position.halfMoveClock >= 100) {
      return { ...game, status: GameStatus.DrawByFiftyMoveRule, pendingDrawOffer: false }
    }
    return {
      code: DrawClaimErrorCode.INVALID_CLAIM,
      message: 'Fifty-move rule not met',
    }
  }

  return { code: DrawClaimErrorCode.INVALID_CLAIM, message: 'Unknown draw reason' }
}

// Check if a draw can be claimed (for UI notification)
export function canClaimDraw(game: Game): { repetition: boolean; fiftyMove: boolean } {
  if (game.status !== GameStatus.InProgress) {
    return { repetition: false, fiftyMove: false }
  }

  const currentHash = game.positionHistory[game.positionHistory.length - 1]
  const repetitionCount = game.positionHistory.filter((h) => h === currentHash).length

  return {
    repetition: repetitionCount >= 3,
    fiftyMove: game.position.halfMoveClock >= 100,
  }
}

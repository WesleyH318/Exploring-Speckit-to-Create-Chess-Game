// T033, T040: Algebraic notation and position hashing

import {
  type BoardPosition,
  type Move,
  MoveType,
  type Piece,
  PieceColor,
  PieceType,
  type Square,
} from './types'
import { getPieceAt } from './board'
import { getValidMoves, isCheckmate, isInCheck } from './moves'

const FILE_LETTERS = 'abcdefgh'
const PIECE_LETTERS: Record<PieceType, string> = {
  [PieceType.King]: 'K',
  [PieceType.Queen]: 'Q',
  [PieceType.Rook]: 'R',
  [PieceType.Bishop]: 'B',
  [PieceType.Knight]: 'N',
  [PieceType.Pawn]: '',
}

function squareToString(sq: Square): string {
  return `${FILE_LETTERS[sq.file]}${sq.rank + 1}`
}

// Determine if disambiguation is needed for a non-pawn piece move
function getDisambiguation(
  position: BoardPosition,
  piece: Piece,
  from: Square,
  to: Square,
): string {
  if (piece.type === PieceType.Pawn || piece.type === PieceType.King) return ''

  // Find other pieces of same type and color that can also move to the destination
  const ambiguous: Square[] = []
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      if (rank === from.rank && file === from.file) continue
      const other = getPieceAt(position, { rank, file })
      if (other && other.type === piece.type && other.color === piece.color) {
        const moves = getValidMoves(position, { rank, file })
        if (moves.some((m) => m.rank === to.rank && m.file === to.file)) {
          ambiguous.push({ rank, file })
        }
      }
    }
  }

  if (ambiguous.length === 0) return ''

  const sameFile = ambiguous.some((s) => s.file === from.file)
  const sameRank = ambiguous.some((s) => s.rank === from.rank)

  if (!sameFile) return FILE_LETTERS[from.file]!
  if (!sameRank) return `${from.rank + 1}`
  return `${FILE_LETTERS[from.file]}${from.rank + 1}`
}

// Convert a move to Standard Algebraic Notation
// positionAfterMove is the board state AFTER the move has been applied
export function toAlgebraicNotation(
  positionBeforeMove: BoardPosition,
  move: Move,
  positionAfterMove: BoardPosition,
): string {
  // Castling
  if (move.moveType === MoveType.CastleKingside) {
    let notation = 'O-O'
    if (isCheckmate(positionAfterMove)) notation += '#'
    else if (isInCheck(positionAfterMove, positionAfterMove.activeColor))
      notation += '+'
    return notation
  }
  if (move.moveType === MoveType.CastleQueenside) {
    let notation = 'O-O-O'
    if (isCheckmate(positionAfterMove)) notation += '#'
    else if (isInCheck(positionAfterMove, positionAfterMove.activeColor))
      notation += '+'
    return notation
  }

  let notation = ''
  const isPawn = move.piece.type === PieceType.Pawn
  const isCapture =
    move.moveType === MoveType.Capture ||
    move.moveType === MoveType.EnPassant ||
    move.moveType === MoveType.PromotionCapture

  if (isPawn) {
    if (isCapture) {
      notation += FILE_LETTERS[move.from.file]
    }
  } else {
    notation += PIECE_LETTERS[move.piece.type]
    notation += getDisambiguation(
      positionBeforeMove,
      move.piece,
      move.from,
      move.to,
    )
  }

  if (isCapture) notation += 'x'
  notation += squareToString(move.to)

  // Promotion
  if (
    move.promotionPiece &&
    (move.moveType === MoveType.Promotion ||
      move.moveType === MoveType.PromotionCapture)
  ) {
    notation += '=' + PIECE_LETTERS[move.promotionPiece]
  }

  // Check / checkmate
  if (isCheckmate(positionAfterMove)) {
    notation += '#'
  } else if (isInCheck(positionAfterMove, positionAfterMove.activeColor)) {
    notation += '+'
  }

  return notation
}

// Generate a unique string hash for position (for threefold repetition)
export function toPositionHash(position: BoardPosition): string {
  const parts: string[] = []

  // Piece placement
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = position.squares[rank]![file]
      if (piece) {
        const colorChar = piece.color === PieceColor.White ? 'w' : 'b'
        const typeChar = PIECE_LETTERS[piece.type] || 'P'
        parts.push(`${rank}${file}${colorChar}${typeChar}`)
      }
    }
  }

  // Active color
  parts.push(position.activeColor === PieceColor.White ? 'w' : 'b')

  // Castling rights
  const cr = position.castlingRights
  let castling = ''
  if (cr.whiteKingside) castling += 'K'
  if (cr.whiteQueenside) castling += 'Q'
  if (cr.blackKingside) castling += 'k'
  if (cr.blackQueenside) castling += 'q'
  parts.push(castling || '-')

  // En passant target
  if (position.enPassantTarget) {
    parts.push(squareToString(position.enPassantTarget))
  } else {
    parts.push('-')
  }

  return parts.join('|')
}

// Format game result string
export function formatResult(
  winner: PieceColor | null,
  isDraw: boolean,
): string {
  if (isDraw) return '1/2-1/2'
  if (winner === PieceColor.White) return '1-0'
  if (winner === PieceColor.Black) return '0-1'
  return '*'
}

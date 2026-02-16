// T005: All shared types and enums per data-model.md

export enum PieceType {
  King = 'King',
  Queen = 'Queen',
  Rook = 'Rook',
  Bishop = 'Bishop',
  Knight = 'Knight',
  Pawn = 'Pawn',
}

export enum PieceColor {
  White = 'White',
  Black = 'Black',
}

export enum GameStatus {
  InProgress = 'InProgress',
  Checkmate = 'Checkmate',
  Stalemate = 'Stalemate',
  DrawByRepetition = 'DrawByRepetition',
  DrawByFiftyMoveRule = 'DrawByFiftyMoveRule',
  DrawByAgreement = 'DrawByAgreement',
  Resigned = 'Resigned',
}

export enum MoveType {
  Normal = 'Normal',
  Capture = 'Capture',
  EnPassant = 'EnPassant',
  CastleKingside = 'CastleKingside',
  CastleQueenside = 'CastleQueenside',
  Promotion = 'Promotion',
  PromotionCapture = 'PromotionCapture',
}

export interface Square {
  rank: number // 0-7 (rank 1-8)
  file: number // 0-7 (a-h)
}

export interface Piece {
  type: PieceType
  color: PieceColor
}

export interface Move {
  piece: Piece
  from: Square
  to: Square
  captured: Piece | null
  moveType: MoveType
  promotionPiece: PieceType | null
  notation: string
}

export interface CastlingRights {
  whiteKingside: boolean
  whiteQueenside: boolean
  blackKingside: boolean
  blackQueenside: boolean
}

export interface BoardPosition {
  squares: (Piece | null)[][]
  activeColor: PieceColor
  castlingRights: CastlingRights
  enPassantTarget: Square | null
  halfMoveClock: number
  fullMoveNumber: number
}

export interface Game {
  id: string
  position: BoardPosition
  status: GameStatus
  moveHistory: Move[]
  positionHistory: string[]
  createdAt: number
  pendingDrawOffer: boolean
}

export enum MoveErrorCode {
  NOT_YOUR_TURN = 'NOT_YOUR_TURN',
  NO_PIECE = 'NO_PIECE',
  ILLEGAL_MOVE = 'ILLEGAL_MOVE',
  GAME_OVER = 'GAME_OVER',
  PROMOTION_REQUIRED = 'PROMOTION_REQUIRED',
  INVALID_PROMOTION = 'INVALID_PROMOTION',
}

export interface MoveError {
  code: MoveErrorCode
  message: string
}

export enum DrawClaimErrorCode {
  INVALID_CLAIM = 'INVALID_CLAIM',
}

export interface DrawClaimError {
  code: DrawClaimErrorCode
  message: string
}

export function isMoveError(result: Game | MoveError): result is MoveError {
  return 'code' in result && 'message' in result && !('position' in result)
}

export function isDrawClaimError(
  result: Game | DrawClaimError,
): result is DrawClaimError {
  return 'code' in result && 'message' in result && !('position' in result)
}

export function squaresEqual(a: Square, b: Square): boolean {
  return a.rank === b.rank && a.file === b.file
}

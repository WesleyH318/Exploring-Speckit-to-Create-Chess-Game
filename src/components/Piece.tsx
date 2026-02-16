import { PieceColor, PieceType, type Piece as PieceData } from '../engine/types'

const SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  [PieceColor.White]: {
    [PieceType.King]: '♔',
    [PieceType.Queen]: '♕',
    [PieceType.Rook]: '♖',
    [PieceType.Bishop]: '♗',
    [PieceType.Knight]: '♘',
    [PieceType.Pawn]: '♙',
  },
  [PieceColor.Black]: {
    [PieceType.King]: '♚',
    [PieceType.Queen]: '♛',
    [PieceType.Rook]: '♜',
    [PieceType.Bishop]: '♝',
    [PieceType.Knight]: '♞',
    [PieceType.Pawn]: '♟',
  },
}

interface Props {
  piece: PieceData
}

export default function Piece({ piece }: Props) {
  return (
    <span
      style={{
        fontSize: '2.5rem',
        userSelect: 'none',
        cursor: 'inherit',
        lineHeight: 1,
      }}
    >
      {SYMBOLS[piece.color][piece.type]}
    </span>
  )
}

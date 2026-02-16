import { PieceColor, PieceType } from '../engine/types'
import Piece from './Piece'

interface Props {
  color: PieceColor
  onSelect: (pieceType: PieceType) => void
}

const PROMOTION_CHOICES = [
  PieceType.Queen,
  PieceType.Rook,
  PieceType.Bishop,
  PieceType.Knight,
]

export default function PromotionDialog({ color, onSelect }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: '#2c2c2c',
          borderRadius: 8,
          padding: '16px 24px',
          display: 'flex',
          gap: 12,
          border: '2px solid #555',
        }}
      >
        <div
          style={{
            color: '#fff',
            marginBottom: 8,
            textAlign: 'center',
            width: '100%',
            position: 'absolute',
            top: -32,
            left: 0,
            fontSize: '0.9rem',
          }}
        />
        {PROMOTION_CHOICES.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            style={{
              background: '#444',
              border: '1px solid #666',
              borderRadius: 4,
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
            }}
            title={`Promote to ${type}`}
          >
            <Piece piece={{ type, color }} />
          </button>
        ))}
      </div>
    </div>
  )
}

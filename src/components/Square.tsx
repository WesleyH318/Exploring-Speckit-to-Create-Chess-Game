import type { Piece as PieceData } from '../engine/types'
import Piece from './Piece'

interface Props {
  piece: PieceData | null
  isLight: boolean
  isSelected: boolean
  isValidMove: boolean
  isCheck: boolean
  onClick: () => void
}

export default function Square({
  piece,
  isLight,
  isSelected,
  isValidMove,
  isCheck,
  onClick,
}: Props) {
  let bg = isLight ? '#f0d9b5' : '#b58863'
  if (isSelected) bg = '#829769'
  if (isCheck) bg = '#e66'

  return (
    <div
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {piece && <Piece piece={piece} />}
      {isValidMove && !piece && (
        <div
          style={{
            width: '30%',
            height: '30%',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}
        />
      )}
      {isValidMove && piece && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '4px solid rgba(0,0,0,0.2)',
          }}
        />
      )}
    </div>
  )
}

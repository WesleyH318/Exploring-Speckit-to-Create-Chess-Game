import { GameStatus as GameStatusEnum, PieceColor } from '../engine/types'

interface Props {
  status: GameStatusEnum
  activeColor: PieceColor
  isCheck: boolean
}

function getStatusMessage(status: GameStatusEnum, activeColor: PieceColor): string {
  switch (status) {
    case GameStatusEnum.Checkmate: {
      const winner =
        activeColor === PieceColor.White ? 'Black' : 'White'
      return `Checkmate! ${winner} wins`
    }
    case GameStatusEnum.Stalemate:
      return 'Stalemate — Draw'
    case GameStatusEnum.Resigned: {
      const winner =
        activeColor === PieceColor.White ? 'Black' : 'White'
      return `${activeColor} resigned — ${winner} wins`
    }
    case GameStatusEnum.DrawByRepetition:
      return 'Draw by threefold repetition'
    case GameStatusEnum.DrawByFiftyMoveRule:
      return 'Draw by fifty-move rule'
    case GameStatusEnum.DrawByAgreement:
      return 'Draw by agreement'
    case GameStatusEnum.InProgress:
      return ''
  }
}

export default function GameStatus({ status, activeColor, isCheck }: Props) {
  const isGameOver = status !== GameStatusEnum.InProgress

  return (
    <div style={{ textAlign: 'center', minHeight: 48, padding: '8px 0' }}>
      {isGameOver ? (
        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffd700' }}>
          {getStatusMessage(status, activeColor)}
        </div>
      ) : (
        <>
          <div style={{ fontSize: '1rem' }}>
            {activeColor === PieceColor.White ? '⬜' : '⬛'}{' '}
            {activeColor}&apos;s turn
          </div>
          {isCheck && (
            <div style={{ color: '#ff6b6b', fontWeight: 'bold', marginTop: 4 }}>
              Check!
            </div>
          )}
        </>
      )}
    </div>
  )
}

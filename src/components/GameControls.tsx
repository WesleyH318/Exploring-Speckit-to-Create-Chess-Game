import { GameStatus } from '../engine/types'

interface Props {
  gameStatus: GameStatus
  onNewGame: () => void
  onResign: () => void
  onOfferDraw: () => void
  onAcceptDraw: () => void
  onDeclineDraw: () => void
  onClaimDraw: (reason: 'repetition' | 'fifty-move') => void
  pendingDrawOffer: boolean
  canClaimRepetition: boolean
  canClaimFiftyMove: boolean
}

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: 500,
}

export default function GameControls({
  gameStatus,
  onNewGame,
  onResign,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onClaimDraw,
  pendingDrawOffer,
  canClaimRepetition,
  canClaimFiftyMove,
}: Props) {
  const isInProgress = gameStatus === GameStatus.InProgress

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        onClick={() => {
          if (isInProgress && !window.confirm('Start a new game? Current game will be lost.')) return
          onNewGame()
        }}
        style={{ ...buttonStyle, backgroundColor: '#4a9eff', color: '#fff' }}
      >
        New Game
      </button>

      {isInProgress && (
        <>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to resign?')) onResign()
            }}
            style={{ ...buttonStyle, backgroundColor: '#e55', color: '#fff' }}
          >
            Resign
          </button>

          {!pendingDrawOffer && (
            <button
              onClick={onOfferDraw}
              style={{ ...buttonStyle, backgroundColor: '#888', color: '#fff' }}
            >
              Offer Draw
            </button>
          )}

          {pendingDrawOffer && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onAcceptDraw}
                style={{ ...buttonStyle, backgroundColor: '#5a5', color: '#fff', flex: 1 }}
              >
                Accept Draw
              </button>
              <button
                onClick={onDeclineDraw}
                style={{ ...buttonStyle, backgroundColor: '#a55', color: '#fff', flex: 1 }}
              >
                Decline
              </button>
            </div>
          )}

          {canClaimRepetition && (
            <button
              onClick={() => onClaimDraw('repetition')}
              style={{ ...buttonStyle, backgroundColor: '#c90', color: '#fff' }}
            >
              Claim Draw (Repetition)
            </button>
          )}

          {canClaimFiftyMove && (
            <button
              onClick={() => onClaimDraw('fifty-move')}
              style={{ ...buttonStyle, backgroundColor: '#c90', color: '#fff' }}
            >
              Claim Draw (50-Move Rule)
            </button>
          )}
        </>
      )}
    </div>
  )
}

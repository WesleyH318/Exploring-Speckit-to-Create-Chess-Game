import type { Move } from '../engine/types'

interface Props {
  moves: Move[]
  currentMoveIndex: number | null
  gameResult: string
  onMoveClick: (index: number) => void
  onStepForward: () => void
  onStepBack: () => void
}

export default function MoveHistory({
  moves,
  currentMoveIndex,
  gameResult,
  onMoveClick,
  onStepForward,
  onStepBack,
}: Props) {
  // Group moves into pairs (white, black)
  const pairs: { number: number; white: Move; black?: Move }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i]!,
      black: moves[i + 1],
    })
  }

  return (
    <div
      style={{
        backgroundColor: '#262421',
        borderRadius: 4,
        padding: 8,
        minWidth: 200,
        maxHeight: 400,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: '0.85rem',
          fontWeight: 'bold',
          marginBottom: 8,
          color: '#aaa',
        }}
      >
        Moves
      </div>

      <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.85rem' }}>
        {pairs.map((pair) => {
          const whiteIdx = (pair.number - 1) * 2
          const blackIdx = whiteIdx + 1
          return (
            <div
              key={pair.number}
              style={{ display: 'flex', gap: 4, marginBottom: 2 }}
            >
              <span style={{ color: '#666', width: 28, textAlign: 'right' }}>
                {pair.number}.
              </span>
              <span
                onClick={() => onMoveClick(whiteIdx)}
                style={{
                  cursor: 'pointer',
                  padding: '1px 4px',
                  borderRadius: 2,
                  backgroundColor:
                    currentMoveIndex === whiteIdx ? '#4a9eff' : 'transparent',
                  color: currentMoveIndex === whiteIdx ? '#fff' : '#ddd',
                  flex: 1,
                }}
              >
                {pair.white.notation}
              </span>
              {pair.black && (
                <span
                  onClick={() => onMoveClick(blackIdx)}
                  style={{
                    cursor: 'pointer',
                    padding: '1px 4px',
                    borderRadius: 2,
                    backgroundColor:
                      currentMoveIndex === blackIdx ? '#4a9eff' : 'transparent',
                    color: currentMoveIndex === blackIdx ? '#fff' : '#ddd',
                    flex: 1,
                  }}
                >
                  {pair.black.notation}
                </span>
              )}
            </div>
          )
        })}
        {gameResult && moves.length > 0 && (
          <div style={{ textAlign: 'center', color: '#ffd700', marginTop: 8 }}>
            {gameResult}
          </div>
        )}
      </div>

      {moves.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          <button
            onClick={onStepBack}
            style={{
              background: '#444',
              border: 'none',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            ◀
          </button>
          <button
            onClick={onStepForward}
            style={{
              background: '#444',
              border: 'none',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  )
}

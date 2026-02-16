import { useChessGame } from './hooks/useChessGame'
import { GameStatus as GameStatusEnum } from './engine/types'
import { formatResult } from './engine/notation'
import Board from './components/Board'
import GameStatus from './components/GameStatus'
import GameControls from './components/GameControls'
import MoveHistory from './components/MoveHistory'
import PromotionDialog from './components/PromotionDialog'

function App() {
  const {
    game,
    displayPosition,
    selectedSquare,
    validMoves,
    isCheck,
    checkSquare,
    reviewIndex,
    promotionPending,
    canClaimRepetition,
    canClaimFiftyMove,
    winner,
    selectSquare,
    newGame,
    resignGame,
    promote,
    offerDraw,
    acceptDraw,
    declineDraw,
    claimDraw,
    reviewMove,
    stepForward,
    stepBack,
  } = useChessGame()

  const isGameOver = game.status !== GameStatusEnum.InProgress
  const isDraw = [
    GameStatusEnum.Stalemate,
    GameStatusEnum.DrawByRepetition,
    GameStatusEnum.DrawByFiftyMoveRule,
    GameStatusEnum.DrawByAgreement,
  ].includes(game.status)

  const gameResult = isGameOver ? formatResult(winner, isDraw) : ''

  return (
    <div className="app">
      <div className="game-panel">
        <GameStatus
          status={game.status}
          activeColor={game.position.activeColor}
          isCheck={isCheck}
        />

        <Board
          position={displayPosition}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          isCheck={isCheck}
          checkSquare={checkSquare}
          onSquareClick={selectSquare}
        />

        {reviewIndex !== null && (
          <div style={{ textAlign: 'center', color: '#ffa', fontSize: '0.85rem', marginTop: 4 }}>
            Reviewing move {reviewIndex + 1} — click a square to return to game
          </div>
        )}
      </div>

      <div className="sidebar">
        <GameControls
          gameStatus={game.status}
          onNewGame={newGame}
          onResign={resignGame}
          onOfferDraw={offerDraw}
          onAcceptDraw={acceptDraw}
          onDeclineDraw={declineDraw}
          onClaimDraw={claimDraw}
          pendingDrawOffer={game.pendingDrawOffer}
          canClaimRepetition={canClaimRepetition}
          canClaimFiftyMove={canClaimFiftyMove}
        />

        <MoveHistory
          moves={game.moveHistory}
          currentMoveIndex={reviewIndex}
          gameResult={gameResult}
          onMoveClick={reviewMove}
          onStepForward={stepForward}
          onStepBack={stepBack}
        />
      </div>

      {promotionPending && (
        <PromotionDialog
          color={game.position.activeColor}
          onSelect={promote}
        />
      )}
    </div>
  )
}

export default App

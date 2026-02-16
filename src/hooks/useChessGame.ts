// T026, T028, T036, T045: Game state hook with persistence and review mode

import { useReducer, useEffect, useCallback } from 'react'
import {
  type Game,
  GameStatus,
  type PieceType,
  type Square,
  isMoveError,
  isDrawClaimError,
  PieceColor,
} from '../engine/types'
import {
  createGame,
  makeMove,
  resign,
  offerDraw,
  acceptDraw,
  claimDraw,
  canClaimDraw,
} from '../engine/game'
import { getValidMoves, isInCheck } from '../engine/moves'
import { findKing } from '../engine/board'
import { toPositionHash } from '../engine/notation'

const STORAGE_KEY = 'chess-game-state'

interface GameState {
  game: Game
  selectedSquare: Square | null
  validMoves: Square[]
  reviewIndex: number | null // null = live view, number = reviewing move at index
  promotionPending: { from: Square; to: Square } | null
}

type GameAction =
  | { type: 'SELECT_SQUARE'; square: Square }
  | { type: 'NEW_GAME' }
  | { type: 'RESIGN' }
  | { type: 'PROMOTE'; pieceType: PieceType }
  | { type: 'CANCEL_PROMOTION' }
  | { type: 'OFFER_DRAW' }
  | { type: 'ACCEPT_DRAW' }
  | { type: 'DECLINE_DRAW' }
  | { type: 'CLAIM_DRAW'; reason: 'repetition' | 'fifty-move' }
  | { type: 'REVIEW_MOVE'; index: number }
  | { type: 'STEP_FORWARD' }
  | { type: 'STEP_BACK' }
  | { type: 'EXIT_REVIEW' }
  | { type: 'RESTORE'; game: Game }

function createInitialState(): GameState {
  return {
    game: createGame(),
    selectedSquare: null,
    validMoves: [],
    reviewIndex: null,
    promotionPending: null,
  }
}

function applyMove(
  state: GameState,
  from: Square,
  to: Square,
  promotionPiece?: PieceType,
): GameState {
  const result = makeMove(state.game, from, to, promotionPiece)
  if (isMoveError(result)) {
    // If promotion is required, show the dialog
    if (result.code === 'PROMOTION_REQUIRED') {
      return { ...state, promotionPending: { from, to } }
    }
    // Other errors: deselect
    return { ...state, selectedSquare: null, validMoves: [] }
  }
  return {
    ...state,
    game: result,
    selectedSquare: null,
    validMoves: [],
    reviewIndex: null,
    promotionPending: null,
  }
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_SQUARE': {
      // If in review mode, exit it and allow play
      if (state.reviewIndex !== null) {
        return { ...state, reviewIndex: null, selectedSquare: null, validMoves: [] }
      }

      if (state.game.status !== GameStatus.InProgress) return state
      if (state.promotionPending) return state

      const { square } = action
      const { game } = state

      // If a piece is already selected, try to move
      if (state.selectedSquare) {
        const isValidDest = state.validMoves.some(
          (m) => m.rank === square.rank && m.file === square.file,
        )
        if (isValidDest) {
          return applyMove(state, state.selectedSquare, square)
        }
      }

      // Select a new piece (must be active color)
      const piece = game.position.squares[square.rank]?.[square.file]
      if (piece && piece.color === game.position.activeColor) {
        const moves = getValidMoves(game.position, square)
        return { ...state, selectedSquare: square, validMoves: moves }
      }

      // Clicked empty or opponent piece with nothing selected
      return { ...state, selectedSquare: null, validMoves: [] }
    }

    case 'NEW_GAME':
      return createInitialState()

    case 'RESIGN': {
      if (state.game.status !== GameStatus.InProgress) return state
      return {
        ...state,
        game: resign(state.game),
        selectedSquare: null,
        validMoves: [],
      }
    }

    case 'PROMOTE': {
      if (!state.promotionPending) return state
      const { from, to } = state.promotionPending
      return applyMove(
        { ...state, promotionPending: null },
        from,
        to,
        action.pieceType,
      )
    }

    case 'CANCEL_PROMOTION':
      return { ...state, promotionPending: null, selectedSquare: null, validMoves: [] }

    case 'OFFER_DRAW':
      return { ...state, game: offerDraw(state.game) }

    case 'ACCEPT_DRAW':
      return {
        ...state,
        game: acceptDraw(state.game),
        selectedSquare: null,
        validMoves: [],
      }

    case 'DECLINE_DRAW':
      return { ...state, game: { ...state.game, pendingDrawOffer: false } }

    case 'CLAIM_DRAW': {
      const result = claimDraw(state.game, action.reason)
      if (isDrawClaimError(result)) return state
      return {
        ...state,
        game: result,
        selectedSquare: null,
        validMoves: [],
      }
    }

    case 'REVIEW_MOVE': {
      const maxIndex = state.game.moveHistory.length - 1
      const index = Math.max(-1, Math.min(action.index, maxIndex))
      return {
        ...state,
        reviewIndex: index < 0 ? null : index,
        selectedSquare: null,
        validMoves: [],
      }
    }

    case 'STEP_FORWARD': {
      if (state.reviewIndex === null) return state
      const nextIndex = state.reviewIndex + 1
      if (nextIndex >= state.game.moveHistory.length) {
        return { ...state, reviewIndex: null }
      }
      return { ...state, reviewIndex: nextIndex }
    }

    case 'STEP_BACK': {
      if (state.reviewIndex === null) {
        // Go back from live to last move
        const lastIndex = state.game.moveHistory.length - 2
        if (lastIndex < 0) return state
        return { ...state, reviewIndex: lastIndex, selectedSquare: null, validMoves: [] }
      }
      if (state.reviewIndex <= 0) return state
      return { ...state, reviewIndex: state.reviewIndex - 1 }
    }

    case 'EXIT_REVIEW':
      return { ...state, reviewIndex: null, selectedSquare: null, validMoves: [] }

    case 'RESTORE':
      return { ...state, game: action.game }

    default:
      return state
  }
}

// Reconstruct a board position by replaying moves up to a given index
function getPositionAtMove(game: Game, moveIndex: number): Game['position'] {
  // Replay from start
  let replayGame = createGame()
  for (let i = 0; i <= moveIndex && i < game.moveHistory.length; i++) {
    const move = game.moveHistory[i]!
    const result = makeMove(replayGame, move.from, move.to, move.promotionPiece ?? undefined)
    if (!isMoveError(result)) {
      replayGame = result
    }
  }
  return replayGame.position
}

export function useChessGame() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Game
        // Validate it has expected shape
        if (parsed.position && parsed.status && parsed.moveHistory) {
          // Recompute position history hashes
          if (!parsed.positionHistory || parsed.positionHistory.length === 0) {
            parsed.positionHistory = [toPositionHash(parsed.position)]
          }
          if (parsed.pendingDrawOffer === undefined) {
            parsed.pendingDrawOffer = false
          }
          dispatch({ type: 'RESTORE', game: parsed })
        }
      }
    } catch {
      // Ignore invalid saved state
    }
  }, [])

  // Persist to localStorage on every game change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.game))
    } catch {
      // Ignore storage errors
    }
  }, [state.game])

  const displayPosition =
    state.reviewIndex !== null
      ? getPositionAtMove(state.game, state.reviewIndex)
      : state.game.position

  const activeColor = state.game.position.activeColor
  const inCheck = isInCheck(state.game.position, activeColor)
  const checkSquare = inCheck ? findKing(state.game.position, activeColor) : null

  const drawClaims = canClaimDraw(state.game)

  const selectSquare = useCallback(
    (square: Square) => dispatch({ type: 'SELECT_SQUARE', square }),
    [],
  )
  const newGame = useCallback(() => dispatch({ type: 'NEW_GAME' }), [])
  const resignGame = useCallback(() => dispatch({ type: 'RESIGN' }), [])
  const promote = useCallback(
    (pieceType: PieceType) => dispatch({ type: 'PROMOTE', pieceType }),
    [],
  )
  const handleOfferDraw = useCallback(
    () => dispatch({ type: 'OFFER_DRAW' }),
    [],
  )
  const handleAcceptDraw = useCallback(
    () => dispatch({ type: 'ACCEPT_DRAW' }),
    [],
  )
  const handleDeclineDraw = useCallback(
    () => dispatch({ type: 'DECLINE_DRAW' }),
    [],
  )
  const handleClaimDraw = useCallback(
    (reason: 'repetition' | 'fifty-move') =>
      dispatch({ type: 'CLAIM_DRAW', reason }),
    [],
  )
  const reviewMove = useCallback(
    (index: number) => dispatch({ type: 'REVIEW_MOVE', index }),
    [],
  )
  const stepForward = useCallback(
    () => dispatch({ type: 'STEP_FORWARD' }),
    [],
  )
  const stepBack = useCallback(() => dispatch({ type: 'STEP_BACK' }), [])

  // Determine who won (for result display)
  const getWinner = (): PieceColor | null => {
    if (state.game.status === GameStatus.Checkmate) {
      // The player whose turn it is has been checkmated
      return state.game.position.activeColor === PieceColor.White
        ? PieceColor.Black
        : PieceColor.White
    }
    if (state.game.status === GameStatus.Resigned) {
      return state.game.position.activeColor === PieceColor.White
        ? PieceColor.Black
        : PieceColor.White
    }
    return null
  }

  return {
    game: state.game,
    displayPosition,
    selectedSquare: state.selectedSquare,
    validMoves: state.validMoves,
    isCheck: inCheck,
    checkSquare,
    isReviewing: state.reviewIndex !== null,
    reviewIndex: state.reviewIndex,
    promotionPending: state.promotionPending,
    canClaimRepetition: drawClaims.repetition,
    canClaimFiftyMove: drawClaims.fiftyMove,
    winner: getWinner(),
    selectSquare,
    newGame,
    resignGame,
    promote,
    offerDraw: handleOfferDraw,
    acceptDraw: handleAcceptDraw,
    declineDraw: handleDeclineDraw,
    claimDraw: handleClaimDraw,
    reviewMove,
    stepForward,
    stepBack,
  }
}

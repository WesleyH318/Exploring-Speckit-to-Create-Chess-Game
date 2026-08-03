// Game state persisted inside the issue body, and replay back into a Game.
//
// The issue body is the database. A single HTML comment holds the move list,
// so the state is invisible to readers but survives edits to the prose around
// it, and any game can be reconstructed by replaying through the real engine.

import { acceptDraw, createGame, makeMove, offerDraw, resign } from '../../src/engine/game'
import { isMoveError, type Game } from '../../src/engine/types'
import { parseMove } from './commands'

export interface StoredState {
  moves: string[]
  end: 'resign' | 'draw' | null
  offer: boolean
}

const STATE_PATTERN = /<!-- chess-state v1(?: moves="([^"]*)")?(?: end="([^"]*)")?(?: offer="([^"]*)")? -->/

export const EMPTY_STATE: StoredState = { moves: [], end: null, offer: false }

/** Read persisted state from an issue body, or null if the issue has no game. */
export function readState(body: string): StoredState | null {
  const match = STATE_PATTERN.exec(body)
  if (!match) return null

  const moves = (match[1] ?? '').split(/\s+/).filter(Boolean)
  const rawEnd = match[2] ?? ''
  const end = rawEnd === 'resign' || rawEnd === 'draw' ? rawEnd : null

  return { moves, end, offer: match[3] === '1' }
}

/** Serialise state into the marker comment. */
export function formatState(state: StoredState): string {
  const parts = [`moves="${state.moves.join(' ')}"`]
  if (state.end) parts.push(`end="${state.end}"`)
  if (state.offer) parts.push('offer="1"')
  return `<!-- chess-state v1 ${parts.join(' ')} -->`
}

/**
 * Replace the state marker in a body, appending one if absent so a plain issue
 * can be adopted as a game board.
 */
export function writeState(body: string, state: StoredState): string {
  const marker = formatState(state)
  if (STATE_PATTERN.test(body)) return body.replace(STATE_PATTERN, marker)
  return `${body.trimEnd()}\n\n${marker}`
}

export interface ReplayFailure {
  error: string
}

export function isReplayFailure(
  result: Game | ReplayFailure,
): result is ReplayFailure {
  return 'error' in result
}

/**
 * Rebuild a Game by replaying stored moves through the engine.
 *
 * Nothing about the position is trusted from storage — only the move list is,
 * and every move is re-validated. A corrupted or hand-edited marker therefore
 * fails loudly rather than producing an illegal position.
 */
export function replay(state: StoredState): Game | ReplayFailure {
  let game = createGame()

  for (const [index, raw] of state.moves.entries()) {
    const parsed = parseMove(raw)
    if (!parsed) {
      return { error: `Stored move ${index + 1} (\`${raw}\`) is not valid coordinate notation.` }
    }

    const result = makeMove(
      game,
      parsed.from,
      parsed.to,
      parsed.promotion ?? undefined,
    )
    if (isMoveError(result)) {
      return { error: `Stored move ${index + 1} (\`${raw}\`) is illegal: ${result.message}` }
    }
    game = result
  }

  if (state.end === 'resign') return resign(game)

  // acceptDraw() is a no-op without a pending offer, so an accepted draw has to
  // be replayed as offer-then-accept even though the stored offer flag is
  // cleared once the draw completes.
  if (state.end === 'draw') return acceptDraw(offerDraw(game))

  return state.offer ? offerDraw(game) : game
}

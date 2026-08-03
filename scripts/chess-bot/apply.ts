// Pure command application: (state, command) -> (state, game, reply).
//
// Kept free of network access so the whole decision layer is unit-testable.

import { makeMove } from '../../src/engine/game'
import { GameStatus, isMoveError, type Game } from '../../src/engine/types'
import { formatSquare, type Command } from './commands'
import { EMPTY_STATE, isReplayFailure, replay, type StoredState } from './state'

export interface Applied {
  ok: true
  state: StoredState
  game: Game
  reply: string
  /** Whether the issue body needs rewriting. False for read-only commands. */
  boardChanged: boolean
}

export interface Rejected {
  ok: false
  reply: string
}

export type ApplyOutcome = Applied | Rejected

function isOver(game: Game): boolean {
  return game.status !== GameStatus.InProgress
}

export function applyCommand(
  state: StoredState,
  command: Command,
  actor: string,
): ApplyOutcome {
  if (command.kind === 'new') {
    const fresh = replay(EMPTY_STATE)
    if (isReplayFailure(fresh)) return { ok: false, reply: fresh.error }
    return {
      ok: true,
      state: EMPTY_STATE,
      game: fresh,
      reply: `@${actor} started a new game. White to move.`,
      boardChanged: true,
    }
  }

  const current = replay(state)
  if (isReplayFailure(current)) {
    return {
      ok: false,
      reply: `${current.error}\n\nThe stored game is unreadable. Start over with \`/chess new\`.`,
    }
  }

  if (command.kind === 'help') {
    return {
      ok: true,
      state,
      game: current,
      reply: 'See the **How to play** section in the issue body for the command list.',
      boardChanged: false,
    }
  }

  if (isOver(current)) {
    return {
      ok: false,
      reply: 'This game is already finished. Start another with `/chess new`.',
    }
  }

  switch (command.kind) {
    case 'resign':
      return {
        ok: true,
        state: { ...state, end: 'resign', offer: false },
        game: replayOrThrow({ ...state, end: 'resign', offer: false }),
        reply: `@${actor} resigned.`,
        boardChanged: true,
      }

    case 'draw': {
      if (state.offer) {
        return { ok: false, reply: 'A draw has already been offered.' }
      }
      const next = { ...state, offer: true }
      return {
        ok: true,
        state: next,
        game: replayOrThrow(next),
        reply: `@${actor} offers a draw. Reply \`/chess accept\` to agree.`,
        boardChanged: true,
      }
    }

    case 'accept': {
      if (!state.offer) {
        return { ok: false, reply: 'There is no draw offer to accept.' }
      }
      const next: StoredState = { ...state, end: 'draw', offer: false }
      return {
        ok: true,
        state: next,
        game: replayOrThrow(next),
        reply: `@${actor} accepted the draw.`,
        boardChanged: true,
      }
    }

    case 'move': {
      const result = makeMove(
        current,
        command.from,
        command.to,
        command.promotion ?? undefined,
      )

      if (isMoveError(result)) {
        return {
          ok: false,
          reply: `${formatSquare(command.from)}–${formatSquare(command.to)} is not playable: ${result.message}`,
        }
      }

      const played = result.moveHistory[result.moveHistory.length - 1]!
      const next: StoredState = {
        moves: [...state.moves, command.raw],
        end: null,
        // Any move supersedes an outstanding draw offer.
        offer: false,
      }

      return {
        ok: true,
        state: next,
        game: result,
        reply: `@${actor} played **${played.notation}**.${describeOutcome(result)}`,
        boardChanged: true,
      }
    }
  }
}

function describeOutcome(game: Game): string {
  switch (game.status) {
    case GameStatus.Checkmate:
      return ' Checkmate!'
    case GameStatus.Stalemate:
      return ' Stalemate — the game is drawn.'
    case GameStatus.DrawByRepetition:
      return ' Draw by threefold repetition.'
    case GameStatus.DrawByFiftyMoveRule:
      return ' Draw by the fifty-move rule.'
    default:
      return ''
  }
}

/**
 * Replay a state that was just derived from an already-valid one. A failure
 * here means the bot built an inconsistent state, which is a bug rather than
 * bad user input, so it throws instead of returning a reply.
 */
function replayOrThrow(state: StoredState): Game {
  const game = replay(state)
  if (isReplayFailure(game)) {
    throw new Error(`Internally inconsistent state: ${game.error}`)
  }
  return game
}

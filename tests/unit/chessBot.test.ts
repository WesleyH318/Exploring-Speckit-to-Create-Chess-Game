import { describe, expect, it } from 'vitest'
import { PieceType } from '../../src/engine/types'
import { formatSquare, parseComment, parseMove, parseSquare } from '../../scripts/chess-bot/commands'
import {
  EMPTY_STATE,
  formatState,
  isReplayFailure,
  readState,
  replay,
  writeState,
} from '../../scripts/chess-bot/state'
import { applyCommand } from '../../scripts/chess-bot/apply'
import { renderBoard } from '../../scripts/chess-bot/render'

describe('square parsing', () => {
  it('maps algebraic squares to engine coordinates', () => {
    expect(parseSquare('a1')).toEqual({ rank: 0, file: 0 })
    expect(parseSquare('e2')).toEqual({ rank: 1, file: 4 })
    expect(parseSquare('h8')).toEqual({ rank: 7, file: 7 })
  })

  it('rejects out-of-range squares', () => {
    expect(parseSquare('i1')).toBeNull()
    expect(parseSquare('a9')).toBeNull()
    expect(parseSquare('e')).toBeNull()
  })

  it('round-trips through formatSquare', () => {
    for (const square of ['a1', 'd4', 'e2', 'h8']) {
      expect(formatSquare(parseSquare(square)!)).toBe(square)
    }
  })
})

describe('move parsing', () => {
  it('parses a coordinate move', () => {
    const move = parseMove('e2e4')
    expect(move?.from).toEqual({ rank: 1, file: 4 })
    expect(move?.to).toEqual({ rank: 3, file: 4 })
    expect(move?.promotion).toBeNull()
  })

  it('parses a promotion suffix', () => {
    expect(parseMove('e7e8q')?.promotion).toBe(PieceType.Queen)
    expect(parseMove('e7e8n')?.promotion).toBe(PieceType.Knight)
  })

  it('is case insensitive and normalises the raw form', () => {
    expect(parseMove('E2E4')?.raw).toBe('e2e4')
  })

  it('rejects malformed moves', () => {
    expect(parseMove('e2e9')).toBeNull()
    expect(parseMove('e2e4k')).toBeNull()
    expect(parseMove('hello')).toBeNull()
  })
})

describe('comment parsing', () => {
  it('ignores comments with no command', () => {
    expect(parseComment('nice game!')).toBeNull()
  })

  it('finds a command on any line', () => {
    expect(parseComment('here goes\n/chess new\nthanks')).toEqual({ kind: 'new' })
  })

  it('accepts a bare move without the move keyword', () => {
    const parsed = parseComment('/chess e2e4')
    expect(parsed).toMatchObject({ kind: 'move', raw: 'e2e4' })
  })

  it('accepts an explicit move keyword', () => {
    expect(parseComment('/chess move e2e4')).toMatchObject({ kind: 'move', raw: 'e2e4' })
  })

  it('reports unusable input rather than throwing', () => {
    expect(parseComment('/chess wat')).toMatchObject({ kind: 'error' })
    expect(parseComment('/chess move')).toMatchObject({ kind: 'error' })
  })
})

describe('state persistence', () => {
  it('round-trips through format and read', () => {
    const state = { moves: ['e2e4', 'e7e5'], end: null, offer: true }
    expect(readState(formatState(state))).toEqual(state)
  })

  it('returns null when the body holds no game', () => {
    expect(readState('just an ordinary issue')).toBeNull()
  })

  it('appends a marker to a body that lacks one', () => {
    const body = writeState('Some prose.', { moves: ['e2e4'], end: null, offer: false })
    expect(readState(body)?.moves).toEqual(['e2e4'])
    expect(body.startsWith('Some prose.')).toBe(true)
  })

  it('replaces an existing marker rather than adding a second', () => {
    const first = writeState('Prose.', { moves: ['e2e4'], end: null, offer: false })
    const second = writeState(first, { moves: ['e2e4', 'e7e5'], end: null, offer: false })
    expect(second.match(/chess-state/g)).toHaveLength(1)
    expect(readState(second)?.moves).toEqual(['e2e4', 'e7e5'])
  })
})

describe('replay', () => {
  it('rebuilds a game from its move list', () => {
    const game = replay({ moves: ['e2e4', 'e7e5'], end: null, offer: false })
    expect(isReplayFailure(game)).toBe(false)
    if (isReplayFailure(game)) return
    expect(game.moveHistory).toHaveLength(2)
    expect(game.moveHistory[0]!.notation).toBe('e4')
  })

  it('rejects a stored move that is illegal', () => {
    const game = replay({ moves: ['e2e5'], end: null, offer: false })
    expect(isReplayFailure(game)).toBe(true)
  })

  it('reconstructs an accepted draw despite the cleared offer flag', () => {
    const game = replay({ moves: ['e2e4'], end: 'draw', offer: false })
    expect(isReplayFailure(game)).toBe(false)
    if (isReplayFailure(game)) return
    expect(game.status).toBe('DrawByAgreement')
  })

  it('reconstructs a resignation', () => {
    const game = replay({ moves: [], end: 'resign', offer: false })
    expect(isReplayFailure(game)).toBe(false)
    if (isReplayFailure(game)) return
    expect(game.status).toBe('Resigned')
  })
})

describe('applyCommand', () => {
  it('records a legal move', () => {
    const outcome = applyCommand(EMPTY_STATE, parseMove('e2e4')!, 'wes')
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.state.moves).toEqual(['e2e4'])
    expect(outcome.reply).toContain('**e4**')
  })

  it('refuses an illegal move without changing state', () => {
    const outcome = applyCommand(EMPTY_STATE, parseMove('e2e5')!, 'wes')
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reply).toContain('not playable')
  })

  it('refuses to move once the game is over', () => {
    const resigned = { moves: [], end: 'resign' as const, offer: false }
    const outcome = applyCommand(resigned, parseMove('e2e4')!, 'wes')
    expect(outcome.ok).toBe(false)
  })

  it('clears a draw offer when a move is played', () => {
    const offered = { moves: ['e2e4'], end: null, offer: true }
    const outcome = applyCommand(offered, parseMove('e7e5')!, 'wes')
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.state.offer).toBe(false)
  })

  it('rejects accepting a draw that was never offered', () => {
    const outcome = applyCommand(EMPTY_STATE, { kind: 'accept' }, 'wes')
    expect(outcome.ok).toBe(false)
  })

  it('completes an offered draw', () => {
    const offered = { moves: ['e2e4'], end: null, offer: true }
    const outcome = applyCommand(offered, { kind: 'accept' }, 'wes')
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.state.end).toBe('draw')
    expect(outcome.game.status).toBe('DrawByAgreement')
  })

  it('detects checkmate through the engine', () => {
    // Fool's Mate: 1. f3 e5 2. g4 Qh4#
    const state = { moves: ['f2f3', 'e7e5', 'g2g4'], end: null, offer: false }
    const outcome = applyCommand(state, parseMove('d8h4')!, 'wes')
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.game.status).toBe('Checkmate')
    expect(outcome.reply).toContain('Checkmate')
  })

  it('starts a fresh game', () => {
    const played = { moves: ['e2e4', 'e7e5'], end: null, offer: false }
    const outcome = applyCommand(played, { kind: 'new' }, 'wes')
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.state.moves).toEqual([])
  })
})

describe('renderBoard', () => {
  it('puts rank 8 at the top and rank 1 at the bottom', () => {
    const game = replay(EMPTY_STATE)
    if (isReplayFailure(game)) throw new Error(game.error)
    const lines = renderBoard(game.position).split('\n')

    expect(lines[1]).toBe('8 ♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜')
    expect(lines[8]).toBe('1 ♖ ♘ ♗ ♕ ♔ ♗ ♘ ♖')
    expect(lines[9]).toBe('  a b c d e f g h')
  })

  it('marks empty squares', () => {
    const game = replay(EMPTY_STATE)
    if (isReplayFailure(game)) throw new Error(game.error)
    expect(renderBoard(game.position)).toContain('· · · · · · · ·')
  })
})

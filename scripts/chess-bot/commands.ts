// Parsing of the bot's issue-comment command language.

import { PieceType, type Square } from '../../src/engine/types'

export interface MoveCommand {
  kind: 'move'
  from: Square
  to: Square
  promotion: PieceType | null
  raw: string
}

export interface SimpleCommand {
  kind: 'new' | 'resign' | 'draw' | 'accept' | 'help'
}

export type Command = MoveCommand | SimpleCommand

export interface ParseFailure {
  kind: 'error'
  message: string
}

const PROMOTION_PIECES: Record<string, PieceType> = {
  q: PieceType.Queen,
  r: PieceType.Rook,
  b: PieceType.Bishop,
  n: PieceType.Knight,
}

/**
 * Parse a square in algebraic form ("e2") into engine coordinates.
 * Returns null when the text is not a valid square.
 */
export function parseSquare(text: string): Square | null {
  if (!/^[a-h][1-8]$/.test(text)) return null
  return {
    file: text.charCodeAt(0) - 'a'.charCodeAt(0),
    rank: Number(text[1]) - 1,
  }
}

/** Render engine coordinates back to algebraic form ("e2"). */
export function formatSquare(square: Square): string {
  return `${String.fromCharCode('a'.charCodeAt(0) + square.file)}${square.rank + 1}`
}

/**
 * Parse a coordinate move such as "e2e4", or "e7e8q" for promotion.
 * Returns null when the text is not a well-formed move.
 */
export function parseMove(text: string): MoveCommand | null {
  const match = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/i.exec(text.trim())
  if (!match) return null

  const from = parseSquare(match[1]!.toLowerCase())
  const to = parseSquare(match[2]!.toLowerCase())
  if (!from || !to) return null

  const suffix = match[3]?.toLowerCase()
  return {
    kind: 'move',
    from,
    to,
    promotion: suffix ? PROMOTION_PIECES[suffix]! : null,
    raw: `${match[1]!.toLowerCase()}${match[2]!.toLowerCase()}${suffix ?? ''}`,
  }
}

/**
 * Extract a bot command from an issue comment.
 *
 * Recognised forms, one per comment:
 *   /chess new
 *   /chess move e2e4     (the "move" keyword is optional)
 *   /chess e7e8q
 *   /chess resign | draw | accept | help
 *
 * Returns null when the comment contains no /chess command at all, so callers
 * can silently ignore ordinary conversation.
 */
export function parseComment(body: string): Command | ParseFailure | null {
  const line = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => /^\/chess\b/i.test(l))

  if (!line) return null

  const rest = line.replace(/^\/chess\b/i, '').trim()
  if (rest === '') return { kind: 'help' }

  const words = rest.split(/\s+/)
  const first = words[0]!.toLowerCase()

  switch (first) {
    case 'new':
      return { kind: 'new' }
    case 'resign':
      return { kind: 'resign' }
    case 'draw':
      return { kind: 'draw' }
    case 'accept':
      return { kind: 'accept' }
    case 'help':
      return { kind: 'help' }
    case 'move': {
      const arg = words[1]
      if (!arg) return { kind: 'error', message: 'No move given after `move`.' }
      const move = parseMove(arg)
      return (
        move ?? {
          kind: 'error',
          message: `\`${arg}\` is not a move. Use coordinates like \`e2e4\`, or \`e7e8q\` to promote.`,
        }
      )
    }
    default: {
      const move = parseMove(first)
      return (
        move ?? {
          kind: 'error',
          message: `\`${first}\` is not a command or a move. Try \`/chess help\`.`,
        }
      )
    }
  }
}

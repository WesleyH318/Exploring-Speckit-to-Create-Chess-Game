// Markdown rendering of a game for display in the issue body.

import {
  GameStatus,
  PieceColor,
  PieceType,
  type BoardPosition,
  type Game,
} from '../../src/engine/types'

const GLYPHS: Record<PieceColor, Record<PieceType, string>> = {
  [PieceColor.White]: {
    [PieceType.King]: '♔',
    [PieceType.Queen]: '♕',
    [PieceType.Rook]: '♖',
    [PieceType.Bishop]: '♗',
    [PieceType.Knight]: '♘',
    [PieceType.Pawn]: '♙',
  },
  [PieceColor.Black]: {
    [PieceType.King]: '♚',
    [PieceType.Queen]: '♛',
    [PieceType.Rook]: '♜',
    [PieceType.Bishop]: '♝',
    [PieceType.Knight]: '♞',
    [PieceType.Pawn]: '♟',
  },
}

/**
 * Render the board as a fenced code block, rank 8 at the top.
 *
 * Engine rank 0 is chess rank 1, so ranks are walked in reverse to put Black's
 * back rank first, matching how the React board displays it.
 */
export function renderBoard(position: BoardPosition): string {
  const lines: string[] = []

  for (let rank = 7; rank >= 0; rank--) {
    const cells: string[] = []
    for (let file = 0; file < 8; file++) {
      const piece = position.squares[rank]?.[file] ?? null
      cells.push(piece ? GLYPHS[piece.color][piece.type] : '·')
    }
    lines.push(`${rank + 1} ${cells.join(' ')}`)
  }

  lines.push('  a b c d e f g h')
  return ['```', ...lines, '```'].join('\n')
}

/** Move history as a numbered list of algebraic move pairs. */
export function renderMoveHistory(game: Game): string {
  if (game.moveHistory.length === 0) return '_No moves yet._'

  const rows: string[] = []
  for (let i = 0; i < game.moveHistory.length; i += 2) {
    const number = i / 2 + 1
    const white = game.moveHistory[i]!.notation
    const black = game.moveHistory[i + 1]?.notation ?? ''
    rows.push(`${number}. ${white} ${black}`.trimEnd())
  }
  return ['```', ...rows, '```'].join('\n')
}

/** One-line description of whose turn it is, or how the game ended. */
export function renderStatus(game: Game): string {
  const toMove = game.position.activeColor === PieceColor.White ? 'White' : 'Black'
  const lastMover = game.position.activeColor === PieceColor.White ? 'Black' : 'White'

  switch (game.status) {
    case GameStatus.Checkmate:
      return `**Checkmate — ${lastMover} wins.**`
    case GameStatus.Stalemate:
      return '**Draw by stalemate.**'
    case GameStatus.DrawByRepetition:
      return '**Draw by threefold repetition.**'
    case GameStatus.DrawByFiftyMoveRule:
      return '**Draw by the fifty-move rule.**'
    case GameStatus.DrawByAgreement:
      return '**Draw by agreement.**'
    case GameStatus.Resigned:
      return `**${toMove} resigned — ${lastMover} wins.**`
    default:
      return game.pendingDrawOffer
        ? `**${toMove} to move.** A draw has been offered — reply \`/chess accept\` to take it.`
        : `**${toMove} to move.**`
  }
}

const HELP = [
  '<details><summary>How to play</summary>',
  '',
  'Comment on this issue with one of:',
  '',
  '| Command | Effect |',
  '| --- | --- |',
  '| `/chess e2e4` | Play a move in coordinate notation |',
  '| `/chess e7e8q` | Promote a pawn (`q`, `r`, `b`, or `n`) |',
  '| `/chess new` | Start a fresh game in this issue |',
  '| `/chess draw` | Offer a draw |',
  '| `/chess accept` | Accept an offered draw |',
  '| `/chess resign` | Resign |',
  '',
  'Moves are validated by the same engine that powers the web app, and the',
  'full move list is stored in this issue so the game can always be replayed.',
  '',
  '</details>',
].join('\n')

/** The complete issue body for a game, excluding the state marker. */
export function renderIssueBody(game: Game): string {
  return [
    '## Chess',
    '',
    renderStatus(game),
    '',
    renderBoard(game.position),
    '',
    '### Moves',
    '',
    renderMoveHistory(game),
    '',
    HELP,
  ].join('\n')
}

# Chess Game

A complete, playable chess game built with React, TypeScript, and Vite — created as an exploration of [spec-kit](https://github.com/github/spec-kit) driven development.

## Features

- Full legal move generation for all six piece types
- Check, checkmate, and stalemate detection
- Special moves: castling, en passant, and pawn promotion
- Draw detection: threefold repetition, the fifty-move rule, and draw by agreement
- Algebraic notation move history
- Click-to-select with valid-move highlighting

## Chess bot (GitHub API integration)

The repository also hosts a bot that lets a game be played in the comments of a
GitHub issue. It is a genuine GitHub API integration: a workflow reacts to
`issue_comment` events, validates the move with the same engine that powers the
web app, then rewrites the issue body and replies via the REST API.

Comment on any issue with:

| Command | Effect |
| --- | --- |
| `/chess e2e4` | Play a move in coordinate notation |
| `/chess e7e8q` | Promote a pawn (`q`, `r`, `b`, or `n`) |
| `/chess new` | Start a fresh game in that issue |
| `/chess draw` / `/chess accept` | Offer and accept a draw |
| `/chess resign` | Resign |

The issue body is the only storage. A single HTML comment holds the move list,
and the position is rebuilt by replaying every move through the engine — the
stored position is never trusted, so a hand-edited marker fails loudly instead
of producing an illegal board.

Source lives in `scripts/chess-bot/`, with the decision layer (`commands.ts`,
`state.ts`, `apply.ts`) kept free of network access so it is unit-testable;
`github.ts` and `index.ts` hold the I/O.

## Requirements

- Node.js 20.19+ (or 22.12+), as required by Vite 7
- npm

## Getting started

```bash
npm install
npm run dev
```

Vite prints the local URL, typically <http://localhost:5173/>. If that port is
already in use it automatically picks the next free one, so use whichever URL
it reports.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server with hot module reloading |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run typecheck` | Type-check without emitting output |
| `npm run lint` | Lint with ESLint |

## Project structure

```
src/
  engine/      Pure game logic — no React imports
    types.ts     Core type definitions
    board.ts     Board representation and square access
    moves.ts     Move generation and legality
    game.ts      Game state, check/checkmate, draw detection
    notation.ts  Algebraic notation
  components/  Presentational React components
  hooks/
    useChessGame.ts  Game state wired to the UI
scripts/
  chess-bot/     GitHub issue-comment bot built on the same engine
tests/
  unit/         Engine tests
  integration/  Full gameplay flows driven through the UI
```

The engine is deliberately free of React dependencies, so it can be tested and
reused independently of the interface.

## Testing

```bash
npm test
```

The suite covers move generation, special moves, and draw detection, plus
integration tests that play real games through the UI - including Scholar's
Mate (`1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#`).

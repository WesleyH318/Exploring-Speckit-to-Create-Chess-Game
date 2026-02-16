# Quickstart: Chess Game

**Branch**: `001-chess-game` | **Date**: 2026-02-16

## Prerequisites

- Node.js 20+ (LTS)
- npm 10+ (bundled with Node.js)

## Setup

```bash
# Clone and switch to feature branch
git clone <repo-url>
cd my-project
git checkout 001-chess-game

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Type check without emitting
npm run typecheck

# Lint source files
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```text
src/
├── engine/              # Pure chess logic (no UI deps)
│   ├── board.ts         # Board creation, piece queries
│   ├── moves.ts         # Move generation, validation
│   ├── game.ts          # Game state management
│   ├── notation.ts      # Algebraic notation conversion
│   └── types.ts         # Shared type definitions
├── components/          # React UI components
│   ├── Board.tsx        # 8x8 grid rendering
│   ├── Square.tsx       # Individual square with piece
│   ├── Piece.tsx        # Piece icon rendering
│   ├── MoveHistory.tsx  # Notation panel
│   ├── GameControls.tsx # New Game, Resign, Draw buttons
│   ├── PromotionDialog.tsx # Piece selection for promotion
│   └── GameStatus.tsx   # Check/checkmate/draw display
├── hooks/
│   └── useChessGame.ts  # Game state hook (useReducer)
├── App.tsx              # Root component
├── App.css              # Application styles
└── main.tsx             # Entry point

tests/
├── unit/                # Engine unit tests
│   ├── board.test.ts
│   ├── moves.test.ts
│   ├── game.test.ts
│   └── notation.test.ts
├── integration/         # Full game flow tests
│   ├── gameplay.test.tsx
│   ├── specialMoves.test.tsx
│   └── drawDetection.test.tsx
└── setup.ts             # Test configuration
```

## Playing the Game

1. Open the app in a browser.
2. Click **New Game** to start.
3. White moves first — click a white piece to select it.
4. Legal moves are highlighted on the board.
5. Click a highlighted square to move the piece.
6. The turn switches to Black automatically.
7. Continue alternating turns until checkmate, stalemate,
   or a player resigns/draws.

## Key Interactions

- **Select piece**: Click a piece of the active color.
- **Move piece**: Click a highlighted destination square.
- **Deselect**: Click the selected piece again or an empty
  non-highlighted square.
- **Pawn promotion**: A dialog appears when a pawn reaches
  the last rank. Choose Queen, Rook, Bishop, or Knight.
- **Resign**: Click the Resign button. Confirms before ending.
- **Offer Draw**: Click Offer Draw. Opponent accepts or declines.
- **New Game**: Click New Game to reset. Confirms if a game
  is in progress.

## Reviewing Moves

- The move history panel shows all moves in algebraic notation.
- Click any move to view the board at that point.
- Use forward/back buttons to step through positions.
- Make a move on the board to exit review mode and return
  to the current position.

## Verification Checklist

After setup, verify these work:

1. `npm run dev` — App loads with empty board screen
2. `npm run test` — All tests pass (once implemented)
3. `npm run build` — Production build succeeds
4. Click New Game → board appears with 32 pieces
5. Click a white pawn → legal moves highlighted
6. Click a highlighted square → piece moves, turn switches

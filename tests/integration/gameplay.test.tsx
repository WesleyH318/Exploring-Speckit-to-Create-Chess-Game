// T029: Integration test for full gameplay flow
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../../src/App'

// Helper: click a board square by rank and file (0-indexed)
function clickSquare(rank: number, file: number) {
  fireEvent.click(screen.getByTestId(`square-${rank}-${file}`))
}

// Helper: make a move by clicking from-square then to-square
function move(fromRank: number, fromFile: number, toRank: number, toFile: number) {
  clickSquare(fromRank, fromFile)
  clickSquare(toRank, toFile)
}

describe('Full gameplay flow', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('plays Scholar\'s Mate and displays checkmate (1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#)', () => {
    render(<App />)

    // Verify game starts with white's turn
    expect(screen.getByText(/White's turn/i)).toBeInTheDocument()

    // 1. e4 (e2→e4)
    move(1, 4, 3, 4)
    expect(screen.getByText(/Black's turn/i)).toBeInTheDocument()

    // 1... e5 (e7→e5)
    move(6, 4, 4, 4)
    expect(screen.getByText(/White's turn/i)).toBeInTheDocument()

    // 2. Bc4 (Bf1→c4)
    move(0, 5, 3, 2)
    expect(screen.getByText(/Black's turn/i)).toBeInTheDocument()

    // 2... Nc6 (Nb8→c6)
    move(7, 1, 5, 2)
    expect(screen.getByText(/White's turn/i)).toBeInTheDocument()

    // 3. Qh5 (Qd1→h5)
    move(0, 3, 4, 7)
    expect(screen.getByText(/Black's turn/i)).toBeInTheDocument()

    // 3... Nf6 (Ng8→f6)
    move(7, 6, 5, 5)
    expect(screen.getByText(/White's turn/i)).toBeInTheDocument()

    // 4. Qxf7# (Qh5→f7, checkmate)
    move(4, 7, 6, 5)

    // Verify checkmate is displayed
    expect(screen.getByText(/Checkmate/i)).toBeInTheDocument()
    expect(screen.getByText(/White wins/i)).toBeInTheDocument()
  })

  it('plays moves and shows them in move history panel', () => {
    render(<App />)

    // 1. e4
    move(1, 4, 3, 4)
    expect(screen.getByText('e4')).toBeInTheDocument()

    // 1... e5
    move(6, 4, 4, 4)
    expect(screen.getByText('e5')).toBeInTheDocument()

    // 2. Nf3
    move(0, 6, 2, 5)
    expect(screen.getByText('Nf3')).toBeInTheDocument()
  })

  it('resign ends the game', () => {
    render(<App />)

    // Play one move first
    move(1, 4, 3, 4)

    // Click Resign button (confirm is mocked to return true)
    fireEvent.click(screen.getByText('Resign'))

    // Game should show resignation result
    expect(screen.getByText(/resigned/i)).toBeInTheDocument()
  })

  it('New Game resets the board', () => {
    render(<App />)

    // Play a move
    move(1, 4, 3, 4)
    expect(screen.getByText('e4')).toBeInTheDocument()

    // Click New Game
    fireEvent.click(screen.getByText('New Game'))

    // Should be back to white's turn with no moves
    expect(screen.getByText(/White's turn/i)).toBeInTheDocument()
    expect(screen.queryByText('e4')).not.toBeInTheDocument()
  })

  it('prevents moves after game is over', () => {
    render(<App />)

    // Play Scholar's Mate
    move(1, 4, 3, 4)  // e4
    move(6, 4, 4, 4)  // e5
    move(0, 5, 3, 2)  // Bc4
    move(7, 1, 5, 2)  // Nc6
    move(0, 3, 4, 7)  // Qh5
    move(7, 6, 5, 5)  // Nf6
    move(4, 7, 6, 5)  // Qxf7#

    expect(screen.getByText(/Checkmate/i)).toBeInTheDocument()

    // Try to make another move — should have no effect
    clickSquare(6, 0) // try clicking a black pawn
    // Game should still show checkmate
    expect(screen.getByText(/Checkmate/i)).toBeInTheDocument()
  })
})

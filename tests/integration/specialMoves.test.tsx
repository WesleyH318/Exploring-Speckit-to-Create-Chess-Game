// T030: Integration test for special moves UI (castling, en passant, promotion)
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../../src/App'

function clickSquare(rank: number, file: number) {
  fireEvent.click(screen.getByTestId(`square-${rank}-${file}`))
}

function move(fromRank: number, fromFile: number, toRank: number, toFile: number) {
  clickSquare(fromRank, fromFile)
  clickSquare(toRank, toFile)
}

describe('Special moves via UI', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('performs kingside castling via clicks', () => {
    render(<App />)

    // Clear path for white kingside castling: need to move knight and bishop
    // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O
    move(1, 4, 3, 4)  // e4
    move(6, 4, 4, 4)  // e5
    move(0, 6, 2, 5)  // Nf3
    move(7, 1, 5, 2)  // Nc6
    move(0, 5, 3, 2)  // Bc4
    move(7, 5, 4, 2)  // Bc5

    // Now castle: click king on e1, then g1
    move(0, 4, 0, 6)

    // Move history should show O-O
    expect(screen.getByText('O-O')).toBeInTheDocument()
  })

  it('performs queenside castling via clicks', () => {
    render(<App />)

    // Clear path for white queenside castling: need to move queen, bishop, knight
    // 1. d4 d5 2. Nc3 Nf6 3. Bf4 Bg4 4. Qd3 e6 5. O-O-O
    move(1, 3, 3, 3)  // d4
    move(6, 3, 4, 3)  // d5
    move(0, 1, 2, 2)  // Nc3
    move(7, 6, 5, 5)  // Nf6
    move(0, 2, 3, 5)  // Bf4 (c1 bishop to f4)
    move(7, 2, 3, 6)  // Bg4 (c8 bishop to g4)
    move(0, 3, 2, 3)  // Qd3 (d1 queen to d3)
    move(6, 4, 5, 4)  // e6

    // Castle queenside: click king e1 → c1
    move(0, 4, 0, 2)

    // Move history should show O-O-O
    expect(screen.getByText('O-O-O')).toBeInTheDocument()
  })

  it('performs en passant capture via clicks', () => {
    render(<App />)

    // Set up en passant: 1. e4 d5 2. e5 f5 3. exf6 (en passant)
    move(1, 4, 3, 4)  // e4
    move(6, 3, 4, 3)  // d5
    move(3, 4, 4, 4)  // e5
    move(6, 5, 4, 5)  // f5 (double push, creates en passant target on f6)

    // Now capture en passant: white pawn on e5 captures on f6
    move(4, 4, 5, 5)  // exf6 (en passant)

    // The move history should show the en passant capture
    expect(screen.getByText('exf6')).toBeInTheDocument()
  })

  it('shows promotion dialog and promotes pawn', () => {
    render(<App />)

    // Get a white pawn to rank 7 (8th rank) via captures:
    // 1. a4 b5 2. axb5 a6 3. bxa6 c5 4. a7 d5 5. a8=Q
    move(1, 0, 3, 0)  // a4
    move(6, 1, 4, 1)  // b5
    move(3, 0, 4, 1)  // axb5
    move(6, 0, 5, 0)  // a6
    move(4, 1, 5, 0)  // bxa6
    move(6, 2, 4, 2)  // c5
    move(5, 0, 6, 0)  // a7
    move(6, 3, 4, 3)  // d5

    // Capture diagonally to promote (black knight is on b8)
    move(6, 0, 7, 1)  // axb8=Q — should trigger promotion dialog

    // Promotion dialog should appear with piece choices
    const queenButton = screen.getByTitle('Promote to Queen')
    expect(queenButton).toBeInTheDocument()

    // Also verify other choices exist
    expect(screen.getByTitle('Promote to Rook')).toBeInTheDocument()
    expect(screen.getByTitle('Promote to Bishop')).toBeInTheDocument()
    expect(screen.getByTitle('Promote to Knight')).toBeInTheDocument()

    // Select Queen
    fireEvent.click(queenButton)

    // Dialog should disappear and move should be recorded
    expect(screen.queryByTitle('Promote to Queen')).not.toBeInTheDocument()
  })
})

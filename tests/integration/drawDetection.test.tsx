// T046: Integration test for draw detection (repetition, draw offer/accept)
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

describe('Draw detection via UI', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('draw offer and accept flow', () => {
    render(<App />)

    // Play a move so game is in progress
    move(1, 4, 3, 4) // e4

    // Offer Draw button should be visible
    const offerBtn = screen.getByText('Offer Draw')
    expect(offerBtn).toBeInTheDocument()
    fireEvent.click(offerBtn)

    // Accept/Decline buttons should appear
    expect(screen.getByText('Accept Draw')).toBeInTheDocument()
    expect(screen.getByText('Decline')).toBeInTheDocument()

    // Accept the draw
    fireEvent.click(screen.getByText('Accept Draw'))

    // Game should show draw by agreement
    expect(screen.getByText(/Draw by agreement/i)).toBeInTheDocument()
  })

  it('draw offer and decline flow', () => {
    render(<App />)

    move(1, 4, 3, 4) // e4

    // Offer draw
    fireEvent.click(screen.getByText('Offer Draw'))
    expect(screen.getByText('Accept Draw')).toBeInTheDocument()

    // Decline
    fireEvent.click(screen.getByText('Decline'))

    // Game should continue — Offer Draw button should reappear
    expect(screen.getByText('Offer Draw')).toBeInTheDocument()
    expect(screen.getByText(/Black's turn/i)).toBeInTheDocument()
  })

  it('threefold repetition: claim draw after repeating position 3 times', () => {
    render(<App />)

    // Repeat moves with knights to reach starting position 3 times:
    // Initial position = occurrence 1
    // After Nf3 Nf6 Ng1 Ng8 = occurrence 2
    // After Nf3 Nf6 Ng1 Ng8 = occurrence 3

    // Round 1: Nf3 Nf6 Ng1 Ng8
    move(0, 6, 2, 5)  // Nf3
    move(7, 6, 5, 5)  // Nf6
    move(2, 5, 0, 6)  // Ng1
    move(5, 5, 7, 6)  // Ng8

    // Round 2: Nf3 Nf6 Ng1 Ng8
    move(0, 6, 2, 5)  // Nf3
    move(7, 6, 5, 5)  // Nf6
    move(2, 5, 0, 6)  // Ng1
    move(5, 5, 7, 6)  // Ng8

    // Now the starting position has occurred 3 times
    // The "Claim Draw (Repetition)" button should appear
    const claimBtn = screen.getByText('Claim Draw (Repetition)')
    expect(claimBtn).toBeInTheDocument()

    fireEvent.click(claimBtn)

    // Game should end as draw by repetition
    expect(screen.getByText(/Draw by threefold repetition/i)).toBeInTheDocument()
  })
})

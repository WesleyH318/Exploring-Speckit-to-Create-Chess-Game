// T015, T016: Move generation and validation

import {
  type BoardPosition,
  type Piece,
  PieceColor,
  PieceType,
  type Square,
  squaresEqual,
} from './types'
import { clonePosition, findKing, getPieceAt, isSquareAttacked } from './board'

function isInBounds(rank: number, file: number): boolean {
  return rank >= 0 && rank < 8 && file >= 0 && file < 8
}

function oppositeColor(color: PieceColor): PieceColor {
  return color === PieceColor.White ? PieceColor.Black : PieceColor.White
}

// Generate pseudo-legal destination squares for a piece (ignores check)
function generatePseudoLegalMoves(
  position: BoardPosition,
  square: Square,
): Square[] {
  const piece = getPieceAt(position, square)
  if (!piece) return []

  const moves: Square[] = []
  const { rank, file } = square
  const color = piece.color
  const enemy = oppositeColor(color)

  switch (piece.type) {
    case PieceType.Pawn: {
      const dir = color === PieceColor.White ? 1 : -1
      const startRank = color === PieceColor.White ? 1 : 6

      // Forward one
      const fwd = rank + dir
      if (isInBounds(fwd, file) && !getPieceAt(position, { rank: fwd, file })) {
        moves.push({ rank: fwd, file })
        // Forward two from start
        const fwd2 = rank + 2 * dir
        if (
          rank === startRank &&
          isInBounds(fwd2, file) &&
          !getPieceAt(position, { rank: fwd2, file })
        ) {
          moves.push({ rank: fwd2, file })
        }
      }

      // Captures (diagonal)
      for (const df of [-1, 1]) {
        const cf = file + df
        if (isInBounds(fwd, cf)) {
          const target = getPieceAt(position, { rank: fwd, file: cf })
          if (target && target.color === enemy) {
            moves.push({ rank: fwd, file: cf })
          }
          // En passant
          if (
            position.enPassantTarget &&
            squaresEqual(position.enPassantTarget, { rank: fwd, file: cf })
          ) {
            moves.push({ rank: fwd, file: cf })
          }
        }
      }
      break
    }

    case PieceType.Knight: {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ]
      for (const [dr, df] of offsets) {
        const r = rank + dr!
        const f = file + df!
        if (isInBounds(r, f)) {
          const target = getPieceAt(position, { rank: r, file: f })
          if (!target || target.color === enemy) {
            moves.push({ rank: r, file: f })
          }
        }
      }
      break
    }

    case PieceType.Bishop: {
      addSlidingMoves(position, moves, rank, file, color, [
        [-1, -1], [-1, 1], [1, -1], [1, 1],
      ])
      break
    }

    case PieceType.Rook: {
      addSlidingMoves(position, moves, rank, file, color, [
        [-1, 0], [1, 0], [0, -1], [0, 1],
      ])
      break
    }

    case PieceType.Queen: {
      addSlidingMoves(position, moves, rank, file, color, [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
      ])
      break
    }

    case PieceType.King: {
      const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
      ]
      for (const [dr, df] of offsets) {
        const r = rank + dr!
        const f = file + df!
        if (isInBounds(r, f)) {
          const target = getPieceAt(position, { rank: r, file: f })
          if (!target || target.color === enemy) {
            moves.push({ rank: r, file: f })
          }
        }
      }

      // Castling
      const homeRank = color === PieceColor.White ? 0 : 7
      if (rank === homeRank && file === 4) {
        // Kingside
        const canKingside =
          color === PieceColor.White
            ? position.castlingRights.whiteKingside
            : position.castlingRights.blackKingside
        if (
          canKingside &&
          !getPieceAt(position, { rank: homeRank, file: 5 }) &&
          !getPieceAt(position, { rank: homeRank, file: 6 }) &&
          !isSquareAttacked(position, { rank: homeRank, file: 4 }, enemy) &&
          !isSquareAttacked(position, { rank: homeRank, file: 5 }, enemy) &&
          !isSquareAttacked(position, { rank: homeRank, file: 6 }, enemy)
        ) {
          moves.push({ rank: homeRank, file: 6 })
        }

        // Queenside
        const canQueenside =
          color === PieceColor.White
            ? position.castlingRights.whiteQueenside
            : position.castlingRights.blackQueenside
        if (
          canQueenside &&
          !getPieceAt(position, { rank: homeRank, file: 3 }) &&
          !getPieceAt(position, { rank: homeRank, file: 2 }) &&
          !getPieceAt(position, { rank: homeRank, file: 1 }) &&
          !isSquareAttacked(position, { rank: homeRank, file: 4 }, enemy) &&
          !isSquareAttacked(position, { rank: homeRank, file: 3 }, enemy) &&
          !isSquareAttacked(position, { rank: homeRank, file: 2 }, enemy)
        ) {
          moves.push({ rank: homeRank, file: 2 })
        }
      }
      break
    }
  }

  return moves
}

function addSlidingMoves(
  position: BoardPosition,
  moves: Square[],
  rank: number,
  file: number,
  color: PieceColor,
  directions: number[][],
): void {
  const enemy = oppositeColor(color)
  for (const [dr, df] of directions) {
    let r = rank + dr!
    let f = file + df!
    while (isInBounds(r, f)) {
      const target = getPieceAt(position, { rank: r, file: f })
      if (!target) {
        moves.push({ rank: r, file: f })
      } else {
        if (target.color === enemy) {
          moves.push({ rank: r, file: f })
        }
        break
      }
      r += dr!
      f += df!
    }
  }
}

// Simulate a move and check if the king is safe
function isMoveLegal(
  position: BoardPosition,
  from: Square,
  to: Square,
  piece: Piece,
): boolean {
  const simulated = clonePosition(position)

  // Apply the move on the cloned board
  simulated.squares[to.rank]![to.file] = simulated.squares[from.rank]![from.file] ?? null
  simulated.squares[from.rank]![from.file] = null

  // Handle en passant capture
  if (
    piece.type === PieceType.Pawn &&
    position.enPassantTarget &&
    squaresEqual(to, position.enPassantTarget)
  ) {
    const capturedRank = from.rank // The captured pawn is on the same rank as the moving pawn
    simulated.squares[capturedRank]![to.file] = null
  }

  // Handle castling - move the rook too
  if (piece.type === PieceType.King && Math.abs(to.file - from.file) === 2) {
    if (to.file === 6) {
      // Kingside
      simulated.squares[from.rank]![5] = simulated.squares[from.rank]![7]!
      simulated.squares[from.rank]![7] = null
    } else if (to.file === 2) {
      // Queenside
      simulated.squares[from.rank]![3] = simulated.squares[from.rank]![0]!
      simulated.squares[from.rank]![0] = null
    }
  }

  // Check if own king is in check after the move
  const kingSquare = findKing(simulated, piece.color)
  if (!kingSquare) return false
  return !isSquareAttacked(simulated, kingSquare, oppositeColor(piece.color))
}

// Public API: get all legal moves for a piece at the given square
export function getValidMoves(
  position: BoardPosition,
  square: Square,
): Square[] {
  const piece = getPieceAt(position, square)
  if (!piece || piece.color !== position.activeColor) return []

  const pseudoLegal = generatePseudoLegalMoves(position, square)
  return pseudoLegal.filter((to) => isMoveLegal(position, square, to, piece))
}

export function isInCheck(
  position: BoardPosition,
  color: PieceColor,
): boolean {
  const kingSquare = findKing(position, color)
  if (!kingSquare) return false
  return isSquareAttacked(position, kingSquare, oppositeColor(color))
}

function hasAnyLegalMoves(position: BoardPosition): boolean {
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = position.squares[rank]![file]
      if (piece && piece.color === position.activeColor) {
        const moves = getValidMoves(position, { rank, file })
        if (moves.length > 0) return true
      }
    }
  }
  return false
}

export function isCheckmate(position: BoardPosition): boolean {
  return (
    isInCheck(position, position.activeColor) &&
    !hasAnyLegalMoves(position)
  )
}

export function isStalemate(position: BoardPosition): boolean {
  return (
    !isInCheck(position, position.activeColor) &&
    !hasAnyLegalMoves(position)
  )
}

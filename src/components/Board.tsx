import { Fragment } from 'react'
import type { BoardPosition, Square as SquareType } from '../engine/types'
import { getPieceAt } from '../engine/board'
import SquareComponent from './Square'

interface Props {
  position: BoardPosition
  selectedSquare: SquareType | null
  validMoves: SquareType[]
  isCheck: boolean
  checkSquare: SquareType | null
  onSquareClick: (square: SquareType) => void
}

const FILE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export default function Board({
  position,
  selectedSquare,
  validMoves,
  checkSquare,
  onSquareClick,
}: Props) {
  const ranks = [7, 6, 5, 4, 3, 2, 1, 0]

  return (
    <div style={{ display: 'inline-block' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '24px repeat(8, 60px)',
          gridTemplateRows: 'repeat(8, 60px) 24px',
        }}
      >
        {ranks.map((rank) => (
          <Fragment key={`rank-${rank}`}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: '#aaa',
              }}
            >
              {rank + 1}
            </div>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((file) => {
              const square: SquareType = { rank, file }
              const piece = getPieceAt(position, square)
              const isLight = (rank + file) % 2 === 1
              const isSelected =
                selectedSquare !== null &&
                selectedSquare.rank === rank &&
                selectedSquare.file === file
              const isValidMove = validMoves.some(
                (m) => m.rank === rank && m.file === file,
              )
              const isCheckSquare =
                checkSquare !== null &&
                checkSquare.rank === rank &&
                checkSquare.file === file

              return (
                <SquareComponent
                  key={`${rank}-${file}`}
                  piece={piece}
                  isLight={isLight}
                  isSelected={isSelected}
                  isValidMove={isValidMove}
                  isCheck={isCheckSquare}
                  onClick={() => onSquareClick(square)}
                  testId={`square-${rank}-${file}`}
                />
              )
            })}
          </Fragment>
        ))}
        {/* File labels */}
        <div />
        {FILE_LABELS.map((label) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              color: '#aaa',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

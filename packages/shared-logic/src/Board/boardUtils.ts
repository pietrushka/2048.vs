import { TileGrid, Direction, Move } from "../types"

function createZeroMatrix(size: number): TileGrid {
  return Array.from({ length: size }, () => Array(size).fill(0))
}

const getTileValue = () => (Math.random() > 0.1 ? 2 : 4)

export function containsEmpty(board: TileGrid): boolean {
  return board.some((row) => row.some((cell) => cell === 0))
}

const getRandomCoordinate = (maxVal: number) => Math.floor(Math.random() * maxVal)

export function spawnTile(board: TileGrid) {
  if (!containsEmpty(board)) {
    return board
  }

  while (true) {
    const x = getRandomCoordinate(board.length)
    const y = getRandomCoordinate(board.length)
    if (board[x][y] === 0) {
      board[x][y] = getTileValue()
      break
    }
  }

  return board
}

export function initializeBoard(boardSize: number) {
  const board = createZeroMatrix(boardSize)

  spawnTile(board)
  spawnTile(board)

  return board
}

function rotateRight(matrix: unknown[][]) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix[i].length; j++) {
      const temp = matrix[i][j]
      matrix[i][j] = matrix[j][i]
      matrix[j][i] = temp
    }
  }
  for (let i = 0; i < matrix.length; i++) {
    matrix[i].reverse()
  }
}

export function rotateBoardLeft<T>(board: T[][], direction: Direction, reverse: boolean = false) {
  if (direction === "LEFT") {
    return board
  }

  if (reverse) {
    // If reverse is true, swap the direction
    if (direction === "RIGHT") direction = "LEFT"
    else if (direction === "UP") direction = "DOWN"
    else if (direction === "DOWN") direction = "UP"
  }

  switch (direction) {
    case "RIGHT":
    case "LEFT":
      rotateRight(board)
      rotateRight(board)
      break
    case "UP":
      rotateRight(board)
      rotateRight(board)
      rotateRight(board)
      break
    case "DOWN":
      rotateRight(board)
      break
  }

  return board
}

export function shiftTilesLeftInPlace(array: number[]) {
  let count = 0 // Count non-zero elements
  for (let i = 0; i < array.length; i++) {
    if (array[i] !== 0) {
      array[count++] = array[i] // Move non-zero element to the next available position
    }
  }
  while (count < array.length) {
    array[count++] = 0 // Fill the rest with zeros
  }
  return array
}

export function combineToLeft(row: number[]) {
  let scoreIncrease = 0 // it is much easier to calculate this during the combination

  for (let i = 0; i < row.length - 1; i++) {
    if (row[i] !== 0) {
      const areTileValuesTheSame = row[i] === row[i + 1]
      if (areTileValuesTheSame) {
        const combinedValue = row[i] * 2
        row[i] = combinedValue // write combined value
        row[i + 1] = 0
        i++ // next one will be "0" so skipping
        scoreIncrease += combinedValue
      }
    }
  }

  return { row, scoreIncrease }
}

function combineAndShiftLeft(array: number[]) {
  shiftTilesLeftInPlace(array)
  const scoreIncrease = combineToLeft(array)
  shiftTilesLeftInPlace(array)
  return scoreIncrease
}

// mutates tileGrid for performance reasons
export function slideTiles(tileGrid: TileGrid, direction: Direction) {
  let scoreIncrease = 0
  // rotate board to "LEFT" to utilize common logic
  tileGrid = rotateBoardLeft(tileGrid, direction)

  for (const row of tileGrid) {
    const { scoreIncrease: rowScoreIncrease } = combineAndShiftLeft(row)
    scoreIncrease += rowScoreIncrease
  }

  // rotate back to orginal direction
  tileGrid = rotateBoardLeft(tileGrid, direction, true)

  return { tileGrid, scoreIncrease }
}

export function movePossible(board: TileGrid): boolean {
  const boardSize = board.length

  if (containsEmpty(board)) {
    return true
  }

  const boardFlatten = board.flat()
  // Check if a tile can be merged into a neighboring tile.
  for (let i = 0; i < board.length; i++) {
    if (
      boardFlatten[i] === boardFlatten[i + boardSize] ||
      boardFlatten[i] === boardFlatten[i - boardSize] ||
      (i % boardSize !== 0 && boardFlatten[i] === boardFlatten[i - 1]) ||
      (i % boardSize !== boardSize - 1 && boardFlatten[i] === boardFlatten[i + 1])
    ) {
      return true
    }
  }

  return false
}

export function encodeTileGridState(tileGrid: TileGrid, previousMove?: Move) {
  return JSON.stringify({ tileGrid, previousMove })
}

export function decodeTileGridState(tileGridStateString: string): { tileGrid: TileGrid; previousMove?: Move } {
  return JSON.parse(tileGridStateString)
}

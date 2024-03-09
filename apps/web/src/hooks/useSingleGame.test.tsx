import { renderHook, act } from "@testing-library/react"
import { TileGrid, DIRECTIONS, Board, encodeTileGridState, initializeBoard, spawnTile } from "shared-logic"
import useSingleGame from "./useSingleGame"
import { getStoredBoardData } from "../utils/localStorage"

jest.mock("../utils/localStorage", () => ({
  getStoredBoardData: jest.fn(),
}))
const getStoredBoardDataMock = getStoredBoardData as jest.Mock

jest.mock("shared-logic", () => {
  const actualBoardUtils = jest.requireActual("shared-logic")
  return {
    ...actualBoardUtils,
    initializeBoard: jest.fn(),
    spawnTile: jest.fn(),
  }
})
const initializeBoardMock = initializeBoard as jest.Mock
const spawnTileMock = spawnTile as jest.Mock

describe("useSingleGame hook", () => {
  let setBestScoreMock = jest.fn()

  // TODO mocking in beforeEach looks like walkaround, probably should handle default mock in jest.mock
  // but wasn't able to successfully use actualBoardUtils in it
  beforeEach(() => {
    const actualBoardUtils = jest.requireActual("shared-logic")
    initializeBoardMock.mockImplementation(actualBoardUtils.initializeBoard)
    spawnTileMock.mockImplementation(actualBoardUtils.spawnTile)

    getStoredBoardDataMock.mockReturnValue(undefined)
  })

  test("initializes", () => {
    const mockTileGrid = [
      [0, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
    ] as TileGrid
    initializeBoardMock.mockImplementationOnce(() => mockTileGrid)

    const { result } = renderHook(() => useSingleGame({ bestScore: 0, setBestScore: setBestScoreMock }))

    expect(result.current.status).toEqual("active")
    expect(result.current.score).toEqual(0)
    expect(result.current.tileGridStateEncoded).toEqual(encodeTileGridState(mockTileGrid))
  })

  test("initializes with stored data if available", () => {
    const mockTileGrid = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [4, 2, 2, 128],
      [2048, 1024, 512, 256],
    ] as TileGrid
    const mockStorageData = {
      tileGrid: mockTileGrid,
      score: 10204,
    }
    getStoredBoardDataMock.mockReturnValueOnce(mockStorageData)

    const { result } = renderHook(() => useSingleGame({ bestScore: 0, setBestScore: setBestScoreMock }))

    expect(result.current.status).toEqual("active")
    expect(result.current.score).toEqual(mockStorageData.score)
    expect(result.current.tileGridStateEncoded).toEqual(encodeTileGridState(mockTileGrid))
  })

  test("performMove", () => {
    const mockTileGrid = [
      [0, 0, 0, 4],
      [0, 0, 0, 4],
      [0, 0, 0, 4],
      [0, 0, 2, 4],
    ]
    const mockMove = DIRECTIONS.UP
    initializeBoardMock.mockReturnValueOnce(mockTileGrid)

    spawnTileMock.mockImplementationOnce((tileGrid: TileGrid) => {
      tileGrid[0][0] = 2
      return tileGrid
    })
    const initialBestScore = 15
    const newScore = 16

    const { result } = renderHook(() => useSingleGame({ bestScore: initialBestScore, setBestScore: setBestScoreMock }))

    act(() => {
      result.current.performMove(mockMove)
    })

    expect(result.current.tileGridStateEncoded).toEqual(
      encodeTileGridState(
        [
          [2, 0, 2, 8],
          [0, 0, 0, 8],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        mockMove
      )
    )
    expect(result.current.score).toEqual(newScore)
    expect(setBestScoreMock).toHaveBeenCalledWith(newScore)
  })

  test("finishes the game when no next moves are possible + resets it corretly", () => {
    const resetSpy = jest.spyOn(Board.prototype, "reset")

    const mockTileGrid = [
      [0, 16, 4, 2],
      [8, 4, 2, 4],
      [32, 2, 4, 2],
      [64, 5, 2, 4],
    ]
    initializeBoardMock.mockReturnValueOnce(mockTileGrid)

    const { result } = renderHook(() => useSingleGame({ bestScore: 0, setBestScore: setBestScoreMock }))

    // FINISH GAME FLOW
    act(() => {
      result.current.performMove("UP")
    })
    expect(result.current.status).toEqual("finished")

    // // RESET GAME FLOW
    act(() => {
      result.current.resetGame()
    })
    expect(result.current.status).toEqual("active")
    expect(result.current.score).toBe(0)
    expect(resetSpy).toHaveBeenCalled()
  })
})
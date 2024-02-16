// TODO monorepo setup
// moved into React src directory as a walkaround for reacet complaining about importing from outside

import { Move } from "./types"

export const LOBBY_CHECK_INTERVAL_MS = 2000

export const GAME_TIME = 300000

export const MIN_PLAYERS_TO_START = 2

export const DEFAULT_BOARD_SIZE = 4

export const DRAW = "DRAW"

export const CLIENT_SIGNALS = {
  join: "join",
  disconnect: "disconnect",
  move: "move",
} as const

export const SERVER_SIGNALS = {
  startGame: "startGame",
  boardUpdate: "boardUpdate",
  endGame: "endGame",
} as const

export const MOVES: Record<Move, Move> = {
  UP: "UP",
  DOWN: "DOWN",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
} as const

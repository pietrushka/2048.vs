import socketio from "socket.io"
import Board from "../../../web/src/common/Board"
import { addTimeToCurrentTimestamp } from "../../../web/src/common/utils"
import { Move, GameData } from "../../../web/src/common/types"
import { GAME_TIME } from "../../../web/src/common/constants"

type handleGameEndPayload = { reason: "timeEnd" } | { reason: "playerBlocked"; playerId: string }

export default class MultiplayerGame {
  id: string
  state: GameData["state"]
  endGameTimestamp: GameData["endGameTimestamp"]
  boards: Board[]
  winner: GameData["winner"]
  socketIds: string[]
  private endGameTimoutId?: NodeJS.Timeout
  io: socketio.Server

  // TODO probably not the best idea to pass io server to this class
  constructor(io: socketio.Server, socketIds: string[]) {
    this.id = `game_${Date.now()}`
    this.state = "loading"
    this.socketIds = socketIds
    this.boards = [new Board(socketIds[0]), new Board(socketIds[1])]
    this.winner
    this.endGameTimestamp
    this.endGameTimoutId
    this.io = io
  }

  get data(): GameData {
    return {
      state: this.state,
      endGameTimestamp: this.endGameTimestamp,
      boards: this.boards.map((board) => board.data),
      winner: this.winner,
    }
  }

  startGame() {
    this.endGameTimestamp = addTimeToCurrentTimestamp(GAME_TIME)
    this.state = "active"

    if (this.endGameTimoutId) {
      console.error("cleared timeout", this.endGameTimoutId)
      clearTimeout(this.endGameTimoutId)
    }
    this.endGameTimoutId = setTimeout(() => {
      this.handleGameEnd({ reason: "timeEnd" })
    }, GAME_TIME)
  }

  handleMove(move: Move, playerId: string) {
    const board = this.boards?.find((board) => board.playerId === playerId)

    if (!board) {
      console.error("handleMove: no board", { board, playerId })
      return
    }

    board.handleMove(move)
    if (!board.nextMovePossible) {
      this.handleGameEnd({ reason: "playerBlocked", playerId })
    }
  }

  handleGameEnd(payload: handleGameEndPayload) {
    if (this.endGameTimoutId) {
      clearTimeout(this.endGameTimoutId)
    }

    this.state = "finished"
    this.winner = this.determineWinner(payload)
  }

  private determineWinner(payload: handleGameEndPayload): string {
    switch (payload.reason) {
      case "timeEnd":
        const blockedPlayer = this.findBlockedPlayer()
        if (blockedPlayer) {
          return blockedPlayer
        }
        return this.findScoreWinner()
      case "playerBlocked":
        return this.socketIds.find((x) => x !== payload.playerId)!
      default:
        // TODO handle this differentely
        console.error("determineWinner: reason not recognised")
        return "draw"
    }
  }
  private findBlockedPlayer() {
    if (!this.boards) {
      return
    }
    for (const board of this.boards) {
      if (!board.nextMovePossible) {
        return this.socketIds.find((x) => x !== board.playerId)!
      }
    }
  }

  private findScoreWinner() {
    if (!this.boards) {
      console.error("findScoreWinner: no boards")
      return "draw" // TODO probably not the best handling
    }

    if (this.boards[0].score > this.boards[1].score) {
      return this.boards[0].playerId
    }
    if (this.boards[0].score < this.boards[1].score) {
      return this.boards[1].playerId
    }

    return "draw"
  }
}
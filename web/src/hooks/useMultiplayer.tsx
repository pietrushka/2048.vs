import { useEffect, useState, useRef } from "react"
import io, { Socket } from "socket.io-client"
import { CLIENT_SIGNALS, SERVER_SIGNALS } from "../common/constants"
import { BoardData, GameState, StartGamePayload, BoardsStateUpdatePayload, Move } from "../common/types"
import clientEmitter from "../utils/clientEmitter"

const SERVER_URL = process.env.REACT_APP_SERVER_ENDPOINT || "http://localhost:4000"

type UseMultiplayerProps = {
  nickname: string
}

const getPlayersBoardState = (boards: BoardData[], playerSocketId: string) => {
  const playerBoardState = boards.find((board) => board.playerId === playerSocketId)
  const opponentBoardState = boards.find((board) => board.playerId !== playerSocketId)
  return { playerBoardState, opponentBoardState }
}

export default function useMultiplayer(props: UseMultiplayerProps) {
  const { nickname } = props

  const socketIo = useRef<Socket>()
  const [gameState, setGameState] = useState<GameState>()
  const [endGameTimestamp, setendGameTimestamp] = useState<string>()
  const [playerBoardState, setPlayerBoardState] = useState<BoardData>()
  const [opponentBoardState, setOpponentBoardState] = useState<BoardData>()

  // Connect to the socket server
  useEffect(() => {
    socketIo.current = io(SERVER_URL)

    clientEmitter(socketIo.current, {
      signal: CLIENT_SIGNALS.join,
      data: { nickname },
    })
    socketIo.current.on(SERVER_SIGNALS.startGame, handleGameStart)
    socketIo.current.on(SERVER_SIGNALS.boardUpdate, handleBoardStateUpdate)
    // socketIo.current.on(SERVER_SIGNALS.gameEnd)

    return () => {
      if (socketIo.current) {
        socketIo.current.disconnect()
      }
    }
  }, [nickname])

  const handleGameStart = (data: StartGamePayload) => {
    if (!socketIo.current?.id) {
      console.error("handleGameStart: no socketIo.current.id", socketIo.current)
      return
    }

    setGameState(data.state)
    setendGameTimestamp(data.endGameTimestamp)

    const boardStates = getPlayersBoardState(data.boards, socketIo.current.id)
    setPlayerBoardState(boardStates.playerBoardState)
    setOpponentBoardState(boardStates.opponentBoardState)
  }

  const handleBoardStateUpdate = (data: BoardsStateUpdatePayload) => {
    if (!socketIo.current?.id) {
      console.error("handleGameStart: no socketIo.current.id", socketIo.current)
      return
    }

    const boardStates = getPlayersBoardState(data.boards, socketIo.current?.id)
    setPlayerBoardState(boardStates.playerBoardState)
    setOpponentBoardState(boardStates.opponentBoardState)
  }

  // TODO useCallback
  const performMove = (move: Move) => {
    clientEmitter(socketIo.current, { signal: CLIENT_SIGNALS.move, data: { move } })
  }

  return {
    gameState,
    endGameTimestamp,
    playerBoardState,
    opponentBoardState,
    performMove,
  }
}
import { useEffect, useState, useRef } from "react"
import io, { Socket } from "socket.io-client"
import { CLIENT_SIGNALS, SERVER_SIGNALS, DRAW, BoardData, GameStatus, Move, GameData } from "shared-logic"
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

const generateResultText = (playerId?: string, winner?: string) => {
  if (!playerId || !winner) {
    return
  }

  if (winner === DRAW) {
    return "It is a draw"
  }

  return winner === playerId ? "You won" : "You lost"
}

type MultiplayerGameStatus = {
  status: GameStatus
  endGameTimestamp?: string
  playerBoardState?: BoardData
  opponentBoardState?: BoardData
  winner?: string
}

export default function useMultiplayer(props: UseMultiplayerProps) {
  const { nickname } = props
  const socketIo = useRef<Socket>()
  const [gameState, setGameStatus] = useState<MultiplayerGameStatus>()

  // Connect to the socket server
  useEffect(() => {
    socketIo.current = io(SERVER_URL)

    clientEmitter(socketIo.current, {
      signal: CLIENT_SIGNALS.join,
      data: { nickname },
    })
    socketIo.current.on(SERVER_SIGNALS.startGame, handleStateUpdate)
    socketIo.current.on(SERVER_SIGNALS.boardUpdate, handleStateUpdate)
    socketIo.current.on(SERVER_SIGNALS.endGame, handleStateUpdate)
    socketIo.current.on(SERVER_SIGNALS.joinLobby, handleJoinLobby)

    return () => {
      if (socketIo.current) {
        socketIo.current.disconnect()
      }
    }
  }, [nickname])

  const handleStateUpdate = (data: GameData) => {
    if (!socketIo.current?.id) {
      console.error("handleGameStart: no socketIo.current.id", socketIo.current)
      return
    }
    const { status, endGameTimestamp, boards, winner } = data

    const boardStates = getPlayersBoardState(boards, socketIo.current.id)

    setGameStatus({
      status,
      endGameTimestamp,
      winner,
      playerBoardState: boardStates.playerBoardState,
      opponentBoardState: boardStates.opponentBoardState,
    })
  }

  const handleJoinLobby = () => {
    setGameStatus(undefined)
  }

  // TODO useCallback
  const performMove = (move: Move) => {
    clientEmitter(socketIo.current, { signal: CLIENT_SIGNALS.move, data: { move } })
  }

  const playAgain = () => {
    clientEmitter(socketIo.current, { signal: CLIENT_SIGNALS.playAgain })
  }

  // TODO useMemo
  const resultText = generateResultText(socketIo.current?.id, gameState?.winner)

  return {
    status: gameState?.status,
    endGameTimestamp: gameState?.endGameTimestamp,
    playerBoardState: gameState?.playerBoardState,
    opponentBoardState: gameState?.opponentBoardState,
    resultText,
    performMove,
    playAgain,
  }
}
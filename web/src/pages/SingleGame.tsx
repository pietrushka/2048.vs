import styled from "@emotion/styled"
import Board from "../components/Board"
import GameResult from "../components/GameResult"
import SingleDashboard from "../components/SingleDashboard"
import useSingleGame from "../hooks/useSingleGame"
import { usePlayer } from "../hooks/usePlayer"
import { mediaQueries } from "../styles"

function SingleGame() {
  const { bestScore, setBestScore } = usePlayer()!
  const { status, score, tileGridStateEncoded, performMove, resetGame, isResetable } = useSingleGame({
    bestScore,
    setBestScore,
  })

  if (typeof tileGridStateEncoded === "undefined" || typeof score === "undefined") {
    return <span>loading</span>
  }
  return (
    <SingleGameContainer>
      <SingleDashboard score={score} bestScore={bestScore} playAgain={resetGame} isResetable={isResetable} />
      <Board tileGridStateEncoded={tileGridStateEncoded} performMove={performMove} />
      {status === "finished" && <GameResult result="Game End" playAgain={resetGame} />}
    </SingleGameContainer>
  )
}

export default SingleGame

const SingleGameContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  minHeight: "80vh",
  justifyContent: "space-evenly",
  width: "100%",

  [mediaQueries.tabletPortrait]: {
    width: "80%",
  },

  [mediaQueries.laptop]: {
    width: "70vh",
  },

  [mediaQueries.largeScreen]: {
    width: "60vh",
  },
})

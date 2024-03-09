import styled from "@emotion/styled"
import { Link } from "react-router-dom"
import { Menu, MenuOption } from "../pages/Home"

interface GameResultProps {
  result?: string
  playAgain: () => void
}

export default function GameResult({ result, playAgain }: GameResultProps) {
  return (
    <Overlay onClick={(e) => e.stopPropagation()}>
      <PopUp>
        <h1>{result}</h1>
        <Menu>
          <MenuOption color="green">
            <button onClick={playAgain}>Play again</button>
          </MenuOption>
          <MenuOption color="red">
            <Link to="/">Exit</Link>
          </MenuOption>
        </Menu>
      </PopUp>
    </Overlay>
  )
}

export const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`

export const PopUp = styled.div`
  position: relative;
  width: 70%;
  background: white;
  font-size: 1rem;
  border-radius: 1em;
  padding: 1em;
  max-width: 525px;

  h1 {
    font-size: 2em;
    margin: 0;
    text-align: center;
  }
  @media (min-width: 480px) {
    font-size: 1.5rem;
  }
`
import { useEffect } from 'react'
import { startGameLoop, stopGameLoop } from '@utils/gameLoop'
import './App.css'
import './index.css'
import styled from 'styled-components'
import Board from '@components/Board'
import useGameState from '@state/gameState'
import { keydownHandler } from './game/utils/keyHandler'

// Styled component
const Container = styled.div`
  text-align: center;
`

function App() {
  const { resetGame, gameStatus } = useGameState()

  const handleKeyDown = keydownHandler(resetGame, gameStatus)

  useEffect(() => {
    startGameLoop()
    return () => {
      stopGameLoop()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  useEffect(() => {
    const preventDefault = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', preventDefault)
    return () => {
      window.removeEventListener('keydown', preventDefault)
    }
  }, [])

  return (
    <Container>
      <Board />
    </Container>
  )
}

export default App

import React, { useEffect } from 'react'
import { startGameLoop, stopGameLoop, setSpeed } from '@utils/gameLoop'
import './App.css'
import styled from 'styled-components'
import PacMan from '@components/PacMan'
import Ghost from '@components/Ghost'
import Maze from '@components/Maze'
import Board from '@components/Board'
import useGameState, { setDirection } from '@state/gameState'

// Styled component
const Container = styled.div`
  text-align: center;
`

function App() {
  const { score, lives, level } = useGameState()

  useEffect(() => {
    startGameLoop()
    return () => {
      stopGameLoop()
    }
  }, [])

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        setDirection('UP')
        break
      case 'ArrowDown':
        setDirection('DOWN')
        break
      case 'ArrowLeft':
        setDirection('LEFT')
        break
      case 'ArrowRight':
        setDirection('RIGHT')
        break
      default:
        break
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

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

  const handleSpeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(Number(event.target.value))
  }

  return (
    <Container>
      <Board />
      <div>Score: {score}</div>
      <div>Lives: {lives}</div>
      <div>Level: {level}</div>
      <div>
        <label htmlFor="speed">Speed: </label>
        <input
          type="range"
          id="speed"
          name="speed"
          defaultValue="3"
          min="1"
          max="10"
          step="1"
          onChange={handleSpeedChange}
        />
      </div>
    </Container>
  )
}

export default App

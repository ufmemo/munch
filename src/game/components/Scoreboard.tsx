import React from 'react'
import styled from 'styled-components'
import useGameState from '@state/gameState'

const ScoreboardContainer = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  background-color: black;
  color: white;
  padding: 16px;
  border: 2px solid #0000ff;
  border-radius: 8px;
  font-family: 'Arial', sans-serif;
  min-width: 120px;
  z-index: 1000;
`

const ScoreItem = styled.div`
  margin: 8px 0;
  text-align: left;
  display: flex;
  justify-content: space-between;

  span:first-child {
    color: #ffff00;
  }

  span:last-child {
    color: white;
  }
`

const Scoreboard: React.FC = () => {
  const { score, lives, level } = useGameState()

  return (
    <ScoreboardContainer>
      <ScoreItem>
        <span>SCORE</span>
        <span>{score}</span>
      </ScoreItem>
      <ScoreItem>
        <span>LIVES</span>
        <span>{lives}</span>
      </ScoreItem>
      <ScoreItem>
        <span>LEVEL</span>
        <span>{level}</span>
      </ScoreItem>
    </ScoreboardContainer>
  )
}

export default Scoreboard

import React from 'react';
import styled, { keyframes } from 'styled-components';

import useGameState from '@state/gameState';
import { TILE_SIZE } from '@utils/constants';

const chomp = keyframes`
  0% {
    d: path('M8 8 L16 3 A 8 8 0 0 1 16 13 Z');
  }
  25% {
    d: path('M8 8 L16 5 A 8 8 0 0 1 16 11 Z');
  }
  50% {
    d: path('M8 8 L16 7.8 A 8 8 0 0 1 16 8.2 Z');
  }
  75% {
    d: path('M8 8 L16 5 A 8 8 0 0 1 16 11 Z');
  }
  100% {
    d: path('M8 8 L16 3 A 8 8 0 0 1 16 13 Z');
  }
`;

const PacManContainer = styled.div<{ $direction: string | null }>`
  width: ${TILE_SIZE}px;
  height: ${TILE_SIZE}px;
  position: absolute;
  transform-origin: center;
  transition: transform 0.05s linear;
  will-change: transform;

  svg {
    width: 100%;
    height: 100%;
    display: block; /* Ensure no extra space */
  }

  ${({ $direction }) => {
    switch ($direction) {
      case 'UP':
        return 'transform: rotate(-90deg);';
      case 'DOWN':
        return 'transform: rotate(90deg);';
      case 'LEFT':
        return 'transform: rotate(180deg);';
      case 'RIGHT':
        return 'transform: rotate(0deg);';
      default:
        return 'transform: rotate(0deg);';
    }
  }}
`;

const PacManMouth = styled.path`
  fill: black;
  animation: ${chomp} 0.25s linear infinite;
`;

const PacMan: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const { direction } = useGameState();
  const posX = x * TILE_SIZE;
  const posY = y * TILE_SIZE;
  
  return (
    <PacManContainer 
      $direction={direction}
      style={{ 
        left: `${posX}px`,
        top: `${posY}px`
      }} 
    >
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="8" fill="yellow" />
        <PacManMouth d="M8 8 L16 3 A 8 8 0 0 1 16 13 Z" />
      </svg>
    </PacManContainer>
  );
};

export default React.memo(PacMan);

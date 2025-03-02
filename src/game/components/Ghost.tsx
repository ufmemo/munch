import React, { useEffect, useState, CSSProperties } from 'react';
import styled, { keyframes } from 'styled-components';

import { TILE_SIZE } from '@utils/constants';

import useGameState, { Direction } from '../state/gameState';

// Define the Direction type here if it's not imported

export type GhostMode = 'CHASE' | 'SCATTER' | 'FRIGHTENED';

interface GhostProps {
  id: number;
}

const moveLeft = keyframes`
  0% { transform: translateX(0); }
  50% { transform: translateX(-3px); }
  100% { transform: translateX(0); }
`;

const moveRight = keyframes`
  0% { transform: translateX(0); }
  50% { transform: translateX(3px); }
  100% { transform: translateX(0); }
`;

// Create styled components for the animation variants
const LeftPupil = styled.circle`
  fill: black;
  animation: ${moveLeft} 1.5s infinite ease-in-out;
`;

const RightPupil = styled.circle`
  fill: black;
  animation: ${moveRight} 1.5s infinite ease-in-out;
`;

// Use an ordinary div with regular style props
const GhostContainer = styled.div`
  position: absolute;
  width: ${TILE_SIZE}px;
  height: ${TILE_SIZE}px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5;
  transition:
    left 0.05s linear,
    top 0.05s linear;
`;

const EyeWhite = styled.circle`
  fill: white;
`;

const getDirectionTransform = (direction: Direction): string => {
  switch (direction) {
    case 'UP':
      return 'translateY(-1px)';
    case 'DOWN':
      return 'translateY(1px)';
    case 'LEFT':
      return 'translateX(-1px)';
    case 'RIGHT':
      return 'translateX(1px)';
    default:
      return 'translate(0)';
  }
};

const Ghost: React.FC<GhostProps> = ({ id }) => {
  const [pupilAnimation, setPupilAnimation] = useState<'left' | 'right'>('left');
  // Get the ghost data from the game state
  const ghost = useGameState((state) => state.ghosts.find((g) => g.id === id));

  // Switch animation direction periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPupilAnimation((prev) => (prev === 'left' ? 'right' : 'left'));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // If ghost data doesn't exist, don't render anything
  if (!ghost) return null;

  const { x, y, color, direction } = ghost;

  // Create positioning styles for the container
  const containerStyle: CSSProperties = {
    left: `${x * TILE_SIZE}px`,
    top: `${y * TILE_SIZE}px`,
  };

  // Get transform style based on direction
  const directionTransform = getDirectionTransform(direction as Direction);

  // Choose the appropriate pupil component based on animation state
  const Pupil = pupilAnimation === 'left' ? LeftPupil : RightPupil;

  return (
    <GhostContainer style={containerStyle}>
      <svg width={TILE_SIZE} height={TILE_SIZE} viewBox="0 0 24 24">
        {/* Ghost body */}
        <path
          d="M4,6 
             C4,2.5 8,0 12,0 
             C16,0 20,2.5 20,6 
             L20,18 
             L18,16 L16,18 L14,16 L12,18 L10,16 L8,18 L6,16 L4,18 Z"
          fill={color}
        />

        {/* Left eye */}
        <EyeWhite cx="8" cy="8" r="3" />
        <Pupil cx="9" cy="8" r="1.5" style={{ transform: directionTransform }} />

        {/* Right eye */}
        <EyeWhite cx="16" cy="8" r="3" />
        <Pupil cx="17" cy="8" r="1.5" style={{ transform: directionTransform }} />
      </svg>
    </GhostContainer>
  );
};

// Add ghost data type
export interface GhostState {
  id: number;
  x: number;
  y: number;
  direction: Direction;
  color: string;
  speed: number;
  mode: GhostMode;
}

export default Ghost;

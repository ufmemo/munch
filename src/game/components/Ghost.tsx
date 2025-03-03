import React, { CSSProperties } from 'react';
import styled, { keyframes, css } from 'styled-components';

import useGameState from '@state/gameState';
import { TILE_SIZE } from '@utils/constants';
import { GAME_DIFFICULTY } from '@utils/gameControl';

import { GhostMode } from '../types';
import { Direction } from '../types/movement';

interface GhostProps {
  id: number;
}

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const shake = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-1px); }
  50% { transform: translateX(1px); }
  75% { transform: translateX(-1px); }
  100% { transform: translateX(0); }
`;

// Base styled components
const StyledPupil = styled.circle<{ $isAggressive: boolean; $aggressiveness: number }>`
  fill: black;
  transform: ${(props) => props.style?.transform || 'none'};
`;

const GhostContainer = styled.div<{ $mode: string; $aggressiveness?: number }>`
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

  ${({ $mode, $aggressiveness = 0 }) => {
    if ($mode === 'CHASE' && $aggressiveness > 0.5) {
      return css`
        animation: ${pulse} ${GAME_DIFFICULTY.timings.animationSpeeds.ghostFloat}s infinite
          ease-in-out;
      `;
    } else if ($mode === 'FRIGHTENED') {
      return css`
        animation: ${shake} ${GAME_DIFFICULTY.timings.animationSpeeds.ghostFloat / 3}s infinite
          ease-in-out;
        opacity: 0.9;
      `;
    }
    return '';
  }}
`;

// Helper functions
const getDirectionTransform = (direction: Direction): string => {
  switch (direction) {
    case Direction.UP:
      return 'translateY(-1px)';
    case Direction.DOWN:
      return 'translateY(1px)';
    case Direction.LEFT:
      return 'translateX(-1px)';
    case Direction.RIGHT:
      return 'translateX(1px)';
    default:
      return 'translate(0)';
  }
};

// Calculate aggressiveness factor (0-1) based on distance from Pacman
const calculateAggressiveness = (
  ghostX: number,
  ghostY: number,
  pacmanX: number,
  pacmanY: number,
): number => {
  const distance = Math.abs(ghostX - pacmanX) + Math.abs(ghostY - pacmanY);
  return Math.min(1, 6 / Math.max(1, distance));
};

const Ghost: React.FC<GhostProps> = ({ id }) => {
  const ghost = useGameState((state) => state.ghosts.find((g) => g.id === id));
  const pacmanPosition = useGameState((state) => state.pacManPosition);

  if (!ghost) return null;

  // Don't render if ghost is respawning
  if (ghost.respawnTimer !== undefined && ghost.respawnTimer !== null) {
    return null;
  }

  const { x, y, color, direction, mode } = ghost;
  // Calculate aggressiveness based on distance to Pacman
  const aggressiveness = calculateAggressiveness(x, y, pacmanPosition.x, pacmanPosition.y);
  const containerStyle: CSSProperties = {
    left: `${x * TILE_SIZE}px`,
    top: `${y * TILE_SIZE}px`,
  };

  // Get transform style based on direction
  const directionTransform = getDirectionTransform(direction as Direction);

  // Calculate ghost color based on mode
  let ghostColor = color;
  let eyeScale = 1.0;
  if (mode === GhostMode.FRIGHTENED) {
    // Blue color for frightened ghosts
    ghostColor = '#0000BB';
    eyeScale = 0.8; // Smaller eyes for scared look
  } else if (mode === GhostMode.CHASE && aggressiveness > 0.5) {
    // Make chase color more intense when close to Pacman
    if (color.startsWith('#')) {
      // For hex colors: make more saturated/darker
      const intensity = Math.min(1, 0.7 + aggressiveness * 0.3);
      ghostColor = color.replace(/[0-9a-f]{2}/gi, (hex, index) => {
        // Only affect red component to make it more aggressive
        if (index === 0) {
          const value = parseInt(hex, 16);
          const newValue = Math.floor(value * intensity);
          return Math.min(255, newValue).toString(16).padStart(2, '0');
        }
        return hex;
      });
    }
    eyeScale = 1 + aggressiveness * 0.3; // Larger eyes when aggressive
  }

  // Create dynamic styles
  const eyeWhiteStyle = {
    fill: 'white',
  };

  return (
    <GhostContainer $mode={mode} $aggressiveness={aggressiveness} style={containerStyle}>
      <svg width={TILE_SIZE} height={TILE_SIZE} viewBox="0 0 24 24">
        {/* Ghost body */}
        <path
          d="M4,6 
             C4,2.5 8,0 12,0 
             C16,0 20,2.5 20,6 
             L20,18 
             L18,16 L16,18 L14,16 L12,18 L10,16 L8,18 L6,16 L4,18 Z"
          fill={ghostColor}
        />
        {/* Eyes change based on mode */}
        {mode !== GhostMode.FRIGHTENED ? (
          <>
            {/* Normal eyes with dynamic size based on aggressiveness */}
            <circle cx="8" cy="8" r={3 * eyeScale} style={eyeWhiteStyle} />
            <StyledPupil
              cx="9"
              cy="8"
              r={1.5 * eyeScale}
              style={{ transform: directionTransform }}
              $isAggressive={aggressiveness > 0.5}
              $aggressiveness={aggressiveness}
            />
            <circle cx="16" cy="8" r={3 * eyeScale} style={eyeWhiteStyle} />
            <StyledPupil
              cx="17"
              cy="8"
              r={1.5 * eyeScale}
              style={{ transform: directionTransform }}
              $isAggressive={aggressiveness > 0.5}
              $aggressiveness={aggressiveness}
            />
          </>
        ) : (
          // Frightened mode eyes
          <>
            <path d="M6,8 L10,8 M14,8 L18,8" stroke="white" strokeWidth="2" strokeLinecap="round" />
            {/* Add mouth for frightened expression */}
            <path
              d="M8,12 Q12,10 16,12"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
      </svg>
    </GhostContainer>
  );
};

export default Ghost;

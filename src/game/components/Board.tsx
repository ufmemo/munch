import React from 'react';
import styled from 'styled-components';
import { TILE_SIZE, MAZE_WIDTH, MAZE_HEIGHT, MAZE_LAYOUT } from '../utils/constants';
import PacMan from './PacMan';
import useGameState from '../state/gameState';

const BoardContainer = styled.div`
  width: ${MAZE_WIDTH * TILE_SIZE}px;
  height: ${MAZE_HEIGHT * TILE_SIZE}px;
  background-color: black;
  position: relative;
  margin: auto;
`;

const GameContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: black;
`;

const Wall = styled.div`
  position: absolute;
  width: ${TILE_SIZE}px;
  height: ${TILE_SIZE}px;
  background-color: blue;
`;

const Dot = styled.div`
  position: absolute;
  width: 4px;
  height: 4px;
  background-color: yellow;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

const PowerPellet = styled(Dot)`
  width: 8px;
  height: 8px;
`;

const Board: React.FC = () => {
  const { pacManPosition } = useGameState();

  const renderMaze = () => {
    const elements = [];
    
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        const cellType = MAZE_LAYOUT[y][x];
        const position = { left: x * TILE_SIZE, top: y * TILE_SIZE };
        
        switch (cellType) {
          case 1: // Wall
            elements.push(<Wall key={`wall-${x}-${y}`} style={position} />);
            break;
          case 2: // Dot
            elements.push(
              <div key={`dot-${x}-${y}`} style={position}>
                <Dot />
              </div>
            );
            break;
          case 3: // Power Pellet
            elements.push(
              <div key={`power-${x}-${y}`} style={position}>
                <PowerPellet />
              </div>
            );
            break;
        }
      }
    }
    
    return elements;
  };

  return (
    <GameContainer>
      <BoardContainer>
        {renderMaze()}
        <PacMan x={pacManPosition.x} y={pacManPosition.y} />
      </BoardContainer>
    </GameContainer>
  );
};

export default React.memo(Board);
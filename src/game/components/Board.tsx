import React, { JSX, useEffect } from 'react';
import styled from 'styled-components';

import PacMan from '@components/PacMan';
import Scoreboard from '@components/Scoreboard';
import useGameState from '@state/gameState';
import { TILE_SIZE, MAZE_WIDTH, MAZE_HEIGHT } from '@utils/constants';

const BoardContainer = styled.div`
  width: ${MAZE_WIDTH * TILE_SIZE}px;
  height: ${MAZE_HEIGHT * TILE_SIZE}px;
  background-color: black;
  position: relative;
`;

const GameContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: black;
  position: relative;
  overflow: hidden;
`;

interface WallProps {
  $top: boolean;
  $right: boolean;
  $bottom: boolean;
  $left: boolean;
  $topLeft: boolean;
  $topRight: boolean;
  $bottomLeft: boolean;
  $bottomRight: boolean;
}

const Wall = styled.div<WallProps>`
  position: absolute;
  width: ${TILE_SIZE}px;
  height: ${TILE_SIZE}px;
  border-style: solid;
  border-width: ${(props) => (props.$top ? '2px' : '0')} ${(props) => (props.$right ? '2px' : '0')}
    ${(props) => (props.$bottom ? '2px' : '0')} ${(props) => (props.$left ? '2px' : '0')};
  border-color: #0000ff;
  box-sizing: border-box;
  border-top-left-radius: ${(props) => (props.$topLeft ? '25%' : '0')};
  border-top-right-radius: ${(props) => (props.$topRight ? '25%' : '0')};
  border-bottom-left-radius: ${(props) => (props.$bottomLeft ? '25%' : '0')};
  border-bottom-right-radius: ${(props) => (props.$bottomRight ? '25%' : '0')};
  filter: blur(1px);
`;

const Door = styled.div`
  position: absolute;
  width: ${TILE_SIZE}px;
  height: ${TILE_SIZE / 2}px;
  transform: translateY(${TILE_SIZE / 4}px);
  background-color: #444;
  box-sizing: border-box;
  border: 2px solid #444;
`;

const Dot = styled.div`
  position: absolute;
  width: 4px;
  height: 4px;
  background-color: yellow;
  border-radius: 50%;
  transform: translate(-50%, -50%);
`;

const PowerPellet = styled(Dot)`
  width: 8px;
  height: 8px;
`;

const DotContainer = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${TILE_SIZE}px;
  height: ${TILE_SIZE}px;
`;

const GameMessageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 100;
  font-family: 'Silkscreen', cursive;
  font-size: 48px;
  text-shadow: 2px 2px 4px #000;

  &.victory {
    color: #ffff00;
  }

  &.gameover {
    color: red;
  }

  button {
    margin-top: 20px;
    padding: 10px 20px;
    font-size: 24px;
    font-family: 'Silkscreen', cursive;
    background-color: #333;
    color: white;
    border: 2px solid #666;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: #444;
      border-color: #888;
    }
  }
`;

const Board = (): JSX.Element => {
  const { pacManPosition, maze, gameStatus, resetGame } = useGameState();
  const [scale, setScale] = React.useState(0.9);

  useEffect(() => {
    const updateScale = (): void => {
      const vw = Math.min(window.innerWidth, window.innerHeight * (MAZE_WIDTH / MAZE_HEIGHT));
      const vh = Math.min(window.innerHeight, window.innerWidth * (MAZE_HEIGHT / MAZE_WIDTH));
      const newScale = Math.min(vw / (MAZE_WIDTH * TILE_SIZE), vh / (MAZE_HEIGHT * TILE_SIZE));
      setScale(newScale * 0.9); // Add 10% padding
    };

    window.addEventListener('resize', updateScale);
    updateScale(); // Initial calculation
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const hasWallAt = (x: number, y: number): boolean => {
    if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT) return false;
    return maze[y][x] === 1;
  };

  const isCorner = (x: number, y: number, side1: boolean, side2: boolean): boolean =>
    side1 && side2 && !hasWallAt(x, y);

  const renderMaze = (): JSX.Element[] => {
    const elements = [];

    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        const cellType = maze[y][x];
        const position = { left: x * TILE_SIZE, top: y * TILE_SIZE };

        const top = !hasWallAt(x, y - 1);
        const right = !hasWallAt(x + 1, y);
        const bottom = !hasWallAt(x, y + 1);
        const left = !hasWallAt(x - 1, y);

        switch (cellType) {
          case 1: // Wall
            elements.push(
              <Wall
                key={`wall-${x}-${y}`}
                style={position}
                $top={top}
                $right={right}
                $bottom={bottom}
                $left={left}
                $topLeft={isCorner(x - 1, y - 1, left, top)}
                $topRight={isCorner(x + 1, y - 1, right, top)}
                $bottomLeft={isCorner(x - 1, y + 1, left, bottom)}
                $bottomRight={isCorner(x + 1, y + 1, right, bottom)}
              />,
            );
            break;
          case 2: // Dot
            elements.push(
              <DotContainer key={`dot-${x}-${y}`} style={position}>
                <Dot />
              </DotContainer>,
            );
            break;
          case 3: // Power Pellet
            elements.push(
              <DotContainer key={`power-${x}-${y}`} style={position}>
                <PowerPellet />
              </DotContainer>,
            );
            break;
          case 4: // Door
            elements.push(<Door key={`door-${x}-${y}`} style={position} />);
            break;
        }
      }
    }

    return elements;
  };

  return (
    <GameContainer>
      <BoardContainer style={{ transform: `scale(${scale})` }}>
        {renderMaze()}
        <PacMan x={pacManPosition.x} y={pacManPosition.y} />
        {(gameStatus === 'GAME_OVER' || gameStatus === 'VICTORY') && (
          <GameMessageOverlay className={gameStatus === 'VICTORY' ? 'victory' : 'gameover'}>
            <div>{gameStatus === 'VICTORY' ? 'YOU WIN!' : 'GAME OVER'}</div>
            <button onClick={resetGame}>Play Again</button>
          </GameMessageOverlay>
        )}
      </BoardContainer>
      <Scoreboard />
    </GameContainer>
  );
};

export default React.memo(Board);

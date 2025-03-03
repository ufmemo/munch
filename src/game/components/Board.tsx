import React, { JSX, useEffect } from 'react';
import styled from 'styled-components';

import Ghost from '@components/Ghost';
import PacMan from '@components/PacMan';
import Scoreboard from '@components/Scoreboard';
import { GameStatus } from '@game/types/gameStatus';
import useGameState from '@state/gameState';
import { TILE_SIZE, MAZE_WIDTH, MAZE_HEIGHT, COLORS, MazeCell } from '@utils/constants';

import { GAME_DIFFICULTY } from '../utils/gameControl';

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
  border-color: ${COLORS.maze.wall};
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
  background-color: ${COLORS.maze.door};
  box-sizing: border-box;
  border: 2px solid ${COLORS.maze.door};
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

  &.paused {
    color: white;
  }

  &.dying {
    color: orange;
    background-color: rgba(0, 0, 0, 0.3);
  }

  &.ready {
    color: yellow;
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

const CountdownOverlay = styled(GameMessageOverlay)`
  font-size: 72px;
  color: yellow;
  background-color: rgba(0, 0, 0, 0.5);
  animation: scaleIn 0.5s ease-out;

  @keyframes scaleIn {
    from {
      transform: scale(1.5);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const InstructionsText = styled.div`
  font-size: 20px;
  margin-top: 20px;
  margin-bottom: 10px;
  color: white;
  text-align: center;
  line-height: 1.5;
`;

const KeyInstruction = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
  font-size: 18px;
`;

const KeyBox = styled.span`
  display: inline-block;
  background-color: #444;
  border: 2px solid #666;
  border-radius: 4px;
  padding: 4px 8px;
  margin: 0 8px;
  color: white;
`;

const StartPrompt = styled.div`
  margin-top: 30px;
  font-size: 24px;
  color: #ffff00;
  animation: blink 1.5s infinite;

  @keyframes blink {
    0% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.3;
    }
  }
`;

const getOverlayMessage = (gameStatus: GameStatus, level: number): string => {
  switch (gameStatus) {
    case GameStatus.VICTORY:
      return level > GAME_DIFFICULTY.speedLevels.length ? 'YOU WIN!' : 'LEVEL COMPLETE!';
    case GameStatus.GAME_OVER:
      return level > GAME_DIFFICULTY.speedLevels.length ? 'CONGRATULATIONS!' : 'GAME OVER';
    case GameStatus.DYING:
      return 'OUCH!';
    case GameStatus.READY:
      return 'PAC-MAN';
    default:
      return 'PAUSED';
  }
};

const Board = (): JSX.Element => {
  const { pacManPosition, maze, gameStatus, level, resetGame, ghosts, countdownValue } =
    useGameState();
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
    return maze[y][x] === MazeCell.WALL;
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
          case MazeCell.WALL: // Wall
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
          case MazeCell.DOT: // Dot
            elements.push(
              <DotContainer key={`dot-${x}-${y}`} style={position}>
                <Dot />
              </DotContainer>,
            );
            break;
          case MazeCell.POWER_PELLET: // Power Pellet
            elements.push(
              <DotContainer key={`power-${x}-${y}`} style={position}>
                <PowerPellet />
              </DotContainer>,
            );
            break;
          case MazeCell.DOOR: // Door
            elements.push(<Door key={`door-${x}-${y}`} style={position} />);
            break;
        }
      }
    }

    return elements;
  };

  // Render ghosts from game state
  const renderGhosts = (): JSX.Element[] =>
    ghosts.map((ghost) => <Ghost key={`ghost-${ghost.id}`} id={ghost.id} />);

  // Get appropriate class for message overlay
  const getOverlayClass = (gameStatus: GameStatus): string => {
    switch (gameStatus) {
      case GameStatus.VICTORY:
        return 'victory';
      case GameStatus.GAME_OVER:
        return 'gameover';
      case GameStatus.DYING:
        return 'dying';
      case GameStatus.READY:
        return 'ready';
      default:
        return 'paused';
    }
  };

  // Get appropriate message for overlay
  const getOverlayMessage = (gameStatus: GameStatus, level: number): string => {
    switch (gameStatus) {
      case GameStatus.VICTORY:
        return level > GAME_DIFFICULTY.speedLevels.length ? 'YOU WIN!' : 'LEVEL COMPLETE!';
      case GameStatus.GAME_OVER:
        return level > GAME_DIFFICULTY.speedLevels.length ? 'CONGRATULATIONS!' : 'GAME OVER';
      case GameStatus.DYING:
        return 'OUCH!';
      case GameStatus.READY:
        return 'PAC-MAN';
      default:
        return 'PAUSED';
    }
  };

  // Render instructions menu
  const renderInstructions = (): JSX.Element => (
    <>
      <InstructionsText>HOW TO PLAY</InstructionsText>
      <KeyInstruction>
        <KeyBox>↑</KeyBox>
        <KeyBox>↓</KeyBox>
        <KeyBox>←</KeyBox>
        <KeyBox>→</KeyBox>
        Move Pac-Man
      </KeyInstruction>
      <KeyInstruction>
        <KeyBox>SPACE</KeyBox>
        Pause Game
      </KeyInstruction>
      <StartPrompt>PRESS ENTER TO START</StartPrompt>
    </>
  );

  return (
    <GameContainer>
      <BoardContainer style={{ transform: `scale(${scale})` }}>
        {renderMaze()}
        <PacMan x={pacManPosition.x} y={pacManPosition.y} />
        {renderGhosts()}
        {gameStatus !== GameStatus.PLAYING && !countdownValue && (
          <GameMessageOverlay className={getOverlayClass(gameStatus)}>
            <div>{getOverlayMessage(gameStatus, level)}</div>
            {gameStatus === GameStatus.READY && renderInstructions()}
            {(gameStatus === GameStatus.GAME_OVER ||
              (gameStatus === GameStatus.VICTORY &&
                level > GAME_DIFFICULTY.speedLevels.length)) && (
              <button onClick={resetGame}>Play Again</button>
            )}
          </GameMessageOverlay>
        )}
        {countdownValue && <CountdownOverlay>{countdownValue}</CountdownOverlay>}
      </BoardContainer>
      <Scoreboard />
    </GameContainer>
  );
};

export default React.memo(Board);

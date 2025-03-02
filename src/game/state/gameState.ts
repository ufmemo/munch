import { create } from 'zustand';

import { GhostState, Position, GhostMode } from '@game/types';
import { GameStatus } from '@game/types/gameStatus';
import { Direction } from '@game/types/movement';
import {
  GAME_CONFIG,
  MAZE_LAYOUT,
  MAZE_WIDTH,
  MAZE_HEIGHT,
  INITIAL_POSITIONS,
  MazeCell,
} from '@utils/constants';
import { wouldCollide } from '@utils/gameLoop';
import { tryMoveGhost, chooseNewGhostDirection } from '@utils/ghostMovement';

interface GameState {
  score: number;
  lives: number;
  level: number;
  gameStatus: GameStatus;
  pacManPosition: Position;
  direction: Direction | null;
  queuedDirection: Direction | null;
  maze: number[][];
  remainingDots: number;
  ghosts: GhostState[];
  update: () => void;
  resetGame: () => void;
  handleDeath: () => void;
  togglePause: () => void;
  updateGhosts: (deltaTime: number) => void;
}

// Count initial dots and pellets
function countInitialDots(): number {
  let count = 0;
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (MAZE_LAYOUT[y][x] === MazeCell.DOT || MAZE_LAYOUT[y][x] === MazeCell.POWER_PELLET) {
        count++;
      }
    }
  }
  return count;
}

const initialState = {
  score: 0,
  lives: GAME_CONFIG.initialLives,
  level: 1,
  gameStatus: GameStatus.PLAYING,
  pacManPosition: INITIAL_POSITIONS.pacman,
  direction: null,
  queuedDirection: null,
  maze: JSON.parse(JSON.stringify(MAZE_LAYOUT)),
  remainingDots: countInitialDots(),
  ghosts: [
    {
      id: 1,
      x: INITIAL_POSITIONS.ghost.x,
      y: INITIAL_POSITIONS.ghost.y,
      direction: Direction.LEFT,
      color: '#FF0000', // Red ghost (Blinky)
      speed: GAME_CONFIG.speedLevels[0].ghost,
      mode: GhostMode.CHASE,
    },
  ],
};

const useGameState = create<GameState>((set) => ({
  ...initialState,
  update: (): void => {
    set((state) => {
      if (state.gameStatus !== GameStatus.PLAYING) return state;

      const x = Math.round(state.pacManPosition.x);
      const y = Math.round(state.pacManPosition.y);

      let updates: Partial<GameState> = {};

      if (x >= 0 && x < MAZE_WIDTH && y >= 0 && y < MAZE_HEIGHT) {
        const cell = state.maze[y][x];
        if (cell === MazeCell.DOT || cell === MazeCell.POWER_PELLET) {
          const newMaze = [...state.maze];
          newMaze[y][x] = MazeCell.EMPTY;
          const points =
            cell === MazeCell.DOT ? GAME_CONFIG.baseScore.dot : GAME_CONFIG.baseScore.powerPellet;
          const newRemainingDots = state.remainingDots - 1;

          updates = {
            score: state.score + points,
            maze: newMaze,
            remainingDots: newRemainingDots,
          };

          if (newRemainingDots === 0) {
            updates.gameStatus = GameStatus.VICTORY;
            // Let the victory animation play out with current direction
            return updates;
          }
        }
      }

      const collisionWithGhost = state.ghosts.some((ghost) => {
        const dx = Math.abs(ghost.x - state.pacManPosition.x);
        const dy = Math.abs(ghost.y - state.pacManPosition.y);
        return dx < 0.8 && dy < 0.8;
      });

      if (collisionWithGhost) {
        updates.gameStatus = GameStatus.DYING;
        // Don't reset direction immediately, let the animation complete
        setTimeout(() => {
          useGameState.getState().handleDeath();
        }, 1000);
        return updates;
      }

      return updates;
    });
  },
  resetGame: (): void => {
    set({
      ...initialState,
      maze: JSON.parse(JSON.stringify(MAZE_LAYOUT)),
      remainingDots: countInitialDots(),
      ghosts: [...initialState.ghosts],
    });
  },
  handleDeath: (): void => {
    set((state) => {
      const newLives = state.lives - 1;
      if (newLives <= 0) {
        return {
          ...state,
          lives: 0,
          gameStatus: GameStatus.GAME_OVER,
          direction: null,
          queuedDirection: null,
        };
      }
      return {
        ...state,
        lives: newLives,
        pacManPosition: { ...INITIAL_POSITIONS.pacman },
        direction: null,
        queuedDirection: null,
        gameStatus: GameStatus.PLAYING,
        ghosts: state.ghosts.map((ghost) => ({
          ...ghost,
          x: INITIAL_POSITIONS.ghost.x,
          y: INITIAL_POSITIONS.ghost.y,
          direction: Direction.LEFT,
        })),
      };
    });
  },
  togglePause: () => {
    set((state) => ({
      gameStatus: state.gameStatus === GameStatus.PAUSED ? GameStatus.PLAYING : GameStatus.PAUSED,
    }));
  },
  updateGhosts: (deltaTime: number): void => {
    set((state) => {
      if (state.gameStatus !== GameStatus.PLAYING) return state;

      const updatedGhosts = state.ghosts.map((ghost) => {
        const newGhost = { ...ghost };
        const moveAmount = ghost.speed * deltaTime;
        const newPosition = tryMoveGhost(newGhost, moveAmount, state.maze);

        if (newPosition) {
          newGhost.x = newPosition.x;
          newGhost.y = newPosition.y;
        } else {
          newGhost.direction = chooseNewGhostDirection(newGhost, state.pacManPosition, state.maze);
        }

        return newGhost;
      });

      return { ghosts: updatedGhosts };
    });
  },
}));

export function getState(): GameState {
  return useGameState.getState();
}

export function setState(state: Partial<GameState>): void {
  useGameState.setState(state);
}

export function setDirection(newDirection: Direction): void {
  const state = getState();

  if (newDirection === state.direction || newDirection === null) {
    return;
  }

  const nearX = Math.abs(state.pacManPosition.x - Math.round(state.pacManPosition.x)) < 0.2;
  const nearY = Math.abs(state.pacManPosition.y - Math.round(state.pacManPosition.y)) < 0.2;

  if (nearX && nearY && !wouldCollide(state.pacManPosition, newDirection)) {
    setState({
      direction: newDirection,
      queuedDirection: null,
      pacManPosition: {
        x: Math.round(state.pacManPosition.x),
        y: Math.round(state.pacManPosition.y),
      },
    });
  } else {
    setState({ queuedDirection: newDirection });
  }
}

export default useGameState;

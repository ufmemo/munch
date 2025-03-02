import { create } from 'zustand';

import { MAZE_LAYOUT, MAZE_WIDTH, MAZE_HEIGHT } from '@utils/constants';

import { wouldCollide } from '../utils/gameLoop';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;
export type GameStatus = 'PLAYING' | 'GAME_OVER' | 'VICTORY';

interface GameState {
  score: number;
  lives: number;
  level: number;
  gameStatus: GameStatus;
  pacManPosition: { x: number; y: number };
  direction: Direction;
  queuedDirection: Direction;
  maze: number[][];
  remainingDots: number;
  update: () => void;
  resetGame: () => void;
  handleDeath: () => void;
}

// Count initial dots and pellets
function countInitialDots(): number {
  let count = 0;
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (MAZE_LAYOUT[y][x] === 2 || MAZE_LAYOUT[y][x] === 3) {
        count++;
      }
    }
  }
  return count;
}

const initialState = {
  score: 0,
  lives: 3,
  level: 1,
  gameStatus: 'PLAYING' as GameStatus,
  pacManPosition: { x: 14, y: 23 },
  direction: null as Direction,
  queuedDirection: null as Direction,
  maze: JSON.parse(JSON.stringify(MAZE_LAYOUT)),
  remainingDots: countInitialDots(),
};

const useGameState = create<GameState>((set) => ({
  ...initialState,
  update: (): void => {
    set((state) => {
      if (state.gameStatus !== 'PLAYING') return state;

      // Get current grid position
      const x = Math.round(state.pacManPosition.x);
      const y = Math.round(state.pacManPosition.y);

      let updates: Partial<GameState> = {};

      // Check if current position has a dot or power pellet
      if (x >= 0 && x < MAZE_WIDTH && y >= 0 && y < MAZE_HEIGHT) {
        const cell = state.maze[y][x];
        if (cell === 2 || cell === 3) {
          const newMaze = [...state.maze];
          newMaze[y][x] = 0; // Set to empty
          const points = cell === 2 ? 10 : 50; // 10 points for dots, 50 for power pellets
          const newRemainingDots = state.remainingDots - 1;

          updates = {
            score: state.score + points,
            maze: newMaze,
            remainingDots: newRemainingDots,
          };

          // Check for victory
          if (newRemainingDots === 0) {
            updates.gameStatus = 'VICTORY';
            updates.direction = null;
            updates.queuedDirection = null;
          }
        }
      }
      return updates;
    });
  },
  resetGame: (): void => {
    set({
      ...initialState,
      maze: JSON.parse(JSON.stringify(MAZE_LAYOUT)), // Create a fresh deep copy of the maze
      remainingDots: countInitialDots(),
    });
  },
  handleDeath: (): void => {
    set((state) => {
      const newLives = state.lives - 1;
      if (newLives <= 0) {
        return {
          ...state,
          lives: 0,
          gameStatus: 'GAME_OVER',
          direction: null,
          queuedDirection: null,
        };
      }
      return {
        ...state,
        lives: newLives,
        pacManPosition: { x: 14, y: 23 },
        direction: null,
        queuedDirection: null,
      };
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

  // Use a larger threshold for detecting near-grid positions
  const nearX = Math.abs(state.pacManPosition.x - Math.round(state.pacManPosition.x)) < 0.2;
  const nearY = Math.abs(state.pacManPosition.y - Math.round(state.pacManPosition.y)) < 0.2;

  // If we're near a grid position and can turn without collision, do it immediately
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
    // Otherwise queue the direction for later
    setState({ queuedDirection: newDirection });
  }
}

export default useGameState;

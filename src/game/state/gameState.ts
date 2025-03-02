import { create } from 'zustand';

import { MAZE_LAYOUT, MAZE_WIDTH, MAZE_HEIGHT } from '@utils/constants';

import { GhostState } from '../components/Ghost';
import { wouldCollide } from '../utils/gameLoop';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type GameStatus = 'PLAYING' | 'GAME_OVER' | 'VICTORY' | 'PAUSED' | 'DYING';

interface GameState {
  score: number;
  lives: number;
  level: number;
  gameStatus: GameStatus;
  pacManPosition: { x: number; y: number };
  direction: Direction | null;
  queuedDirection: Direction | null;
  maze: number[][];
  remainingDots: number;

  // Add ghosts to game state
  ghosts: GhostState[];

  update: () => void;
  resetGame: () => void;
  handleDeath: () => void;
  togglePause: () => void;

  // Add new function to update ghosts
  updateGhosts: (deltaTime: number) => void;
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
  direction: null,
  queuedDirection: null,
  maze: JSON.parse(JSON.stringify(MAZE_LAYOUT)),
  remainingDots: countInitialDots(),
  // Initialize with one ghost
  ghosts: [
    {
      id: 1,
      x: 14,
      y: 11, // Start position in the ghost house
      direction: 'LEFT' as Direction,
      color: '#FF0000', // Red ghost (Blinky)
      speed: 4.5, // Slightly slower than PacMan
      mode: 'CHASE' as 'CHASE' | 'SCATTER' | 'FRIGHTENED',
    },
  ],
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

      // Check for collision with ghosts
      const collisionWithGhost = state.ghosts.some((ghost) => {
        const dx = Math.abs(ghost.x - state.pacManPosition.x);
        const dy = Math.abs(ghost.y - state.pacManPosition.y);
        return dx < 0.8 && dy < 0.8; // Using a threshold for collision detection
      });

      if (collisionWithGhost) {
        // Change to DYING state instead of immediately calling handleDeath
        updates.gameStatus = 'DYING';
        updates.direction = null; // Stop movement
        updates.queuedDirection = null;

        // Set a timeout to call handleDeath after 1 second
        setTimeout(() => {
          useGameState.getState().handleDeath();
        }, 1000);
      }

      return updates;
    });
  },
  resetGame: (): void => {
    set({
      ...initialState,
      maze: JSON.parse(JSON.stringify(MAZE_LAYOUT)), // Create a fresh deep copy of the maze
      remainingDots: countInitialDots(),
      ghosts: [...initialState.ghosts], // Reset ghosts to initial positions
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
        gameStatus: 'PLAYING', // Resume gameplay
        // Reset ghost positions on death
        ghosts: state.ghosts.map((ghost) => ({
          ...ghost,
          x: 14,
          y: 11,
          direction: 'LEFT',
        })),
      };
    });
  },
  togglePause: () => {
    set((state) => ({
      gameStatus: state.gameStatus === 'PAUSED' ? 'PLAYING' : 'PAUSED',
    }));
  },
  // Add ghost update logic
  updateGhosts: (deltaTime: number): void => {
    set((state) => {
      if (state.gameStatus !== 'PLAYING') return state;

      const updatedGhosts = state.ghosts.map((ghost) => {
        const newGhost = { ...ghost };

        // Calculate movement amount based on ghost speed
        const moveAmount = ghost.speed * deltaTime;

        // Try to move in current direction
        const newPosition = tryMoveGhost(newGhost, moveAmount, state.maze);

        if (newPosition) {
          newGhost.x = newPosition.x;
          newGhost.y = newPosition.y;
        } else {
          // If we hit a wall, choose a new direction
          newGhost.direction = chooseNewDirection(newGhost, state.pacManPosition, state.maze);
        }

        return newGhost;
      });

      return { ghosts: updatedGhosts };
    });
  },
}));

// Helper function to try moving a ghost
function tryMoveGhost(
  ghost: GhostState,
  amount: number,
  maze: number[][],
): { x: number; y: number } | null {
  const newPos = { x: ghost.x, y: ghost.y };

  switch (ghost.direction) {
    case 'UP':
      newPos.y -= amount;
      break;
    case 'DOWN':
      newPos.y += amount;
      break;
    case 'LEFT':
      newPos.x -= amount;
      break;
    case 'RIGHT':
      newPos.x += amount;
      break;
    default:
      return null;
  }

  // Handle wrapping at edges
  if (newPos.x < 0) {
    newPos.x = MAZE_WIDTH - 1;
  } else if (newPos.x >= MAZE_WIDTH) {
    newPos.x = 0;
  }

  if (newPos.y < 0) {
    newPos.y = MAZE_HEIGHT - 1;
  } else if (newPos.y >= MAZE_HEIGHT) {
    newPos.y = 0;
  }

  // Check if new position would cause a collision with a wall
  if (ghostWouldCollide(newPos, ghost.direction, maze)) {
    return null;
  }

  return newPos;
}

// Helper function to check if a ghost would collide with a wall
function ghostWouldCollide(
  pos: { x: number; y: number },
  direction: Direction,
  maze: number[][],
): boolean {
  // For ghost movement, we only consider walls as collisions
  // Ghosts can pass through dots and power pellets

  // Check position in the direction of movement
  const checkPos = { ...pos };
  const threshold = 0.45; // Threshold for collision detection

  switch (direction) {
    case 'UP':
      checkPos.y -= threshold;
      break;
    case 'DOWN':
      checkPos.y += threshold;
      break;
    case 'LEFT':
      checkPos.x -= threshold;
      break;
    case 'RIGHT':
      checkPos.x += threshold;
      break;
  }

  // Convert to grid coordinates
  const gridX = Math.round(checkPos.x);
  const gridY = Math.round(checkPos.y);

  // Check if position is a wall
  if (gridX >= 0 && gridX < MAZE_WIDTH && gridY >= 0 && gridY < MAZE_HEIGHT) {
    const cell = maze[gridY][gridX];
    return cell === 1 || cell === 4; // Wall or door
  }

  return false;
}

// Helper function to choose a new direction for a ghost
function chooseNewDirection(
  ghost: GhostState,
  pacmanPos: { x: number; y: number },
  maze: number[][],
): Direction {
  // Available directions that don't lead to a wall
  const availableDirections: Direction[] = [];
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

  // Don't allow ghosts to reverse direction unless they have to
  const oppositeDir: Record<Direction, Direction> = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
  };

  // Check all directions
  for (const dir of directions) {
    if (dir !== oppositeDir[ghost.direction]) {
      const testPos = { x: ghost.x, y: ghost.y };
      switch (dir) {
        case 'UP':
          testPos.y -= 1;
          break;
        case 'DOWN':
          testPos.y += 1;
          break;
        case 'LEFT':
          testPos.x -= 1;
          break;
        case 'RIGHT':
          testPos.x += 1;
          break;
      }

      if (!ghostWouldCollide(testPos, dir, maze)) {
        availableDirections.push(dir);
      }
    }
  }

  // If no available directions, allow reversing
  if (availableDirections.length === 0) {
    return oppositeDir[ghost.direction] || 'LEFT';
  }

  // In CHASE mode, choose the direction that brings the ghost closer to Pacman
  if (ghost.mode === 'CHASE') {
    let [bestDir] = availableDirections;
    let bestDistance = Infinity;

    for (const dir of availableDirections) {
      const testPos = { x: ghost.x, y: ghost.y };
      switch (dir) {
        case 'UP':
          testPos.y -= 1;
          break;
        case 'DOWN':
          testPos.y += 1;
          break;
        case 'LEFT':
          testPos.x -= 1;
          break;
        case 'RIGHT':
          testPos.x += 1;
          break;
      }

      // Calculate Manhattan distance to Pacman
      const distance = Math.abs(testPos.x - pacmanPos.x) + Math.abs(testPos.y - pacmanPos.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestDir = dir;
      }
    }

    return bestDir;
  }

  // For other modes, choose a random direction
  return availableDirections[Math.floor(Math.random() * availableDirections.length)];
}

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

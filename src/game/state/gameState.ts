import { create } from 'zustand';

import { GhostState, Position, GhostMode } from '@game/types';
import { GameStatus } from '@game/types/gameStatus';
import { Direction } from '@game/types/movement';
import {
  MAZE_LAYOUT,
  MAZE_WIDTH,
  MAZE_HEIGHT,
  INITIAL_POSITIONS,
  MazeCell,
  COLORS,
} from '@utils/constants';
import { GAME_DIFFICULTY } from '@utils/gameControl';
import { wouldCollide } from '@utils/gameLoop';
import { tryMoveGhost, chooseNewGhostDirection } from '@utils/ghostMovement';

interface GameState {
  score: number;
  lives: number;
  level: number;
  gameStatus: GameStatus;
  pacmanPosition: Position;
  direction: Direction | null;
  queuedDirection: Direction | null;
  maze: number[][];
  remainingDots: number;
  ghosts: GhostState[];
  frightenedTimer: number | null;
  countdownValue: number | null;
  update: () => void;
  resetGame: () => void;
  handleDeath: () => void;
  togglePause: () => void;
  updateGhosts: (deltaTime: number) => void;
  startGame: () => void;
  startLevel: (level: number) => void;
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
  lives: GAME_DIFFICULTY.initialLives,
  level: 1,
  gameStatus: GameStatus.READY,
  pacmanPosition: INITIAL_POSITIONS.pacman,
  direction: null,
  queuedDirection: null,
  maze: JSON.parse(JSON.stringify(MAZE_LAYOUT)),
  remainingDots: countInitialDots(),
  countdownValue: null,
  ghosts: [
    {
      id: 1,
      x: INITIAL_POSITIONS.ghosts[0].x,
      y: INITIAL_POSITIONS.ghosts[0].y,
      direction: Direction.UP,
      color: COLORS.ghosts.blinky, // Red ghost (Blinky)
      speed: GAME_DIFFICULTY.speedLevels[0].ghost,
      mode: GhostMode.CHASE,
    },
    {
      id: 2,
      x: INITIAL_POSITIONS.ghosts[1].x,
      y: INITIAL_POSITIONS.ghosts[1].y,
      direction: Direction.UP,
      color: COLORS.ghosts.pinky, // Pink ghost (Pinky)
      speed: GAME_DIFFICULTY.speedLevels[0].ghost,
      mode: GhostMode.CHASE,
    },
    {
      id: 3,
      x: INITIAL_POSITIONS.ghosts[2].x,
      y: INITIAL_POSITIONS.ghosts[2].y,
      direction: Direction.UP,
      color: COLORS.ghosts.inky, // Cyan ghost (Inky)
      speed: GAME_DIFFICULTY.speedLevels[0].ghost,
      mode: GhostMode.CHASE,
    },
    {
      id: 4,
      x: INITIAL_POSITIONS.ghosts[3].x,
      y: INITIAL_POSITIONS.ghosts[3].y,
      direction: Direction.UP,
      color: COLORS.ghosts.clyde, // Orange ghost (Clyde)
      speed: GAME_DIFFICULTY.speedLevels[0].ghost,
      mode: GhostMode.CHASE,
    },
  ],
  frightenedTimer: null,
};

const useGameState = create<GameState>((set) => ({
  ...initialState,
  startLevel: (level: number): void => {
    const speedLevel = Math.min(level - 1, GAME_DIFFICULTY.speedLevels.length - 1);
    set({
      maze: JSON.parse(JSON.stringify(MAZE_LAYOUT)),
      remainingDots: countInitialDots(),
      pacmanPosition: { ...INITIAL_POSITIONS.pacman },
      direction: null,
      queuedDirection: null,
      ghosts: initialState.ghosts.map((ghost) => ({
        ...ghost,
        speed: GAME_DIFFICULTY.speedLevels[speedLevel].ghost,
        x: INITIAL_POSITIONS.ghosts[ghost.id - 1].x,
        y: INITIAL_POSITIONS.ghosts[ghost.id - 1].y,
        direction: Direction.UP,
      })),
      countdownValue: 3,
    });

    // Start countdown for new level
    const countdownInterval = setInterval(() => {
      set((s) => {
        const newValue = (s.countdownValue ?? 0) - 1;
        if (newValue <= 0) {
          clearInterval(countdownInterval);
          return {
            countdownValue: null,
            gameStatus: GameStatus.PLAYING,
          };
        }
        return { countdownValue: newValue };
      });
    }, 1000);
  },
  update: (): void => {
    set((state) => {
      if (state.gameStatus !== GameStatus.PLAYING) return state;

      const x = Math.round(state.pacmanPosition.x);
      const y = Math.round(state.pacmanPosition.y);

      let updates: Partial<GameState> = {};

      if (x >= 0 && x < MAZE_WIDTH && y >= 0 && y < MAZE_HEIGHT) {
        const cell = state.maze[y][x];
        if (cell === MazeCell.DOT || cell === MazeCell.POWER_PELLET) {
          const newMaze = [...state.maze];
          newMaze[y][x] = MazeCell.EMPTY;
          const points =
            cell === MazeCell.DOT
              ? GAME_DIFFICULTY.baseScores.dot
              : GAME_DIFFICULTY.baseScores.powerPellet;
          const newRemainingDots = state.remainingDots - 1;

          updates = {
            score: state.score + points,
            maze: newMaze,
            remainingDots: newRemainingDots,
          };

          // Handle power pellet collection
          if (cell === MazeCell.POWER_PELLET) {
            updates.ghosts = state.ghosts.map((ghost) => ({
              ...ghost,
              mode: GhostMode.FRIGHTENED,
            }));
            updates.frightenedTimer = GAME_DIFFICULTY.timings.frightenedDuration;
          }

          // If no dots remain, check if there are more levels
          if (newRemainingDots === 0) {
            const nextLevel = state.level + 1;
            if (nextLevel <= GAME_DIFFICULTY.speedLevels.length) {
              // Start next level
              updates.level = nextLevel;
              setTimeout(() => {
                useGameState.getState().startLevel(nextLevel);
              }, 2000); // Give player 2 seconds to see "LEVEL COMPLETE"
              return {
                ...updates,
                gameStatus: GameStatus.VICTORY,
                direction: null,
                queuedDirection: null,
              };
            } else {
              // Player has completed all levels
              return {
                ...updates,
                gameStatus: GameStatus.GAME_OVER,
                direction: null,
                queuedDirection: null,
              };
            }
          }
        }
      }

      const collisionWithGhost = state.ghosts.some((ghost) => {
        if (ghost.respawnTimer !== undefined && ghost.respawnTimer !== null) {
          return false; // Ghost is respawning, no collision possible
        }

        const dx = Math.abs(ghost.x - state.pacmanPosition.x);
        const dy = Math.abs(ghost.y - state.pacmanPosition.y);
        const collision = dx < 0.8 && dy < 0.8;

        if (collision && ghost.mode === GhostMode.FRIGHTENED) {
          // Ghost is eaten - Add 500 points
          updates.score = (updates.score || state.score) + GAME_DIFFICULTY.baseScores.ghost;
          updates.ghosts = state.ghosts.map((g) => {
            if (g.id === ghost.id) {
              return {
                ...g,
                respawnTimer: GAME_DIFFICULTY.timings.respawnDuration,
                mode: GhostMode.CHASE, // Reset mode for when it respawns
              };
            }
            return g;
          });
          return false;
        }
        return collision && ghost.mode !== GhostMode.FRIGHTENED;
      });

      if (collisionWithGhost) {
        updates.gameStatus = GameStatus.DYING;
        setTimeout(() => {
          useGameState.getState().handleDeath();
        }, GAME_DIFFICULTY.timings.animationSpeeds.deathSequence * 1000);
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
        pacmanPosition: { ...INITIAL_POSITIONS.pacman },
        direction: null,
        queuedDirection: null,
        gameStatus: GameStatus.PLAYING,
        ghosts: state.ghosts.map((ghost, index) => ({
          ...ghost,
          x: INITIAL_POSITIONS.ghosts[index].x,
          y: INITIAL_POSITIONS.ghosts[index].y,
          direction: Direction.UP, // Always set direction to UP
        })),
      };
    });
  },
  togglePause: () => {
    set((state) => ({
      gameStatus: state.gameStatus === GameStatus.PAUSED ? GameStatus.PLAYING : GameStatus.PAUSED,
    }));
  },
  startGame: () => {
    set((state) => {
      if (state.gameStatus === GameStatus.READY) {
        // Start countdown from 3
        set({ countdownValue: 3 });

        // Create countdown sequence
        const countdownInterval = setInterval(() => {
          set((s) => {
            const newValue = (s.countdownValue ?? 0) - 1;
            if (newValue <= 0) {
              clearInterval(countdownInterval);
              return {
                countdownValue: null,
                gameStatus: GameStatus.PLAYING,
              };
            }
            return { countdownValue: newValue };
          });
        }, 1000);

        return { gameStatus: GameStatus.READY };
      }
      return state;
    });
  },
  updateGhosts: (deltaTime: number): void => {
    set((state) => {
      if (state.gameStatus !== GameStatus.PLAYING) return state;

      // Update frightened timer
      let { frightenedTimer } = state;
      if (frightenedTimer !== null) {
        frightenedTimer -= deltaTime * 1000; // Convert to milliseconds
        if (frightenedTimer <= 0) {
          frightenedTimer = null;
          // Reset ghost modes when frightened timer expires
          return {
            frightenedTimer,
            ghosts: state.ghosts.map((ghost) => ({
              ...ghost,
              mode: GhostMode.CHASE,
            })),
          };
        }
      }

      const updatedGhosts = state.ghosts.map((ghost) => {
        const newGhost = { ...ghost };

        // Handle respawn timer if it exists
        if (ghost.respawnTimer !== undefined && ghost.respawnTimer !== null) {
          newGhost.respawnTimer = ghost.respawnTimer - deltaTime * 1000;
          if (newGhost.respawnTimer <= 0) {
            // Respawn the ghost in the ghost house
            const ghostTypeIndex = ghost.id - 1;
            newGhost.respawnTimer = null;
            newGhost.x = INITIAL_POSITIONS.ghosts[ghostTypeIndex].x;
            newGhost.y = INITIAL_POSITIONS.ghosts[ghostTypeIndex].y;
            newGhost.direction = Direction.UP; // Always set direction to UP when respawning
            return newGhost;
          }
          return newGhost; // Ghost is still respawning
        }

        // Calculate distance to Pacman
        const distanceToPacman =
          Math.abs(ghost.x - state.pacmanPosition.x) + Math.abs(ghost.y - state.pacmanPosition.y);

        // Adjust speed based on mode and distance
        let speedMultiplier = 1.0;

        if (ghost.mode === GhostMode.FRIGHTENED) {
          // Frightened ghosts are slower, but get faster when further away from Pacman
          // This prevents them from getting stuck far away from the action
          const baseFrightenedMultiplier = 0.5; // Base frightened speed
          const distanceBoost = Math.min(0.3, distanceToPacman / 30); // Max 0.3 boost for distance
          speedMultiplier = baseFrightenedMultiplier + distanceBoost;
        } else if (ghost.mode === GhostMode.CHASE) {
          // Chase mode: ghosts get faster when closer to Pacman
          // Close distance = up to 30% speed boost
          const proximityBoost = Math.min(0.3, 6 / Math.max(1, distanceToPacman));
          speedMultiplier = 1.0 + proximityBoost;
        }

        // Calculate final move amount
        const moveAmount = ghost.speed * speedMultiplier * deltaTime;

        const newPosition = tryMoveGhost(newGhost, moveAmount, state.maze);

        if (newPosition) {
          newGhost.x = newPosition.x;
          newGhost.y = newPosition.y;
        } else {
          newGhost.direction = chooseNewGhostDirection(newGhost, state.pacmanPosition, state.maze);
        }

        return newGhost;
      });

      return {
        ghosts: updatedGhosts,
        frightenedTimer,
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

  // Don't set direction if the game is not in PLAYING state
  if (state.gameStatus !== GameStatus.PLAYING) {
    return;
  }

  if (newDirection === state.direction || newDirection === null) {
    return;
  }

  const nearX = Math.abs(state.pacmanPosition.x - Math.round(state.pacmanPosition.x)) < 0.2;
  const nearY = Math.abs(state.pacmanPosition.y - Math.round(state.pacmanPosition.y)) < 0.2;

  if (nearX && nearY && !wouldCollide(state.pacmanPosition, newDirection)) {
    setState({
      direction: newDirection,
      queuedDirection: null,
      pacmanPosition: {
        x: Math.round(state.pacmanPosition.x),
        y: Math.round(state.pacmanPosition.y),
      },
    });
  } else {
    setState({ queuedDirection: newDirection });
  }
}

export default useGameState;

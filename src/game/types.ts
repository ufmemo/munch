import { GhostMode } from './types/gameStatus';
import { Direction } from './types/movement';

export interface GhostState {
  id: number;
  x: number;
  y: number;
  direction: Direction;
  color: string;
  speed: number;
  mode: GhostMode;
  respawnTimer?: number | null; // Timer for ghost respawn/materliaze/rejuvenate)
}

export interface GameConfig {
  initialLives: number;
  baseScore: {
    dot: number;
    powerPellet: number;
    ghost: number;
  };
  speedLevels: {
    pacman: number;
    ghost: number;
  }[];
}

// Re-export types from their new locations
export * from './types/movement';
export * from './types/position';
export * from './types/gameStatus';

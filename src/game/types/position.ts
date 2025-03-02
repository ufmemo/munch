export interface Position {
  x: number;
  y: number;
}

export interface GridPosition {
  x: number;
  y: number;
}

// A type for any entity that has a position and direction
export interface MovableEntity {
  x: number;
  y: number;
  direction: Direction;
}

// Import from the main types file for now, we'll move it later
import { Direction } from '../types';

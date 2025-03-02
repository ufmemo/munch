export const TILE_SIZE = 24;

// 0: empty, 1: wall, 2: dot, 3: power pellet, 4: door
export enum MazeCell {
  EMPTY = 0,
  WALL = 1,
  DOT = 2,
  POWER_PELLET = 3,
  DOOR = 4,
}

//prettier-ignore
export const MAZE_LAYOUT = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 3, 1],
  // ...rest of the maze layout...
] as const;

export const MAZE_WIDTH = MAZE_LAYOUT[0].length;
export const MAZE_HEIGHT = MAZE_LAYOUT.length;

// Starting positions
export const INITIAL_POSITIONS = {
  pacman: { x: 14, y: 23 },
  ghost: { x: 14, y: 11 },
} as const;

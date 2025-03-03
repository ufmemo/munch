export const GameStatus = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
  PAUSED: 'PAUSED',
  DYING: 'DYING',
} as const;

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const GhostMode = {
  CHASE: 'CHASE',
  SCATTER: 'SCATTER',
  FRIGHTENED: 'FRIGHTENED',
} as const;

export type GhostMode = (typeof GhostMode)[keyof typeof GhostMode];

export const GhostId = {
  BLINKY: 'BLINKY',
  PINKY: 'PINKY',
  INKY: 'INKY',
  CLYDE: 'CLYDE',
} as const;

export type GhostId = (typeof GhostId)[keyof typeof GhostId];

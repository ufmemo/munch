export const GameStatus = {
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

import { getState, setDirection } from '@state/gameState';

import { GameStatus } from '../types/gameStatus';
import { Direction } from '../types/movement';

export const keydownHandler =
  (resetGame: () => void, gameStatus: GameStatus) =>
  (event: KeyboardEvent): void => {
    const state = getState();

    if (gameStatus === GameStatus.GAME_OVER || gameStatus === GameStatus.VICTORY) {
      if (event.key === 'Enter' || event.key === ' ') {
        resetGame();
        return;
      }
    }

    // Only allow pause toggle when in PLAYING or PAUSED state
    if (
      event.key === ' ' &&
      (gameStatus === GameStatus.PLAYING || gameStatus === GameStatus.PAUSED)
    ) {
      state.togglePause();
      return;
    }

    // Don't process movement keys if game is not in PLAYING state
    if (gameStatus !== GameStatus.PLAYING) {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        setDirection(Direction.UP);
        break;
      case 'ArrowDown':
        setDirection(Direction.DOWN);
        break;
      case 'ArrowLeft':
        setDirection(Direction.LEFT);
        break;
      case 'ArrowRight':
        setDirection(Direction.RIGHT);
        break;
      default:
        break;
    }
  };

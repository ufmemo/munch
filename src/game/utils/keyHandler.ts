import { GameStatus, setDirection } from '@state/gameState';
import { getState } from '@state/gameState';

export const keydownHandler =
  (resetGame: () => void, gameStatus: GameStatus) => (event: KeyboardEvent) => {
    const state = getState();

    if (gameStatus === 'GAME_OVER' || gameStatus === 'VICTORY') {
      if (event.key === 'Enter' || event.key === ' ') {
        resetGame();
        return;
      }
    }

    // Only allow pause toggle when in PLAYING or PAUSED state
    if (event.key === ' ' && (gameStatus === 'PLAYING' || gameStatus === 'PAUSED')) {
      state.togglePause();
      return;
    }

    // Don't process movement keys if game is not in PLAYING state
    if (gameStatus !== 'PLAYING') {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        setDirection('UP');
        break;
      case 'ArrowDown':
        setDirection('DOWN');
        break;
      case 'ArrowLeft':
        setDirection('LEFT');
        break;
      case 'ArrowRight':
        setDirection('RIGHT');
        break;
      default:
        break;
    }
  };

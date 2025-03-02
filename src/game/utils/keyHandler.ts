import { GameStatus, setDirection } from '@state/gameState'

export const keydownHandler =
  (resetGame: () => void, gameStatus: GameStatus) => (event: KeyboardEvent) => {
    if (gameStatus === 'GAME_OVER') {
      if (event.key === 'Enter' || event.key === ' ') {
        resetGame()
        return
      }
    }

    switch (event.key) {
      case 'ArrowUp':
        setDirection('UP')
        break
      case 'ArrowDown':
        setDirection('DOWN')
        break
      case 'ArrowLeft':
        setDirection('LEFT')
        break
      case 'ArrowRight':
        setDirection('RIGHT')
        break
      default:
        break
    }
  }

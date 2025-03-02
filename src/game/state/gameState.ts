import { create } from 'zustand'
import { wouldCollide } from '../utils/gameLoop'
import { MAZE_LAYOUT, MAZE_WIDTH, MAZE_HEIGHT } from '@utils/constants'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null

interface GameState {
  score: number
  lives: number
  level: number
  pacManPosition: { x: number; y: number }
  direction: Direction
  queuedDirection: Direction
  maze: number[][]
  update: () => void
}

const useGameState = create<GameState>((set) => ({
  score: 0,
  lives: 3,
  level: 1,
  pacManPosition: { x: 14, y: 23 }, // Centered horizontally at column 14
  direction: null,
  queuedDirection: null,
  maze: JSON.parse(JSON.stringify(MAZE_LAYOUT)), // Deep copy of initial maze
  update: () => {
    set((state) => {
      // Get current grid position
      const x = Math.round(state.pacManPosition.x)
      const y = Math.round(state.pacManPosition.y)

      // Check if current position has a dot or power pellet
      if (x >= 0 && x < MAZE_WIDTH && y >= 0 && y < MAZE_HEIGHT) {
        const cell = state.maze[y][x]
        if (cell === 2) {
          // Regular dot
          const newMaze = [...state.maze]
          newMaze[y][x] = 0 // Set to empty
          return {
            score: state.score + 10,
            maze: newMaze,
          }
        } else if (cell === 3) {
          // Power pellet
          const newMaze = [...state.maze]
          newMaze[y][x] = 0 // Set to empty
          return {
            score: state.score + 50,
            maze: newMaze,
          }
        }
      }
      return state
    })
  },
}))

export function getState() {
  return useGameState.getState()
}

export function setState(state: Partial<GameState>) {
  useGameState.setState(state)
}

export function setDirection(newDirection: Direction) {
  const state = getState()

  if (newDirection === state.direction || newDirection === null) {
    return
  }

  // Use a larger threshold for detecting near-grid positions
  const nearX =
    Math.abs(state.pacManPosition.x - Math.round(state.pacManPosition.x)) < 0.2
  const nearY =
    Math.abs(state.pacManPosition.y - Math.round(state.pacManPosition.y)) < 0.2

  // If we're near a grid position and can turn without collision, do it immediately
  if (
    nearX &&
    nearY &&
    !wouldCollide(state.pacManPosition, newDirection as string)
  ) {
    setState({
      direction: newDirection,
      queuedDirection: null,
      pacManPosition: {
        x: Math.round(state.pacManPosition.x),
        y: Math.round(state.pacManPosition.y),
      },
    })
  } else {
    // Otherwise queue the direction for later
    setState({ queuedDirection: newDirection })
  }
}

export default useGameState

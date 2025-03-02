import { create } from 'zustand';
import { wouldCollide } from '../utils/gameLoop';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;

interface GameState {
  score: number;
  lives: number;
  level: number;
  pacManPosition: { x: number; y: number };
  direction: Direction;
  queuedDirection: Direction;
  update: () => void;
}

const useGameState = create<GameState>((set) => ({
  score: 0,
  lives: 3,
  level: 1,
  pacManPosition: { x: 14, y: 23 }, // Centered horizontally at column 14
  direction: null,
  queuedDirection: null,
  update: () => {
    set((state) => {
      // Update state if needed
      return state;
    });
  },
}));

export function getState() {
  return useGameState.getState();
}

export function setState(state: Partial<GameState>) {
  useGameState.setState(state);
}

export function setDirection(newDirection: Direction) {
  const state = getState();
  
  if (newDirection === state.direction || newDirection === null) {
    return;
  }
  
  // Use a larger threshold for detecting near-grid positions
  const nearX = Math.abs(state.pacManPosition.x - Math.round(state.pacManPosition.x)) < 0.2;
  const nearY = Math.abs(state.pacManPosition.y - Math.round(state.pacManPosition.y)) < 0.2;
  
  // If we're near a grid position and can turn without collision, do it immediately
  if ((nearX && nearY) && !wouldCollide(state.pacManPosition, newDirection as string)) {
    setState({ 
      direction: newDirection,
      queuedDirection: null,
      pacManPosition: {
        x: Math.round(state.pacManPosition.x),
        y: Math.round(state.pacManPosition.y)
      }
    });
  } else {
    // Otherwise queue the direction for later
    setState({ queuedDirection: newDirection });
  }
}

export default useGameState;

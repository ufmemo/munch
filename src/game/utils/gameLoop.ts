import { getState, setState } from '@state/gameState';
import { MAZE_WIDTH, MAZE_HEIGHT } from '@utils/constants';

let lastTime = 0;
let speed = 6; // Default speed in tiles per second

// Check if a position would result in a collision in the specified direction
function checkCollision(x: number, y: number, direction: string | null = null): boolean {
  const state = getState();

  // Get the grid positions for corners based on direction
  let positions: { x: number; y: number }[] = [];

  if (direction) {
    // Only check corners in the direction of movement
    switch (direction) {
      case 'UP':
        // Check top corners only
        positions = [
          { x: Math.floor(x), y: Math.floor(y) }, // Top-left
          { x: Math.ceil(x), y: Math.floor(y) }, // Top-right
        ];
        break;
      case 'DOWN':
        // Check bottom corners only
        positions = [
          { x: Math.floor(x), y: Math.ceil(y) }, // Bottom-left
          { x: Math.ceil(x), y: Math.ceil(y) }, // Bottom-right
        ];
        break;
      case 'LEFT':
        // Check left corners only
        positions = [
          { x: Math.floor(x), y: Math.floor(y) }, // Top-left
          { x: Math.floor(x), y: Math.ceil(y) }, // Bottom-left
        ];
        break;
      case 'RIGHT':
        // Check right corners only
        positions = [
          { x: Math.ceil(x), y: Math.floor(y) }, // Top-right
          { x: Math.ceil(x), y: Math.ceil(y) }, // Bottom-right
        ];
        break;
      default:
        // No direction specified, fallback to checking all corners
        positions = [
          { x: Math.floor(x), y: Math.floor(y) }, // Top-left
          { x: Math.ceil(x), y: Math.floor(y) }, // Top-right
          { x: Math.floor(x), y: Math.ceil(y) }, // Bottom-left
          { x: Math.ceil(x), y: Math.ceil(y) }, // Bottom-right
        ];
    }
  } else {
    // If no direction specified, check all corners (for backward compatibility)
    positions = [
      { x: Math.floor(x), y: Math.floor(y) }, // Top-left
      { x: Math.ceil(x), y: Math.floor(y) }, // Top-right
      { x: Math.floor(x), y: Math.ceil(y) }, // Bottom-left
      { x: Math.ceil(x), y: Math.ceil(y) }, // Bottom-right
    ];
  }

  // Check if any corner is in a wall or door
  return positions.some((pos) => {
    // Handle wrapping for edge positions
    let checkX = pos.x;
    let checkY = pos.y;

    // Wrap around horizontally if at edges
    if (checkX < 0) checkX = MAZE_WIDTH - 1;
    if (checkX >= MAZE_WIDTH) checkX = 0;

    // Wrap around vertically if at edges
    if (checkY < 0) checkY = MAZE_HEIGHT - 1;
    if (checkY >= MAZE_HEIGHT) checkY = 0;

    const cell = state.maze[checkY][checkX];
    return cell === 1 || cell === 4; // 1 is wall, 4 is door
  });
}

// Check if moving one step in a direction would cause a collision
export function wouldCollide(pos: { x: number; y: number }, direction: string): boolean {
  const testPos = { ...pos };
  const step = 1; // Test one full tile ahead

  switch (direction) {
    case 'UP':
      testPos.y -= step;
      break;
    case 'DOWN':
      testPos.y += step;
      break;
    case 'LEFT':
      testPos.x -= step;
      break;
    case 'RIGHT':
      testPos.x += step;
      break;
    default:
      return false;
  }

  return checkCollision(testPos.x, testPos.y, direction);
}

// Try to move in the current direction, returns true if movement was possible
function tryMove(
  currentPos: { x: number; y: number },
  direction: string,
  amount: number,
): { x: number; y: number } | null {
  const newPos = { ...currentPos };

  switch (direction) {
    case 'UP':
      newPos.y -= amount;
      break;
    case 'DOWN':
      newPos.y += amount;
      break;
    case 'LEFT':
      newPos.x -= amount;
      break;
    case 'RIGHT':
      newPos.x += amount;
      break;
    default:
      return null;
  }

  // Handle wrapping at edges
  if (newPos.x < 0) {
    // Check if the rightmost position is not a wall
    if (!checkCollision(MAZE_WIDTH - 1, newPos.y, direction)) {
      newPos.x = MAZE_WIDTH - 1;
    }
  } else if (newPos.x >= MAZE_WIDTH) {
    // Check if the leftmost position is not a wall
    if (!checkCollision(0, newPos.y, direction)) {
      newPos.x = 0;
    }
  }

  if (newPos.y < 0) {
    // Check if the bottom position is not a wall
    if (!checkCollision(newPos.x, MAZE_HEIGHT - 1, direction)) {
      newPos.y = MAZE_HEIGHT - 1;
    }
  } else if (newPos.y >= MAZE_HEIGHT) {
    // Check if the top position is not a wall
    if (!checkCollision(newPos.x, 0, direction)) {
      newPos.y = 0;
    }
  }

  // Check if new position would cause a collision
  if (checkCollision(newPos.x, newPos.y, direction)) {
    // If we would hit a wall, try to align to grid
    const alignedPos = {
      x: Math.round(currentPos.x),
      y: Math.round(currentPos.y),
    };

    // Only return aligned position if it doesn't cause a collision
    if (!checkCollision(alignedPos.x, alignedPos.y, direction)) {
      return alignedPos;
    }
    return null;
  }

  return newPos;
}

// Add this new function to check if we can make a turn at the current position
function canTurnAtPosition(pos: { x: number; y: number }, direction: string): boolean {
  // Convert position to grid coordinates
  const gridX = Math.round(pos.x);
  const gridY = Math.round(pos.y);

  // Check if the desired direction is clear
  const testPos = { x: gridX, y: gridY };
  return !wouldCollide(testPos, direction);
}

function gameLoop(time: number): void {
  const deltaTime = Math.min((time - lastTime) / 1000, 0.1); // Cap at 100ms to prevent large jumps
  lastTime = time;

  const state = getState();

  // Stop processing movement if game is not in PLAYING state
  if (state.gameStatus !== 'PLAYING') {
    requestAnimationFrame(gameLoop);
    return;
  }

  const moveAmount = speed * deltaTime;

  // Handle queued direction first
  if (state.queuedDirection) {
    const nearX = Math.abs(state.pacManPosition.x - Math.round(state.pacManPosition.x)) < 0.2;
    const nearY = Math.abs(state.pacManPosition.y - Math.round(state.pacManPosition.y)) < 0.2;

    // Try to turn if we're near a grid position and the path is clear
    if (nearX && nearY && canTurnAtPosition(state.pacManPosition, state.queuedDirection)) {
      // Snap to grid when turning to prevent path drift
      setState({
        direction: state.queuedDirection,
        queuedDirection: null,
        pacManPosition: {
          x: Math.round(state.pacManPosition.x),
          y: Math.round(state.pacManPosition.y),
        },
      });
    }
  }

  if (state.direction) {
    const newPosition = tryMove(state.pacManPosition, state.direction, moveAmount);
    if (newPosition) {
      setState({ pacManPosition: newPosition });
      // Check for dot collection after movement
      state.update();
    } else {
      // We hit a wall, try the queued direction if we have one
      if (state.queuedDirection && canTurnAtPosition(state.pacManPosition, state.queuedDirection)) {
        setState({
          direction: state.queuedDirection,
          queuedDirection: null,
          pacManPosition: {
            x: Math.round(state.pacManPosition.x),
            y: Math.round(state.pacManPosition.y),
          },
        });
      }
    }
  }

  // Update ghost positions
  state.updateGhosts(deltaTime);

  // Request next frame
  requestAnimationFrame(gameLoop);
}

export function startGameLoop(): void {
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

export function stopGameLoop(): void {
  // Could add cancelAnimationFrame here if needed
}

export function setSpeed(newSpeed: number): void {
  // Clamp speed between 1 and 10 tiles per second
  speed = Math.max(1, Math.min(10, newSpeed));
}

// Start the game loop
startGameLoop();

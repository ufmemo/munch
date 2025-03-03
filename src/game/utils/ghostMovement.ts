import { GhostState, Position } from '../types';
import { GhostMode } from '../types/gameStatus';
import { Direction, OppositeDirection } from '../types/movement';

import { MazeCell, MAZE_WIDTH, MAZE_HEIGHT } from './constants';

export function tryMoveGhost(ghost: GhostState, amount: number, maze: number[][]): Position | null {
  const newPos = { x: ghost.x, y: ghost.y };

  switch (ghost.direction) {
    case Direction.UP:
      newPos.y -= amount;
      break;
    case Direction.DOWN:
      newPos.y += amount;
      break;
    case Direction.LEFT:
      newPos.x -= amount;
      break;
    case Direction.RIGHT:
      newPos.x += amount;
      break;
    default:
      return null;
  }

  // Handle wrapping at edges
  if (newPos.x < 0) {
    newPos.x = MAZE_WIDTH - 1;
  } else if (newPos.x >= MAZE_WIDTH) {
    newPos.x = 0;
  }

  if (newPos.y < 0) {
    newPos.y = MAZE_HEIGHT - 1;
  } else if (newPos.y >= MAZE_HEIGHT) {
    newPos.y = 0;
  }

  // Check if new position would cause a collision with a wall
  if (ghostWouldCollide(newPos, ghost.direction, maze)) {
    return null;
  }

  return newPos;
}

function ghostWouldCollide(pos: Position, direction: Direction, maze: number[][]): boolean {
  const checkPos = { ...pos };
  const threshold = 0.45; // Threshold for collision detection

  switch (direction) {
    case Direction.UP:
      checkPos.y -= threshold;
      break;
    case Direction.DOWN:
      checkPos.y += threshold;
      break;
    case Direction.LEFT:
      checkPos.x -= threshold;
      break;
    case Direction.RIGHT:
      checkPos.x += threshold;
      break;
  }

  // Convert to grid coordinates
  const gridX = Math.round(checkPos.x);
  const gridY = Math.round(checkPos.y);

  // Check if position is a wall (ghosts can pass through doors)
  if (gridX >= 0 && gridX < MAZE_WIDTH && gridY >= 0 && gridY < MAZE_HEIGHT) {
    const cell = maze[gridY][gridX];
    return cell === MazeCell.WALL; // Remove the check for DOOR
  }

  return false;
}

export function chooseNewGhostDirection(
  ghost: GhostState,
  pacmanPos: Position,
  maze: number[][],
): Direction {
  const availableDirections: Direction[] = [];
  const directions = Object.values(Direction);

  // Check all directions except the opposite of current direction
  for (const dir of directions) {
    if (dir !== OppositeDirection[ghost.direction]) {
      const testPos = { x: ghost.x, y: ghost.y };
      switch (dir) {
        case Direction.UP:
          testPos.y -= 1;
          break;
        case Direction.DOWN:
          testPos.y += 1;
          break;
        case Direction.LEFT:
          testPos.x -= 1;
          break;
        case Direction.RIGHT:
          testPos.x += 1;
          break;
      }

      if (!ghostWouldCollide(testPos, dir, maze)) {
        availableDirections.push(dir);
      }
    }
  }

  // If no available directions, allow reversing
  if (availableDirections.length === 0) {
    return OppositeDirection[ghost.direction];
  }

  // In CHASE or FRIGHTENED mode, use targeting logic
  if (ghost.mode === GhostMode.CHASE) {
    return getBestDirectionToTarget(ghost, pacmanPos, availableDirections, true);
  }

  if (ghost.mode === GhostMode.FRIGHTENED) {
    // For frightened mode, we want to move away from Pacman
    return getBestDirectionToTarget(ghost, pacmanPos, availableDirections, false);
  }

  // For other modes, choose a random direction
  return availableDirections[Math.floor(Math.random() * availableDirections.length)];
}

function getBestDirectionToTarget(
  ghost: GhostState,
  target: Position,
  availableDirections: Direction[],
  isChasing: boolean,
): Direction {
  // No directions available, return current direction
  if (availableDirections.length === 0) {
    return ghost.direction;
  }

  let [bestDir] = availableDirections;
  let bestScore = isChasing ? Infinity : -Infinity;

  // Calculate current distance to target (Pacman)
  const currentDistance = Math.abs(ghost.x - target.x) + Math.abs(ghost.y - target.y);

  // Make decision based on current distance and available directions
  for (const dir of availableDirections) {
    const testPos = { x: ghost.x, y: ghost.y };
    switch (dir) {
      case Direction.UP:
        testPos.y -= 1;
        break;
      case Direction.DOWN:
        testPos.y += 1;
        break;
      case Direction.LEFT:
        testPos.x -= 1;
        break;
      case Direction.RIGHT:
        testPos.x += 1;
        break;
    }

    // Calculate Manhattan distance to target
    const distance = Math.abs(testPos.x - target.x) + Math.abs(testPos.y - target.y);

    // Calculate how good this direction is based on mode
    let dirScore: number;

    if (isChasing) {
      // CHASE mode: lower score is better (want to minimize distance)

      // Add aggression factor - the closer the ghost is, the more aggressive
      // Gradually decreases from 1 to 0.5 as distance increases
      const aggressionFactor = Math.max(0.5, 1 - distance / 20);

      // Adjust score: shorter distances are better, more aggressive when closer
      dirScore = distance * aggressionFactor;

      // Preferred directions (slight preference for keeping current direction for smoother movement)
      if (dir === ghost.direction) {
        dirScore *= 0.9; // 10% preference for current direction
      }

      // Update best direction if this one is better (lower score)
      if (dirScore < bestScore) {
        bestScore = dirScore;
        bestDir = dir;
      }
    } else {
      // FRIGHTENED mode: higher score is better (want to maximize distance)

      // Add evasion factor - more evasive the closer Pacman is
      // Scales from 1.5 (when close) down to 1.0 (when far)
      const evasionFactor = 1 + Math.min(0.5, 5 / Math.max(1, currentDistance));

      // Add randomness to make movement less predictable
      // Higher randomness when closer to make it harder to predict
      const randomFactor = Math.random() * (1 + 5 / Math.max(1, currentDistance));

      // Adjust score: longer distances and more randomness are better when frightened
      dirScore = distance * evasionFactor + randomFactor;

      // Update best direction if this one is better (higher score)
      if (dirScore > bestScore) {
        bestScore = dirScore;
        bestDir = dir;
      }
    }
  }

  return bestDir;
}

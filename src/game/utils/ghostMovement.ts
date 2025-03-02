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

  // Check if position is a wall or door
  if (gridX >= 0 && gridX < MAZE_WIDTH && gridY >= 0 && gridY < MAZE_HEIGHT) {
    const cell = maze[gridY][gridX];
    return cell === MazeCell.WALL || cell === MazeCell.DOOR;
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

  // In CHASE mode, choose direction that brings ghost closer to Pacman
  if (ghost.mode === GhostMode.CHASE) {
    return getBestDirectionToTarget(ghost, pacmanPos, availableDirections);
  }

  // For other modes, choose a random direction
  return availableDirections[Math.floor(Math.random() * availableDirections.length)];
}

function getBestDirectionToTarget(
  ghost: GhostState,
  target: Position,
  availableDirections: Direction[],
): Direction {
  let [bestDir] = availableDirections;
  let bestDistance = Infinity;

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
    if (distance < bestDistance) {
      bestDistance = distance;
      bestDir = dir;
    }
  }

  return bestDir;
}

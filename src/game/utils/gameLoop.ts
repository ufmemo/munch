import { GameStatus } from '@game/types/gameStatus';
import { Direction } from '@game/types/movement';
import { Position } from '@game/types/position';
import { getState, setState } from '@state/gameState';
import { MAZE_WIDTH, MAZE_HEIGHT, GAME_CONFIG, MazeCell } from '@utils/constants';

let lastTime = 0;
let speed = GAME_CONFIG.speedLevels[0].pacman;

function checkCollision(pos: Position, direction: Direction | null = null): boolean {
  const state = getState();
  let positions: Position[] = [];

  if (direction) {
    // Only check corners in the direction of movement
    switch (direction) {
      case Direction.UP:
        positions = [
          { x: Math.floor(pos.x), y: Math.floor(pos.y) },
          { x: Math.ceil(pos.x), y: Math.floor(pos.y) },
        ];
        break;
      case Direction.DOWN:
        positions = [
          { x: Math.floor(pos.x), y: Math.ceil(pos.y) },
          { x: Math.ceil(pos.x), y: Math.ceil(pos.y) },
        ];
        break;
      case Direction.LEFT:
        positions = [
          { x: Math.floor(pos.x), y: Math.floor(pos.y) },
          { x: Math.floor(pos.x), y: Math.ceil(pos.y) },
        ];
        break;
      case Direction.RIGHT:
        positions = [
          { x: Math.ceil(pos.x), y: Math.floor(pos.y) },
          { x: Math.ceil(pos.x), y: Math.ceil(pos.y) },
        ];
        break;
    }
  } else {
    positions = [
      { x: Math.floor(pos.x), y: Math.floor(pos.y) },
      { x: Math.ceil(pos.x), y: Math.floor(pos.y) },
      { x: Math.floor(pos.x), y: Math.ceil(pos.y) },
      { x: Math.ceil(pos.x), y: Math.ceil(pos.y) },
    ];
  }

  return positions.some((pos) => {
    let checkX = pos.x;
    let checkY = pos.y;

    if (checkX < 0) checkX = MAZE_WIDTH - 1;
    if (checkX >= MAZE_WIDTH) checkX = 0;
    if (checkY < 0) checkY = MAZE_HEIGHT - 1;
    if (checkY >= MAZE_HEIGHT) checkY = 0;

    const cell = state.maze[checkY][checkX];
    return cell === MazeCell.WALL || cell === MazeCell.DOOR;
  });
}

export function wouldCollide(pos: Position, direction: Direction): boolean {
  const testPos = { ...pos };
  const step = 1;

  switch (direction) {
    case Direction.UP:
      testPos.y -= step;
      break;
    case Direction.DOWN:
      testPos.y += step;
      break;
    case Direction.LEFT:
      testPos.x -= step;
      break;
    case Direction.RIGHT:
      testPos.x += step;
      break;
  }

  return checkCollision(testPos, direction);
}

function tryMove(pos: Position, direction: Direction, amount: number): Position | null {
  const newPos = { ...pos };

  switch (direction) {
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
  }

  // Handle wrapping at edges
  if (newPos.x < 0) {
    if (!checkCollision({ ...newPos, x: MAZE_WIDTH - 1 }, direction)) {
      newPos.x = MAZE_WIDTH - 1;
    }
  } else if (newPos.x >= MAZE_WIDTH) {
    if (!checkCollision({ ...newPos, x: 0 }, direction)) {
      newPos.x = 0;
    }
  }

  if (newPos.y < 0) {
    if (!checkCollision({ ...newPos, y: MAZE_HEIGHT - 1 }, direction)) {
      newPos.y = MAZE_HEIGHT - 1;
    }
  } else if (newPos.y >= MAZE_HEIGHT) {
    if (!checkCollision({ ...newPos, y: 0 }, direction)) {
      newPos.y = 0;
    }
  }

  if (checkCollision(newPos, direction)) {
    const alignedPos = {
      x: Math.round(pos.x),
      y: Math.round(pos.y),
    };

    if (!checkCollision(alignedPos, direction)) {
      return alignedPos;
    }
    return null;
  }

  return newPos;
}

function canTurnAtPosition(pos: Position, direction: Direction): boolean {
  const gridX = Math.round(pos.x);
  const gridY = Math.round(pos.y);
  const testPos = { x: gridX, y: gridY };
  return !wouldCollide(testPos, direction);
}

function gameLoop(time: number): void {
  const deltaTime = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  const state = getState();

  if (state.gameStatus !== GameStatus.PLAYING) {
    requestAnimationFrame(gameLoop);
    return;
  }

  const moveAmount = speed * deltaTime;

  if (state.queuedDirection) {
    const nearX = Math.abs(state.pacManPosition.x - Math.round(state.pacManPosition.x)) < 0.2;
    const nearY = Math.abs(state.pacManPosition.y - Math.round(state.pacManPosition.y)) < 0.2;

    if (nearX && nearY && canTurnAtPosition(state.pacManPosition, state.queuedDirection)) {
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
      state.update();
    } else if (
      state.queuedDirection &&
      canTurnAtPosition(state.pacManPosition, state.queuedDirection)
    ) {
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

  state.updateGhosts(deltaTime);
  requestAnimationFrame(gameLoop);
}

export function startGameLoop(): void {
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

export function setSpeed(newSpeed: number): void {
  speed = Math.max(
    GAME_CONFIG.speedLevels[0].pacman,
    Math.min(GAME_CONFIG.speedLevels[2].pacman, newSpeed),
  );
}

startGameLoop();

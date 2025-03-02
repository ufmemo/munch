import useGameState from '@state/gameState';

test('initial game state', () => {
  const state = useGameState.getState();
  expect(state.score).toBe(0);
  expect(state.lives).toBe(3);
  expect(state.level).toBe(1);
});

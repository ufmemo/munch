import { JSX, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import Board from '@components/Board';
import useGameState from '@state/gameState';
import { keydownHandler } from '@utils/keyHandler';

import './App.css';
import './index.css';

// Styled component
const Container = styled.div`
  text-align: center;
`;

const App = (): JSX.Element => {
  const { resetGame, gameStatus } = useGameState();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => keydownHandler(resetGame, gameStatus)(e),
    [resetGame, gameStatus],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const preventDefault = (e: KeyboardEvent): void => {
      if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', preventDefault);
    return () => {
      window.removeEventListener('keydown', preventDefault);
    };
  }, []);

  return (
    <Container>
      <Board />
    </Container>
  );
};

export default App;

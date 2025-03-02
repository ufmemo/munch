import { render } from '@testing-library/react';
import Maze from './Maze';

test('renders Maze component', () => {
  const { getByText } = render(<Maze />);
  expect(getByText('Maze')).toBeTruthy();
});

import { render } from '@testing-library/react';
import Maze from '@components/Maze';

test('renders Maze component', () => {
  const { getByText } = render(<Maze />);
  expect(getByText('Maze')).toBeTruthy();
});

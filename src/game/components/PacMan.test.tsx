import { render } from '@testing-library/react';
import PacMan from './PacMan';

test('renders PacMan component', () => {
  const { getByText } = render(<PacMan />);
  expect(getByText('Pac-Man')).toBeTruthy();
});
